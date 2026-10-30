"use client";
// Search-as-you-type over /search-index.json (lib/browse.ts): one static file
// built with each release, fetched the first time the box is focused; photos
// follow from /search-images.json. A keystroke never reaches a server.
// Suggestions in three groups, like RiftCompare's: brands, routine steps and
// products (photo, brand, stars, price), then "see every result".
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { CATEGORIES } from "@/site";
import { useRegion } from "./RegionPicker";
import { money } from "@/lib/format";
import { imageUrl, loadImages, loadIndex, norm, searchRows, type IndexRow } from "@/lib/browse";
import { Stars } from "./reviews/Stars";

export { norm, searchRows, type IndexRow };

/** Words that point at a routine step. */
const STEP_WORDS: Record<string, string[]> = {
  cleansers: ["cleanser", "cleansing", "foam", "balm", "double cleanse", "face wash"],
  toners: ["toner", "pad", "mist"],
  serums: ["serum", "essence", "ampoule"],
  moisturisers: ["moisturiser", "moisturizer", "cream", "lotion", "emulsion"],
  sunscreen: ["sunscreen", "sun", "spf", "suncream", "sun stick"],
  masks: ["mask", "sheet"],
  "eye-care": ["eye"],
  "lip-care": ["lip"],
  makeup: ["makeup", "cushion", "tint", "bb", "foundation", "primer"],
  "body-hair": ["body", "hair", "shampoo", "hand cream"],
};

type Brand = { name: string; slug: string; count: number; key: string };
type Item = { href: string; kind: "brand" | "step" | "product" | "all" };

function brandsOf(rows: IndexRow[]): Brand[] {
  const by = new Map<string, Brand>();
  for (const r of rows) {
    if (!r[6]) continue;
    const b = by.get(r[6]) ?? { name: r[5], slug: r[6], count: 0, key: norm(`${r[5]} ${r[11] ?? ""}`) };
    b.count++;
    by.set(r[6], b);
  }
  return [...by.values()].sort((a, b) => b.count - a.count);
}

