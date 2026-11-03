import type { Metadata } from "next";
import Link from "next/link";
import { CAT_BY_KEY, REGIONS, SITE, type CatKey } from "@/site";
import { activeStores, catCounts, dealsIn, getBrands, getMeta, getProducts, newestIn } from "@/lib/data";
import { popularNow } from "@/lib/ratings";
import { ago } from "@/lib/format";
import { SearchBox } from "@/components/SearchBox";
import { CreatorsCornerBadge } from "@/components/creators/CreatorsCornerBadge";
import { RegionChips } from "@/components/RegionPicker";
import { TileGrid } from "@/components/ProductTile";
import { Section } from "@/components/Section";
import { ACTIVE_REGIONS } from "@/lib/regions";
import { CAT_TINT, CatIcon, HeroArt } from "@/components/Art";
import { POST_BY_SLUG } from "@/content/blog";
import { GUIDES } from "@/lib/guides";
import { JsonLd, faqLd, siteLd } from "@/lib/seo";
import { SiteReviews } from "@/components/site-reviews/SiteReviews";

export const metadata: Metadata = {
  // 60 characters, keyword first, brand last (SEO audit, 2026-11-03).
  title: { absolute: `Korean Skincare Price Comparison: K-Beauty Stores | ${SITE.name}` },
  description: SITE.description,
  alternates: { canonical: "/" },
};

/**
 * The homepage's step tiles (owner, 2026-11-01: no "Toners & pads" on the homepage, so it doesn't put men off).
 * The basics anyone uses lead; "More K-beauty" (sets, tools, gifts) takes the toner tile's place. The /toners hub,
 * nav entry and guides stay.
 */
const HOME_STEPS: CatKey[] = ["cleansers", "moisturisers", "sunscreen", "serums", "body-hair", "masks", "eye-care", "lip-care", "makeup", "other"];

const FAQ: [string, string][] = [
  [
    "Where is the cheapest place to buy Korean skincare?",
    "It depends on the product and where you live: a different K-beauty store is cheapest for different products, and prices move every week. We compare every store's own price for the same barcode, size by size, every day, and show the cheapest in-stock store first for your country.",
  ],
  [
    "Are the products genuine?",
    "We only list specialist K-beauty stores selling new, sealed product, never open marketplaces where fakes hide. A listing is matched only by the Korean barcode on the box, so testers, samples, short-dated and damaged stock are left out.",
  ],
  [
    "Do the prices include shipping?",
    "No. They are each store's listed item price in its own currency, never converted. Shipping and free-delivery thresholds differ by store, so check the checkout before you buy.",
  ],
  [
    "Which countries do you compare?",
    "The United States, the United Kingdom, Canada, Australia, New Zealand and Europe. Each country compares only the stores that sell there in its own currency.",
  ],
];

