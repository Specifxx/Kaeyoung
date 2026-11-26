import Link from "next/link";
import { REGIONS } from "@/site";
import { getProducts, storeName } from "@/lib/data";
import { beatRows, beatSummary, MIN_STORES } from "@/lib/price-to-beat";
import { money, pct } from "@/lib/format";

// "The price to beat" (DECISIONS.md, 2026-11-26): per region, the products the most stores sell today, the cheapest
// in-stock store's item price beside the typical store's. Server HTML, one region shown by CSS like every price.
export function PriceToBeat({ event, limit = 15 }: { event: string; limit?: number }) {
  const products = getProducts();
  return (
    <section className="mt-10">
      <h2 className="font-display text-xl font-semibold">The price to beat this {event}</h2>
      {REGIONS.map((r) => {
        const rows = beatRows(products, r.code);
        const s = beatSummary(rows);
        if (!s) return null;
        return (
          <div key={r.code} className={`rp rp-${r.code}`}>
            <p className="mt-2 max-w-3xl text-sm text-soft">
              A sale is measured against the store&apos;s own price. Across the {s.products.toLocaleString("en-US")} products {MIN_STORES} or more
              stores have in stock {r.phrase} today, the cheapest store is typically {pct(s.medianGap)} under the median store, and on{" "}
              {pct(s.over20)} of them it is 20% or more under. So &quot;20% off&quot; at a typical store can still cost more than an ordinary day
              elsewhere. Here are the products the most stores sell: a sale price above the cheapest isn&apos;t beating an ordinary day at another store.
            </p>
            <table className="mt-4 w-full text-left text-sm">
              <thead className="text-xs text-soft">
                <tr>
                  <th className="py-2 pr-2 font-medium">Product</th>
                  <th className="py-2 pr-2 text-right font-medium">Cheapest today</th>
                  <th className="py-2 text-right font-medium">Typical store</th>
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, limit).map((row) => (
                  <tr key={row.f.slug} className="border-t border-line align-top">
                    <td className="py-2 pr-2">
                      <Link prefetch={false} href={`/product/${row.f.slug}`} className="underline-offset-2 hover:underline">
                        {row.f.name}
                      </Link>
                      <span className="block text-xs text-soft">{row.stores} stores</span>
                    </td>
                    <td className="whitespace-nowrap py-2 pr-2 text-right">
                      <span className="font-semibold">{money(row.low, r.code)}</span>
                      <span className="block text-xs text-soft">{storeName(row.lowStore)}</span>
                    </td>
                    <td className="whitespace-nowrap py-2 text-right">
                      {money(row.typical, r.code)}
                      {row.gap >= 0.05 ? <span className="block text-xs text-soft">{pct((row.typical - row.low) / row.low)} more</span> : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-2 text-xs text-soft">Item prices in stock when we last read each store, before shipping. Check the store before you buy.</p>
          </div>
        );
      })}
    </section>
  );
}