export function SearchBox({ big = false }: { big?: boolean }) {
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<IndexRow[] | null>(null);
  const [imgs, setImgs] = useState<string[] | null>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const region = useRegion();
  const box = useRef<HTMLDivElement>(null);
  const listId = useId();

  useEffect(() => {
    const close = (e: MouseEvent) => box.current && !box.current.contains(e.target as Node) && setOpen(false);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  const start = () => {
    setOpen(true);
    if (!rows) loadIndex().then((r) => {
      setRows(r);
      loadImages().then(setImgs);
    });
  };

  const brands = useMemo(() => (rows ? brandsOf(rows) : []), [rows]);
  const pos = useMemo(() => new Map(rows?.map((r, i) => [r[0], i]) ?? []), [rows]);
  const nq = norm(q);
  const products = useMemo(() => (rows ? searchRows(rows, q, 6) : []), [rows, q]);
  const brandHits = useMemo(() => (nq.length < 2 ? [] : brands.filter((b) => b.key.split(" ").some((w) => w.startsWith(nq)) || b.key.startsWith(nq)).slice(0, 3)), [brands, nq]);
  const stepHits = useMemo(
    () => (nq.length < 2 ? [] : CATEGORIES.filter((c) => c.key !== "other" && (norm(c.name).startsWith(nq) || STEP_WORDS[c.key]?.some((w) => w.startsWith(nq) || nq.split(" ").includes(w)))).slice(0, 2)),
    [nq],
  );
  const total = useMemo(() => (rows && nq.length > 1 ? searchRows(rows, q, 10_000).length : 0), [rows, q, nq]);

  const items: Item[] = [
    ...brandHits.map((b) => ({ href: `/brands/${b.slug}`, kind: "brand" as const })),
    ...stepHits.map((c) => ({ href: `/${c.key}`, kind: "step" as const })),
    ...products.map((r) => ({ href: `/product/${r[0]}`, kind: "product" as const })),
    ...(total > products.length ? [{ href: `/search?q=${encodeURIComponent(q.trim())}`, kind: "all" as const }] : []),
  ];
  const idx = (href: string) => items.findIndex((i) => i.href === href);
  const rowCls = (href: string) => `flex items-center gap-3 rounded-lg px-3 py-2 ${idx(href) === active ? "bg-subtle" : "hover:bg-subtle"}`;
  const empty = !nq;

  return (
    <div ref={box} className="relative w-full">
      <form
        role="search"
        action="/search"
        onSubmit={(e) => {
          const it = items[active];
          if (it) {
            e.preventDefault();
            window.location.href = it.href;
          }
        }}
        className={`flex items-center gap-2 rounded-full border border-line bg-card pl-4 pr-1.5 focus-within:border-soft ${big ? "py-2" : "py-1"}`}
      >
        <svg aria-hidden width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="shrink-0 text-soft"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
        <input
          name="q"
          value={q}
          onFocus={start}
          onChange={(e) => {
            setQ(e.target.value);
            setActive(-1);
            start();
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActive((a) => Math.min(a + 1, items.length - 1));
            }
            if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((a) => Math.max(a - 1, -1));
            }
            if (e.key === "Escape") setOpen(false);
          }}
          placeholder={big ? "Search a brand, product or ingredient…" : "Search K-beauty…"}
          aria-label="Search Korean skincare"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          role="combobox"
          autoComplete="off"
          className={`min-w-0 flex-1 bg-transparent font-sans text-ink placeholder:text-soft focus:outline-none ${big ? "text-lg" : "text-sm"}`}
        />
        <button type="submit" className={`btn-buy rounded-full font-semibold ${big ? "px-6 py-2" : "px-4 py-1 text-sm"}`}>
          Search
        </button>
      </form>
      {open && (
        <div className="card absolute left-0 right-0 top-full z-50 mt-2 max-h-[75vh] overflow-auto p-1.5 text-left shadow-lg" id={listId}>
          {!rows && <p className="px-3 py-2 text-sm text-soft">Loading the product list…</p>}
          {rows && empty && (
            <div className="p-2">
              <p className="eyebrow mb-2 px-1">Popular brands</p>
              <div className="flex flex-wrap gap-1.5">
                {brands.slice(0, 10).map((b) => (
                  <a key={b.slug} href={`/brands/${b.slug}`} className="rounded-full border border-line px-3 py-1 text-sm hover:border-soft">{b.name}</a>
                ))}
              </div>
              <p className="eyebrow mb-2 mt-3 px-1">Shop by step</p>
              <div className="flex flex-wrap gap-1.5">
                {CATEGORIES.filter((c) => c.key !== "other").map((c) => (
                  <a key={c.key} href={`/${c.key}`} className="rounded-full bg-subtle px-3 py-1 text-sm hover:bg-accent-pale">{c.name}</a>
                ))}
              </div>
              <a href="/popular" className="mt-3 block px-1 text-sm font-semibold text-accent-deep">See what&apos;s popular →</a>
            </div>
          )}
          {rows && !empty && nq.length < 2 && <p className="px-3 py-2 text-sm text-soft">Keep typing…</p>}
          {rows && nq.length > 1 && !items.length && <p className="px-3 py-2 text-sm text-soft">Nothing matches yet. Try the brand&apos;s name or a step like toner.</p>}
          {(brandHits.length > 0 || stepHits.length > 0) && (
            <ul className="border-b border-line pb-1">
              {brandHits.map((b) => (
                <li key={b.slug}>
                  <a href={`/brands/${b.slug}`} onMouseEnter={() => setActive(idx(`/brands/${b.slug}`))} className={rowCls(`/brands/${b.slug}`)}>
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg tint-lavender text-xs font-bold">{b.name.slice(0, 2).toUpperCase()}</span>
                    <span className="min-w-0 flex-1 truncate text-sm"><b className="font-semibold">{b.name}</b> <span className="text-soft">· brand</span></span>
                    <span className="text-xs text-soft">{b.count} products</span>
                  </a>
                </li>
              ))}
              {stepHits.map((c) => (
                <li key={c.key}>
                  <a href={`/${c.key}`} onMouseEnter={() => setActive(idx(`/${c.key}`))} className={rowCls(`/${c.key}`)}>
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg tint-mint text-base" aria-hidden>✦</span>
                    <span className="min-w-0 flex-1 truncate text-sm"><b className="font-semibold">{c.name}</b> <span className="text-soft">· every {c.plural.replace(/^Korean /, "")} compared</span></span>
                  </a>
                </li>
              ))}
            </ul>
          )}
          {products.length > 0 && (
            <ul className="pt-1">
              {products.map((r) => {
                const href = `/product/${r[0]}`;
                const img = imageUrl(imgs?.[pos.get(r[0]) ?? -1], 120);
                const short = r[5] && r[1].startsWith(r[5]) ? r[1].slice(r[5].length).trim() : r[1];
                return (
                  <li key={r[0]}>
                    <a href={href} onMouseEnter={() => setActive(idx(href))} className={rowCls(href)}>
                      <span className="h-11 w-11 shrink-0 overflow-hidden rounded-lg border border-line bg-white">
                        {img && <img src={img} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" className="h-full w-full object-contain text-transparent" />}
                      </span>
                      <span className="min-w-0 flex-1">
                        {r[5] && <span className="eyebrow block truncate text-[10px]">{r[5]}</span>}
                        <span className="block truncate text-sm font-medium">{short}</span>
                        {r[8] > 0 && (
                          <span className="flex items-center gap-1 text-xs text-soft">
                            <Stars value={r[7] / 10} size={11} /> {r[8]}
                          </span>
                        )}
                      </span>
                      {r[4][region] != null ? (
                        <span className="shrink-0 text-sm font-semibold tabular-nums text-accent-deep">{money(r[4][region]!, region)}</span>
                      ) : (
                        <span className="shrink-0 text-xs text-soft">Not in stock here</span>
                      )}
                    </a>
                  </li>
                );
              })}
            </ul>
          )}
          {total > products.length && (
            <a
              href={`/search?q=${encodeURIComponent(q.trim())}`}
              onMouseEnter={() => setActive(idx(`/search?q=${encodeURIComponent(q.trim())}`))}
              className={`mt-1 block rounded-lg px-3 py-2 text-center text-sm font-semibold text-accent-deep ${items[active]?.kind === "all" ? "bg-subtle" : "hover:bg-subtle"}`}
            >
              See all {total.toLocaleString("en-US")} results, with filters →
            </a>
          )}
        </div>
      )}
    </div>
  );
}
