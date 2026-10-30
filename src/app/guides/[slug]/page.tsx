import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CAT_BY_KEY, REGIONS, REGION_BY_CODE, type RegionCode } from "@/site";
import { STORES } from "@/content/stores";
import { activeStores, bestIn, dealsIn, getMeta, popularIn, productsOfCat, spreadIn, storeName } from "@/lib/data";
import { GUIDES, GUIDE_BY_SLUG, countryName } from "@/lib/guides";
import { money, niceDate, pct } from "@/lib/format";
import { storeUrl } from "@/lib/affiliate";
import { PageHead } from "@/components/Section";
import type { Product } from "@/lib/types";

export const dynamicParams = false;
export const generateStaticParams = () => GUIDES.map((g) => ({ slug: g.slug }));

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const g = GUIDE_BY_SLUG[params.slug];
  if (!g) return {};
  return { title: g.title, description: g.description, alternates: { canonical: `/guides/${g.slug}` } };
}

/** One region's table: product, lowest price, where, how many stores, the saving. Cheapest first. */
function PriceList({ region, products }: { region: RegionCode; products: Product[] }) {
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

export default function GuidePage({ params }: { params: { slug: string } }) {
  const g = GUIDE_BY_SLUG[params.slug];
  if (!g) notFound();
  const meta = getMeta();
  const updated = meta ? niceDate(meta.updatedAt) : null;

  if (g.kind === "cat") {
    const c = CAT_BY_KEY[g.cat];
    const list = productsOfCat(g.cat);
    return (
      <div className="mx-auto max-w-5xl px-4">
        <PageHead
          eyebrow="Price guide"
          title={g.title}
          sub={
            <p>
              The {c.plural} stocked by the most stores {updated ? `as of ${updated}` : "today"}, cheapest first, with where each is cheapest and how much you save over the dearest store. Same barcode, same size: only the price differs. See every product in{" "}
              <Link prefetch={false} href={`/${c.key}`} className="font-medium text-ink underline underline-offset-4">
                {c.name}
              </Link>
              .
            </p>
          }
        />
        {REGIONS.map((r) => (
          <div key={r.code} className={`rp rp-${r.code}`}>
            <h2 className="h-display mb-3 text-xl">
              {c.plural.replace(/^./, (x) => x.toUpperCase())} prices {r.phrase}
            </h2>
            <PriceList region={r.code} products={popularIn(r.code, 30, list)} />
          </div>
        ))}
        <p className="mt-4 text-xs text-soft">Prices exclude shipping. Change the region at the top of the page to see another country&apos;s stores.</p>
      </div>
    );
  }

  const r = REGION_BY_CODE[g.region];
  const counts = activeStores();
  const stores = STORES.filter((s) => s.region === g.region).sort((a, b) => (counts[b.id] ?? 0) - (counts[a.id] ?? 0));
  const deals = dealsIn(g.region, 15);
  return (
    <div className="mx-auto max-w-5xl px-4">
      <PageHead
        eyebrow="Price guide"
        title={g.title}
        sub={`${stores.length} specialist K-beauty stores sell in ${countryName(g.region)} in ${r.currency}. Here is who they are, which is cheapest for the best-known products, and today's biggest price gaps${updated ? `, as of ${updated}` : ""}.`}
      />
      <section className="mb-10">
        <h2 className="h-display mb-3 text-xl">The stores</h2>
        <ul className="grid gap-2 sm:grid-cols-2">
          {stores.map((s) => (
            <li key={s.id} className="card flex items-center justify-between gap-3 px-4 py-3 text-sm">
              <a href={storeUrl(s.id, s.base)} target="_blank" rel="nofollow noopener" className="font-medium hover:underline">
                {s.name}
              </a>
              <span className="tabular-nums text-soft">{counts[s.id] ? `${counts[s.id].toLocaleString("en-US")} products compared` : "checking"}</span>
            </li>
          ))}
        </ul>
      </section>
      <section className="mb-10">
        <h2 className="h-display mb-3 text-xl">The best-known products, cheapest first</h2>
        <PriceList region={g.region} products={popularIn(g.region, 30)} />
      </section>
      {deals.length > 0 && (
        <section className="mb-10">
          <h2 className="h-display mb-3 text-xl">Today&apos;s biggest price gaps</h2>
          <PriceList region={g.region} products={deals.map((d) => d.f)} />
        </section>
      )}
      <p className="text-xs text-soft">Prices exclude shipping, which differs by store and order size. Every price is the store&apos;s own, in {r.currency}, never converted.</p>
    </div>
  );
}
