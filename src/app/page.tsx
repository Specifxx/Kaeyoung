import type { Metadata } from "next";
import Link from "next/link";
import { CAT_BY_KEY, REGIONS, SITE, type CatKey } from "@/site";
import { activeStores, catCounts, dealsIn, getBrands, getMeta, getProducts, newestIn, productsOfCat } from "@/lib/data";
import { popularNow } from "@/lib/ratings";
import { homeFeaturedIn } from "@/lib/featured";
import { ago } from "@/lib/format";
import { CHRISTMAS_FESTIVE_LAYER } from "@/lib/season";
import { SearchBox } from "@/components/SearchBox";
import { CreatorsCornerBadge } from "@/components/creators/CreatorsCornerBadge";
import { RegionChips } from "@/components/RegionPicker";
import { TileGrid } from "@/components/ProductTile";
import { Section } from "@/components/Section";
import { ACTIVE_REGIONS } from "@/lib/regions";
import { CAT_TINT, CatIcon } from "@/components/Art";
import { HeroPicks } from "@/components/HeroPicks";
import { CategoryGrid } from "@/components/explore/CategoryGrid";
import { RecentlyViewed } from "@/components/explore/RecentlyViewed";
import { topPhotos } from "@/lib/explore";
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
  const all = getProducts();
  const total = all.length;
  const stores = Object.keys(activeStores()).length;
  const counts = catCounts();
  const brands = getBrands().slice(0, 16);
  // The Holiday Edit line goes to the gift sets post once it is live (it is dated), else to today's deals.
  const giftHref = POST_BY_SLUG["kbeauty-gift-sets"] ? "/blog/kbeauty-gift-sets" : "/deals";
  return (
    <>
      <section className="ky-hero wash relative overflow-hidden border-b border-line">
        {/* The motion layer (owner, 2026-11-06): a slowly drifting wash. Decoration only; globals.css "motion" block. */}
        <span className="mo-bg mo-aurora" aria-hidden="true" />
        <div className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-6 px-4 pb-8 pt-7 md:grid-cols-[1.15fr_1fr] md:pb-10 md:pt-10">
          <div className="min-w-0">
            {/* The creators hub, above the fold (owner, 2026-11-03): top-right corner of the hero from sm, a pill above the holiday line on a phone. */}
            <CreatorsCornerBadge />
            <p className="ky-holiday mb-4">
              {CHRISTMAS_FESTIVE_LAYER ? (
                <Link prefetch={false} href={giftHref} className="ky-holiday-pill ky-gift-banner">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="8" width="18" height="4" rx="1" /><path d="M5 12v8h14v-8M12 8v12M12 8c-2.5 0-4-1-4-2.5S9 3 10.5 4 12 8 12 8zm0 0c2.5 0 4-1 4-2.5S15 3 13.5 4 12 8 12 8z" /></svg>
                  <span className="ky-gb-text"><b>Christmas gift guide</b><span className="hidden sm:inline"> · K-beauty gift sets, cheapest store first</span></span>
                  <span className="ky-gb-go" aria-hidden="true">→</span>
                </Link>
              ) : (
                <Link prefetch={false} href={giftHref} className="ky-holiday-pill">
                  <b>The Holiday Edit</b>
                  <span className="hidden sm:inline">· K-beauty gift sets, cheapest store first →</span>
                </Link>
              )}
            </p>
            <p className="mo-enter eyebrow mb-4 text-accent-deep" style={{ ["--mo-d" as string]: 0 }}>Korean skincare price comparison</p>
            <h1 className="mo-enter h-display max-w-3xl [--mo-d:1] text-[2.4rem] leading-[1.05] sm:text-6xl">
              Stay young. <span className="mo-shine italic text-accent">Pay less.</span>
            </h1>
            <p className="mo-enter mt-5 max-w-xl text-lg leading-relaxed text-soft" style={{ ["--mo-d" as string]: 2 }}>
              Every K-beauty store&apos;s price for the same product, side by side. {stores ? `${stores} stores` : "Real stores"}, matched by the barcode on the box and checked every day.
            </p>
            <RegionChips className="mo-enter mt-6 [--mo-d:2]" />
            <div className="mo-enter mt-4 max-w-xl" style={{ ["--mo-d" as string]: 3 }}>
              <SearchBox big />
            </div>
            <div className="mo-enter mt-6 flex flex-wrap items-center gap-2 text-sm text-soft" style={{ ["--mo-d" as string]: 4 }}>
              <span className="rounded-full bg-card/80 px-3 py-1 ring-1 ring-line"><b className="font-semibold text-ink">{total.toLocaleString("en-US")}</b> products</span>
              <span className="rounded-full bg-card/80 px-3 py-1 ring-1 ring-line"><b className="font-semibold text-ink">{stores}</b> stores</span>
              <span className="rounded-full bg-card/80 px-3 py-1 ring-1 ring-line"><b className="font-semibold text-ink">{ACTIVE_REGIONS.length}</b> countries</span>
              {meta && <span className="rounded-full bg-card/80 px-3 py-1 ring-1 ring-line">Checked {ago(meta.updatedAt)}</span>}
            </div>
          </div>
          {/* Two popular products with price and stores, right of the copy from md, under the search on a phone
              (owner, 2026-11-05): the site's job shown, not described. The hero art it replaces stays in Art.tsx. */}
          <div className="mo-enter relative mx-auto w-full max-w-md md:max-w-none" style={{ ["--mo-d" as string]: 3 }}>
            <HeroPicks />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4">
        {/* Category first (2026-11-10, PriceRunner-style): every step as a photo tile of its own most popular products. */}
        <section className="mt-8">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
            <h2 data-reveal className="h-display text-2xl">Shop by step</h2>
            <Link prefetch={false} href="/skin-concerns" className="text-sm font-semibold text-accent-deep underline-offset-4 hover:underline">Shop by skin concern →</Link>
          </div>
          <CategoryGrid
            cards={HOME_STEPS.map((k) => CAT_BY_KEY[k])
              .filter((c) => counts[c.key] > 0)
              .map((c) => ({
                href: `/${c.key}`,
                name: c.name,
                count: counts[c.key],
                imgs: topPhotos(productsOfCat(c.key)),
                icon: <CatIcon cat={c.key} size={56} />,
                tint: CAT_TINT[c.key],
              }))}
          />
        </section>

        {/* The visitor's own last product pages (their browser only): a return visit starts where the last one ended. */}
        <RecentlyViewed prefix="ky" />

        {REGIONS.map((r) => {
          // Only products of about US$20 or more are featured here (owner, 2026-11-06, lib/featured.ts).
          const feat = homeFeaturedIn(r.code, all);
          const deals = dealsIn(r.code, 8, feat).map((d) => d.f);
          const pop = popularNow(r.code, 8, feat);
          const fresh = newestIn(r.code, 8, feat);
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
            <ul data-reveal="stagger" className="flex flex-wrap gap-2">
              {brands.map((b) => (
                <li key={b.slug}>
                  <Link prefetch={false} href={`/brands/${b.slug}`} className="tile-hover inline-flex items-center gap-2 rounded-full border border-line bg-card px-4 py-2 text-sm font-medium transition hover:border-soft">
                    {b.name} <span className="text-xs text-soft">{b.products.length}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </Section>
        )}

        <section className="mt-16">
          <h2 data-reveal className="h-display mb-6 text-2xl sm:text-3xl">How KaeYoung works</h2>
          <ol data-reveal="stagger" className="grid gap-4 sm:grid-cols-3">
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
          <h2 data-reveal className="h-display mb-4 text-2xl sm:text-3xl">Price guides</h2>
          <ul data-reveal className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
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
          <h2 data-reveal className="h-display mb-4 text-2xl sm:text-3xl">Questions</h2>
          <div data-reveal="stagger" className="space-y-5">
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
