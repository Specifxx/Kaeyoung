"use client";
// The basket page's tool: add products, see which single store sells them all
// for the least with its own delivery quote added. Reads two static files
// (/search-index.json and /basket-data/<region>); the basket itself lives in
// this browser only (localStorage), never on a server.
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { REGION_BY_CODE } from "@/site";
import { loadIndex, searchRows, type IndexRow } from "@/lib/browse";
import { cheapestOf, compareBasket, decodeShared, encodeShared, readBasket, writeBasket, type BasketData } from "@/lib/basket";
import { ShareButton } from "./ShareButton";
import { freeLine } from "@/lib/shipping";
import { money } from "@/lib/format";
import { useRegion } from "./RegionPicker";

const dataCache = new Map<string, Promise<BasketData | null>>();
function loadData(region: string) {
  if (!dataCache.has(region))
    dataCache.set(region, fetch(`/basket-data/${region.toLowerCase()}`).then((r) => (r.ok ? r.json() : null)).catch(() => null));
  return dataCache.get(region)!;
}

export function Basket() {
  const region = useRegion();
  const r = REGION_BY_CODE[region];
  const fmt = (m: number) => money(m, region);
  const [index, setIndex] = useState<IndexRow[] | null>(null);
  const [data, setData] = useState<BasketData | null>(null);
  const [own, setOwn] = useState<string[]>([]);
  // A basket someone shared (/basket?b=…, lib/basket.ts): shown as it is, never written over the visitor's own
  // until they choose "Save as my basket". The page is then kept out of the index (it is someone's own list).
  const [shared, setShared] = useState<string[] | null>(null);
  const slugs = shared ?? own;
  const [q, setQ] = useState("");

  useEffect(() => {
    loadIndex().then(setIndex);
    const read = () => setOwn(readBasket());
    read();
    const fromLink = decodeShared(location.search);
    if (fromLink) {
      setShared(fromLink);
      const m = document.createElement("meta");
      m.name = "robots";
      m.content = "noindex, follow";
      document.head.appendChild(m);
    }
    window.addEventListener("ky-basket", read);
    return () => window.removeEventListener("ky-basket", read);
  }, []);
  useEffect(() => {
    // The region starts as "US" until the browser's own is read: a slower
    // answer for the old region must never land after the new one.
    let live = true;
    setData(null);
    loadData(region).then((d) => live && setData(d));
    return () => {
      live = false;
    };
  }, [region]);

  const rowOf = useMemo(() => new Map((index ?? []).map((x, i) => [x[0], i])), [index]);
  const all = slugs.map((s) => rowOf.get(s)).filter((x): x is number => x != null);
  // Items no store in this region has in stock can't be in anyone's total.
  const rows = data ? all.filter((x) => data.offers[x]) : all;
  const missing = data ? all.length - rows.length : 0;
  const results = data && rows.length ? compareBasket(data, rows) : [];
  const full = results.filter((t) => t.has.length === rows.length);
  const partial = results.filter((t) => t.has.length < rows.length).slice(0, 6);
  const hits = index && q.trim().length > 1 ? searchRows(index, q, 8) : [];

  const add = (slug: string) => {
    if (!slugs.includes(slug)) writeBasket([...slugs, slug]);
    setShared(null);
    setQ("");
  };
  const remove = (slug: string) => {
    writeBasket(slugs.filter((s) => s !== slug));
    setShared(null);
  };
  const keepShared = () => {
    if (shared) writeBasket(shared);
    setShared(null);
    history.replaceState(null, "", "/basket");
  };
  const best = full[0] ?? null;
  const shareText = best && best.total != null
    ? `My K-beauty basket: ${rows.length} products for ${fmt(best.total)} delivered at ${best.name}. Every store compared on KaeYoung:`
    : `My K-beauty basket: ${slugs.length} products, every store's price on KaeYoung:`;

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <section className="min-w-0">
        <h2 className="h-display mb-3 text-xl">{shared ? "A shared basket" : "Your basket"}</h2>
        {shared && (
          <p className="mb-3 rounded-xl border border-line bg-subtle px-4 py-3 text-sm">
            Someone shared this basket with you.{" "}
            <button type="button" onClick={keepShared} className="font-semibold text-accent-deep underline">
              Save it as my basket
            </button>
          </p>
        )}
        <label className={shared ? "hidden" : "block"}>
          <span className="sr-only">Add a product</span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Add a product: anua toner, cosrx snail…"
            className="w-full rounded-xl border border-line bg-card px-4 py-2.5 text-[15px] outline-none focus:border-soft"
          />
        </label>
        {!shared && hits.length > 0 && (
          <ul className="mt-2 divide-y divide-line rounded-xl border border-line bg-card text-sm">
            {hits.map((h) => (
              <li key={h[0]}>
                <button type="button" onClick={() => add(h[0])} className="flex w-full items-center justify-between gap-3 px-4 py-2 text-left hover:bg-subtle">
                  <span className="min-w-0 flex-1 truncate">{h[1]}</span>
                  <span className="shrink-0 tabular-nums text-soft">{h[4][region] != null ? `from ${fmt(h[4][region]!)}` : `not ${r.phrase}`}</span>
                  <span className="shrink-0 font-semibold text-accent-deep">Add</span>
                </button>
              </li>
            ))}
          </ul>
        )}
        <ul className="mt-4 space-y-2">
          {slugs.map((s) => {
            const row = rowOf.get(s);
            const x = row != null ? index![row] : null;
            return (
              <li key={s} className="flex items-center gap-3 rounded-xl border border-line bg-card px-3.5 py-2.5 text-sm">
                <Link prefetch={false} href={`/product/${s}`} className="min-w-0 flex-1 truncate font-medium hover:underline">
                  {x ? x[1] : s}
                </Link>
                <span className="shrink-0 text-right tabular-nums text-soft">
                  {(() => {
                    // The cheapest in-stock store for this item in the region, once the prices are in.
                    const c = data && row != null ? cheapestOf(data, row) : null;
                    if (c) return <>{fmt(c.price)}<span className="block text-[11px]">at {c.name}</span></>;
                    return x && x[4][region] != null ? `from ${fmt(x[4][region]!)}` : `not ${r.phrase}`;
                  })()}
                </span>
                {!shared && (
                  <button type="button" onClick={() => remove(s)} className="shrink-0 text-soft hover:text-ink" aria-label={`Remove ${x ? x[1] : s}`}>
                    ✕
                  </button>
                )}
              </li>
            );
          })}
        </ul>
        {!slugs.length && <p className="mt-4 text-sm text-soft">Empty for now. Search above, or press &quot;Add to basket&quot; on any product page.</p>}
        {slugs.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-4">
            <ShareButton title="My K-beauty basket" path={`/basket?b=${encodeShared(slugs)}`} medium="basket" texts={{ [region]: shareText }} />
            {!shared && (
              <button type="button" onClick={() => writeBasket([])} className="text-sm text-soft underline hover:text-ink">
                Empty the basket
              </button>
            )}
          </div>
        )}
      </section>

      <section className="min-w-0">
        <h2 className="h-display mb-3 text-xl">Cheapest single store {r.phrase}</h2>
        {!rows.length ? (
          <p className="card p-6 text-sm text-soft">Add two or more products to see which store sells them all for the least, delivery included.</p>
        ) : !data ? (
          <p className="card p-6 text-sm text-soft">Loading prices…</p>
        ) : (
          <>
            {missing > 0 && (
              <p className="mb-3 text-sm text-soft">
                {missing === 1 ? "One item isn't" : `${missing} items aren't`} in stock at any store {r.phrase}, so {missing === 1 ? "it is" : "they are"} left out of these totals.
              </p>
            )}
            {!full.length && <p className="card p-5 text-sm text-soft">No single store {r.phrase} has everything in stock. These come closest:</p>}
            <ol className="space-y-2">
              {(full.length ? full : partial).map((t, i) => (
                <li key={t.id} className={`rounded-xl border bg-card px-4 py-3 ${i === 0 && full.length ? "border-ink/70" : "border-line"}`}>
                  <div className="flex items-baseline gap-3">
                    <p className="min-w-0 flex-1 font-semibold">{t.name}</p>
                    <p className="text-lg font-semibold tabular-nums">{t.total != null ? fmt(t.total) : fmt(t.subtotal)}</p>
                  </div>
                  <p className="mt-0.5 text-xs text-soft">
                    {t.has.length < rows.length && `${t.has.length} of ${rows.length} items · `}
                    {fmt(t.subtotal)} items
                    {t.total != null
                      ? t.delivery
                        ? ` + ${fmt(t.delivery)} delivery to ${t.ship!.to}`
                        : ` + free delivery to ${t.ship!.to}`
                      : t.ship
                        ? ` + delivery (${fmt(t.ship.fee)} or free: ${freeLine(t.ship, fmt) ?? "check at checkout"})`
                        : " + delivery (we don't have this store's quote: check at checkout)"}
                    {t.ship && t.delivery && t.total != null && freeLine(t.ship, fmt) ? ` · ${freeLine(t.ship, fmt)}` : ""}
                  </p>
                </li>
              ))}
            </ol>
            <p className="mt-3 text-xs leading-relaxed text-soft">
              Item prices are each store&apos;s own at our last daily check, in stock only. Delivery is the store&apos;s own quote for a small order to one city in your region, checked weekly; your address can change it. Stores with a known
              total come first. The store&apos;s checkout is always the final price.
            </p>
          </>
        )}
      </section>
    </div>
  );
}

/** The product page's button: adds this product to the basket. */
export function AddToBasket({ slug }: { slug: string }) {
  const [inBasket, setIn] = useState(false);
  useEffect(() => {
    const read = () => setIn(readBasket().includes(slug));
    read();
    window.addEventListener("ky-basket", read);
    return () => window.removeEventListener("ky-basket", read);
  }, [slug]);
  return inBasket ? (
    <Link prefetch={false} href="/basket" className="btn-pop mt-3 inline-flex border border-line bg-card px-5 py-2 text-sm text-ink hover:border-soft">
      In your basket · compare stores →
    </Link>
  ) : (
    <button type="button" onClick={() => writeBasket([...readBasket(), slug])} className="btn-pop mt-3 inline-flex border border-line bg-card px-5 py-2 text-sm text-ink hover:border-soft">
      + Add to basket
    </button>
  );
}
