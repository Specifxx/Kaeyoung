import Link from "next/link";
import { REGION_BY_CODE, type RegionCode } from "@/site";
import { bestIn, spreadIn, storeName } from "@/lib/data";
import { money, pct } from "@/lib/format";
import { storeUrl } from "@/lib/affiliate";
import type { Product } from "@/lib/types";

/** One region's table: product, lowest price, where, how many stores, the saving. Cheapest first. */
export function PriceList({ region, products }: { region: RegionCode; products: Product[] }) {
  const rows = products
    .map((f) => ({ f, b: bestIn(f, region)!, s: spreadIn(f, region) }))
    .filter((x) => x.b)
    .sort((a, b) => a.b.offer.p - b.b.offer.p);
  if (!rows.length) return <p className="card p-6 text-center text-soft">No store {REGION_BY_CODE[region].phrase} has these in stock today.</p>;
  return (
    <div className="overflow-x-auto rounded-xl border border-line bg-card">
      <table className="w-full min-w-[560px] text-sm">
        <thead className="border-b border-line text-left text-xs uppercase tracking-wider text-soft">
          <tr>
            <th className="px-4 py-3 font-semibold">Product</th>
            <th className="px-4 py-3 font-semibold">Lowest price</th>
            <th className="px-4 py-3 font-semibold">Cheapest at</th>
            <th className="px-4 py-3 text-right font-semibold">Stores</th>
            <th className="px-4 py-3 text-right font-semibold">Save</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map(({ f, b, s }) => (
            <tr key={f.ean}>
              <td className="px-4 py-2.5">
                <Link prefetch={false} href={`/product/${f.slug}`} className="font-medium hover:underline">
                  {f.name}
                </Link>
              </td>
              <td className="whitespace-nowrap px-4 py-2.5 font-semibold tabular-nums">{money(b.offer.p, region)}</td>
              <td className="px-4 py-2.5">
                <a href={storeUrl(b.offer.s, b.offer.u)} target="_blank" rel="nofollow noopener" className="hover:underline">
                  {storeName(b.offer.s)}
                </a>
              </td>
              <td className="px-4 py-2.5 text-right tabular-nums">{b.stores}</td>
              <td className="px-4 py-2.5 text-right tabular-nums text-save">{s != null && s >= 0.05 ? pct(s) : "–"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
