// The product page's words about its own prices (lib/product-facts.ts): a summary paragraph, one row per region and,
// where a product comes in several sizes, the price per unit of each. Server HTML only: no script, no fetch, and the
// one region-dependent part (the sizes) is switched by the same CSS classes as the price table.
import Link from "next/link";
import { REGIONS, REGION_BY_CODE, type RegionCode } from "@/site";
import { STORE_BY_ID } from "@/content/stores";
import { money, pct } from "@/lib/format";
import { summarySentences, unitOf, type RegionFacts, type SizeRow } from "@/lib/product-facts";
import type { Product } from "@/lib/types";

const storeName = (id: string) => STORE_BY_ID[id]?.name ?? id;

export function ProductFacts({ f, facts, sizes, updatedAt, kind }: { f: Product; facts: RegionFacts[]; sizes: Partial<Record<RegionCode, SizeRow[]>>; updatedAt?: string; kind: string }) {
  const sentences = summarySentences(f, facts, updatedAt, kind);
  if (!sentences.length) return null;
  const u = unitOf(f);
  const showUnit = !!u && facts.some((x) => x.unit != null);
  return (
    <section className="mt-10">
      <h2 className="h-display mb-3 text-2xl">Price summary</h2>
      <p className="text-sm leading-relaxed text-ink">{sentences.join(" ")}</p>
      <div className="card mt-4 overflow-x-auto">
        <table className="pf">
          <caption className="sr-only">{f.name}: lowest and highest in-stock price by region</caption>
          <thead>
            <tr>
              <th scope="col">Region</th>
              <th scope="col">Lowest in stock</th>
              <th scope="col">Highest in stock</th>
              <th scope="col">In stock</th>
              {showUnit && <th scope="col">{u!.per.replace(/^per/, "Per")}</th>}
            </tr>
          </thead>
          <tbody>
            {facts.map((x) => (
              <tr key={x.region}>
                <th scope="row">{REGION_BY_CODE[x.region].name}</th>
                <td>
                  {x.low ? (
                    <>
                      <span className="font-semibold tabular-nums">{money(x.low.p, x.region)}</span> <span className="text-soft">at {storeName(x.low.s)}</span>
                    </>
                  ) : (
                    <span className="text-soft">Sold out</span>
                  )}
                </td>
                <td className="tabular-nums">
                  {x.high && x.inStock > 1 ? (
                    <>
                      {money(x.high.p, x.region)}
                      {x.gapShare ? <span className="text-soft"> (+{pct(x.gap / x.low!.p)})</span> : null}
                    </>
                  ) : (
                    <span className="text-soft">–</span>
                  )}
                </td>
                <td className="whitespace-nowrap tabular-nums">
                  {x.inStock} of {x.listed}
                </td>
                {showUnit && <td className="tabular-nums">{x.unit != null ? money(x.unit, x.region) : <span className="text-soft">–</span>}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {u &&
        REGIONS.map((r) => {
          const rows = sizes[r.code];
          if (!rows || rows.length < 2) return null;
          return (
            <div key={r.code} className={`rp rp-${r.code} mt-6`}>
              <h3 className="h-display mb-2 text-lg">Sizes compared {r.phrase}</h3>
              <div className="card overflow-x-auto">
                <table className="pf">
                  <thead>
                    <tr>
                      <th scope="col">Size</th>
                      <th scope="col">Lowest in stock</th>
                      <th scope="col">{u.per.replace(/^per/, "Per")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.f.ean}>
                        <th scope="row">
                          {row.f.ean === f.ean ? (
                            <span>{row.size} (this page)</span>
                          ) : (
                            <Link prefetch={false} href={`/product/${row.f.slug}`} className="text-accent-deep hover:underline">
                              {row.size}
                            </Link>
                          )}
                        </th>
                        <td>
                          <span className="font-semibold tabular-nums">{money(row.low.p, r.code)}</span> <span className="text-soft">at {storeName(row.low.s)}</span>
                        </td>
                        <td className="whitespace-nowrap tabular-nums">
                          {money(row.unit, r.code)}
                          {row.best && <span className="ml-2 font-semibold text-save">Best value</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
    </section>
  );
}
