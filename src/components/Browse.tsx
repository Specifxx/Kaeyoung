"use client";
// Filter and sort bar for a product list (category, brand and search pages).
// The page's own server-rendered list (children) is what Google and a first
// visit see; once the shopper touches a control, the list is redrawn here
// from the static /search-index.json (lib/browse.ts). No request reaches a
// function, and nothing is written to the URL of a static page.
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { CATEGORIES } from "@/site";
import { applyFilters, imageUrl, loadImages, loadIndex, NO_FILTERS, SORTS, type Filters, type IndexRow, type SortKey } from "@/lib/browse";
import { money } from "@/lib/format";
import { useRegion } from "./RegionPicker";
import { Stars } from "./reviews/Stars";

const STEP = 48;

/** `cat`: a category key; `brand`: a brand page slug (both fix the scope). */
export function Browse({ cat = "", brand = "", search = false, children }: { cat?: string; brand?: string; search?: boolean; children?: ReactNode }) {
  const region = useRegion();
  const [rows, setRows] = useState<IndexRow[] | null>(null);
  const [imgs, setImgs] = useState<string[] | null>(null);
  const [f, setF] = useState<Filters>({ ...NO_FILTERS, cat });
  const [touched, setTouched] = useState(search);
  const [shown, setShown] = useState(STEP);

  const need = () => {
    if (!rows) loadIndex().then((r) => {
      setRows(r);
      loadImages().then(setImgs);
    });
  };
  // The search page starts from ?q= (read in the browser; the page is static).
  useEffect(() => {
    if (!search) return;
    const q = new URLSearchParams(window.location.search).get("q") ?? "";
    setF((x) => ({ ...x, q }));
    need();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const set = (patch: Partial<Filters>) => {
    setF((x) => ({ ...x, ...patch }));
    setTouched(true);
    setShown(STEP);
    need();
  };

  const scope = useMemo(() => (rows ?? []).filter((r) => (!cat || r[2] === cat) && (!brand || r[6] === brand)), [rows, cat, brand]);
  const brands = useMemo(() => {
    const c = new Map<string, number>();
    for (const r of scope) if (r[5]) c.set(r[5], (c.get(r[5]) ?? 0) + 1);
    return [...c.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }, [scope]);
  const result = useMemo(() => (rows ? applyFilters(scope, f, region) : []), [rows, scope, f, region]);
  const pos = useMemo(() => new Map(rows?.map((r, i) => [r[0], i]) ?? []), [rows]);
  const rated = useMemo(() => scope.some((r) => r[8] > 0), [scope]);

  const sel = "rounded-full border border-line bg-card px-3 py-1.5 text-sm focus:border-accent focus:outline-none";
  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-2" role="group" aria-label="Filter and sort">
        <input
          value={f.q}
          onChange={(e) => set({ q: e.target.value })}
          onFocus={need}
          placeholder={search ? "Search K-beauty…" : "Filter by name…"}
          aria-label="Filter by name"
          className={`${sel} min-w-0 flex-1 basis-48 px-4`}
          autoFocus={search}
        />
        <select value={f.sort} onChange={(e) => set({ sort: e.target.value as SortKey })} aria-label="Sort" className={sel}>
          {SORTS.map((s) => (
            <option key={s.key} value={s.key}>{s.label}</option>
          ))}
        </select>
        {!cat && (
          <select value={f.cat} onChange={(e) => set({ cat: e.target.value })} onFocus={need} aria-label="Product type" className={sel}>
            <option value="">Every type</option>
            {CATEGORIES.map((c) => (
              <option key={c.key} value={c.key}>{c.name}</option>
            ))}
          </select>
        )}
        {!brand && (
          <select value={f.brand} onChange={(e) => set({ brand: e.target.value })} onFocus={need} aria-label="Brand" className={`${sel} max-w-[12rem]`}>
            <option value="">Every brand</option>
            {brands.map(([b, n]) => (
              <option key={b} value={b}>{b} ({n})</option>
            ))}
          </select>
        )}
        <select value={f.minStars} onChange={(e) => set({ minStars: Number(e.target.value) })} aria-label="Rating" className={sel} disabled={!!rows && !rated}>
          <option value={0}>Any rating</option>
          <option value={4}>4★ and up</option>
          <option value={3}>3★ and up</option>
        </select>
        <label className={`${sel} flex cursor-pointer items-center gap-2`}>
          <input type="checkbox" checked={f.inStock} onChange={(e) => set({ inStock: e.target.checked })} className="accent-[rgb(var(--accent))]" />
          In stock near me
        </label>
        {touched && (
          <button
            type="button"
            onClick={() => {
              setF({ ...NO_FILTERS, cat });
              setTouched(search);
            }}
            className="px-2 text-sm font-semibold text-accent-deep"
          >
            Clear
          </button>
        )}
      </div>

      {!touched ? (
        children
      ) : !rows ? (
        <p className="card p-6 text-center text-soft">Loading products…</p>
      ) : (
        <>
          <p className="mb-3 text-sm text-soft" aria-live="polite">
            {result.length.toLocaleString("en-US")} product{result.length === 1 ? "" : "s"}
            {f.q.trim() ? ` matching “${f.q.trim()}”` : ""}
          </p>
          {result.length ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
              {result.slice(0, shown).map((r) => (
                <RowTile key={r[0]} r={r} img={imageUrl(imgs?.[pos.get(r[0]) ?? -1], 400)} />
              ))}
            </div>
          ) : (
            <p className="card p-6 text-center text-soft">Nothing matches. Try fewer filters.</p>
          )}
          {result.length > shown && (
            <div className="mt-8 text-center">
              <button type="button" onClick={() => setShown((s) => s + STEP)} className="rounded-full border border-line bg-card px-6 py-2 text-sm font-semibold hover:border-soft">
                Show more ({(result.length - shown).toLocaleString("en-US")} left)
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/** ProductTile's look, from an index row. */
function RowTile({ r, img }: { r: IndexRow; img: string | null }) {
  const region = useRegion();
  const p = r[4][region];
  const short = r[5] && r[1].startsWith(r[5]) ? r[1].slice(r[5].length).trim() : r[1];
  return (
    <a href={`/product/${r[0]}`} className="card tile-hover group flex flex-col overflow-hidden">
      <div className="relative aspect-square bg-gradient-to-b from-white to-subtle">
        {img ? (
          <img src={img} alt={r[1]} loading="lazy" decoding="async" referrerPolicy="no-referrer" className="h-full w-full object-contain p-4 text-transparent transition-transform duration-300 group-hover:scale-[1.03]" />
        ) : (
          <div className="grid h-full place-items-center text-xs font-medium text-soft">{r[5] || "K-beauty"}</div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 border-t border-line p-3">
        {r[5] && <p className="eyebrow truncate">{r[5]}</p>}
        <h3 className="line-clamp-2 text-[13.5px] font-medium leading-snug text-ink">{short}</h3>
        {r[8] > 0 && (
          <p className="flex items-center gap-1 text-xs text-soft">
            <Stars value={r[7] / 10} size={12} /> {r[8]}
          </p>
        )}
        <p className="mt-auto pt-1 text-sm">
          {p != null ? <span className="text-[15px] font-semibold tabular-nums text-accent-deep">{money(p, region)}</span> : <span className="text-xs text-soft">Not in stock in your region</span>}
        </p>
      </div>
    </a>
  );
}