export default function Home() {
  const meta = getMeta();
  const total = getProducts().length;
  const stores = Object.keys(activeStores()).length;
  const counts = catCounts();
  const brands = getBrands().slice(0, 16);
  // The Holiday Edit line goes to the gift sets post once it is live (it is dated), else to today's deals.
  const giftHref = POST_BY_SLUG["kbeauty-gift-sets"] ? "/blog/kbeauty-gift-sets" : "/deals";
  return (
    <>
      <section className="ky-hero wash relative overflow-hidden border-b border-line">
        {/* The holiday look (1 November to Boxing Day, src/lib/season.ts): quiet snow in rose and gold. Hidden otherwise. */}
        <span className="ky-snow" aria-hidden="true" />
        <div className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-6 px-4 pb-10 pt-10 md:grid-cols-[1.15fr_1fr] md:pb-12 md:pt-14">
          <div className="min-w-0">
            {/* The creators hub, above the fold (owner, 2026-11-03): top-right corner of the hero from sm, a pill above the holiday line on a phone. */}
            <CreatorsCornerBadge />
            <p className="ky-holiday mb-4">
              <Link prefetch={false} href={giftHref} className="ky-holiday-pill">
                <span className="ky-flake" aria-hidden="true" />
                <b>The Holiday Edit</b>
                <span className="hidden sm:inline">· K-beauty gift sets, cheapest store first →</span>
              </Link>
            </p>
            <p className="eyebrow mb-4 text-accent-deep">Korean skincare price comparison</p>
            <h1 className="h-display max-w-3xl text-[2.4rem] leading-[1.05] sm:text-6xl">
              Stay young. <span className="italic text-accent">Pay less.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-soft">
              Every K-beauty store&apos;s price for the same product, side by side. {stores ? `${stores} stores` : "Real stores"}, matched by the barcode on the box and checked every day.
            </p>
            <RegionChips className="mt-6" />
            <div className="mt-4 max-w-xl">
              <SearchBox big />
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-2 text-sm text-soft">
              <span className="rounded-full bg-card/80 px-3 py-1 ring-1 ring-line"><b className="font-semibold text-ink">{total.toLocaleString("en-US")}</b> products</span>
              <span className="rounded-full bg-card/80 px-3 py-1 ring-1 ring-line"><b className="font-semibold text-ink">{stores}</b> stores</span>
              <span className="rounded-full bg-card/80 px-3 py-1 ring-1 ring-line"><b className="font-semibold text-ink">{ACTIVE_REGIONS.length}</b> countries</span>
              {meta && <span className="rounded-full bg-card/80 px-3 py-1 ring-1 ring-line">Checked {ago(meta.updatedAt)}</span>}
            </div>
          </div>
          <div className="relative">
            <HeroArt className="mx-auto w-full max-w-[300px] md:max-w-[440px]" />
            <span className="ky-flakes" aria-hidden="true">
              <span className="ky-flake" />
              <span className="ky-flake" />
              <span className="ky-flake" />
              <span className="ky-deco ky-tree" />
              <span className="ky-deco ky-cane" />
              <span className="ky-deco ky-stocking ky-stocking-1" />
              <span className="ky-deco ky-stocking ky-stocking-2" />
            </span>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4">
        <section className="mt-10">
          <h2 className="h-display mb-4 text-2xl">Shop by step</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {HOME_STEPS.map((k) => CAT_BY_KEY[k]).filter((c) => counts[c.key] > 0).map((c) => (
              <Link prefetch={false} key={c.key} href={`/${c.key}`} className={`tile-hover flex items-center gap-3 rounded-2xl px-3.5 py-3.5 ${CAT_TINT[c.key]}`}>
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-card/80">
                  <CatIcon cat={c.key} size={36} />
                </span>
                <span className="min-w-0">
                  <span className="block font-display text-[15.5px] font-medium sm:text-[17px] leading-tight">{c.name}</span>
                  <span className="mt-0.5 block text-xs tabular-nums text-soft">{counts[c.key].toLocaleString("en-US")} compared</span>
                </span>
              </Link>
            ))}
          </div>
        </section>

        {REGIONS.map((r) => {
          const deals = dealsIn(r.code, 8).map((d) => d.f);
          const pop = popularNow(r.code, 8);
          const fresh = newestIn(r.code, 8);
          return (
            <div key={r.code} className={`rp rp-${r.code}`}>
              {pop.length > 0 && (
                <Section title={`Popular ${r.phrase}`} sub="The K-beauty staples: stocked by the most stores and rated by shoppers." href="/popular" more="All popular">
                  <TileGrid products={pop} region={r.code} />
                </Section>
              )}
              {deals.length > 0 && (
                <Section title={`Biggest savings ${r.phrase}`} sub="Same barcode, same size, at least 10% cheaper at one store." href="/deals" more="All deals">
                  <TileGrid products={deals} region={r.code} />
                </Section>
              )}
              {fresh.length > 0 && (
                <Section title="New arrivals" href="/new" more="Everything new">
                  <TileGrid products={fresh} region={r.code} />
                </Section>
              )}
              {!deals.length && !pop.length && (
                <p className="card mt-10 p-6 text-center text-soft">No store {r.phrase} has products in stock right now. Try another region.</p>
              )}
            </div>
          );
        })}

        {brands.length > 0 && (
          <Section title="Popular brands" href="/brands" more="All brands">
            <ul className="flex flex-wrap gap-2">
              {brands.map((b) => (
                <li key={b.slug}>
                  <Link prefetch={false} href={`/brands/${b.slug}`} className="inline-flex items-center gap-2 rounded-full border border-line bg-card px-4 py-2 text-sm font-medium transition hover:border-soft">
                    {b.name} <span className="text-xs text-soft">{b.products.length}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </Section>
        )}

        <section className="mt-16">
          <h2 className="h-display mb-6 text-2xl sm:text-3xl">How KaeYoung works</h2>
          <ol className="grid gap-4 sm:grid-cols-3">
            {[
              ["Matched by barcode", "Every listing is matched on the barcode printed on the box, size by size. No barcode, no match: we never guess from a title."],
              ["Real K-beauty stores", "Specialist Korean skincare shops selling new, sealed product. No open marketplaces, where fakes hide. Paid links are labelled."],
              ["Checked every day", "Prices and stock are re-read daily, and each product keeps its price history, so you can tell a real deal from a usual price."],
            ].map(([t, d], i) => (
              <li key={t} className={`rounded-2xl p-5 ${["tint-rose", "tint-lavender", "tint-mint"][i]}`}>
                <span className="text-sm font-semibold tabular-nums text-accent-deep">0{i + 1}</span>
                <h3 className="h-display mt-1 text-xl">{t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-soft">{d}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-16">
          <h2 className="h-display mb-4 text-2xl sm:text-3xl">Price guides</h2>
          <ul className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
            {GUIDES.map((g) => (
              <li key={g.slug}>
                <Link prefetch={false} href={`/guides/${g.slug}`} className="font-medium text-ink underline-offset-4 hover:underline">
                  {g.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* The site's own star score and approved reviews (owner, 2026-11-03), loaded in the browser; nothing until there is a rating. */}
        <SiteReviews className="mt-16" />

        <section className="mt-16 max-w-3xl">
          <h2 className="h-display mb-4 text-2xl sm:text-3xl">Questions</h2>
          <div className="space-y-5">
            {FAQ.map(([q, a]) => (
              <div key={q}>
                <h3 className="font-semibold">{q}</h3>
                <p className="mt-1 text-sm leading-relaxed text-soft">{a}</p>
              </div>
            ))}
          </div>
        </section>
        <JsonLd data={siteLd()} />
        <JsonLd data={faqLd(FAQ)} />
      </div>
    </>
  );
}
