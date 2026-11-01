import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CAT_BY_KEY, REGIONS, SITE, type RegionCode } from "@/site";
import { bestIn, brandKo, cheapestDelivered, getMeta, brandPages, getEbay, getHistory, getProduct, getProducts, productsOfBrand, productsOfCat, regionsOf, spreadIn, storeCount, storeName, variantLabel, variantLabels, variantsOf } from "@/lib/data";
import { dayNumber, lowestOrderable } from "@/lib/history";
import { decimal, money, niceDate, pct } from "@/lib/format";
import { isIndexable } from "@/lib/index-tiers";
import { storeUrl } from "@/lib/affiliate";
import { ProductImage } from "@/components/ProductImage";
import { PriceTable } from "@/components/PriceTable";
import { PriceHistory } from "@/components/Sparkline";
import { RegionTabs } from "@/components/RegionPicker";
import { TileGrid } from "@/components/ProductTile";
import { OutLink } from "@/components/OutLink";
import { AddToBasket } from "@/components/Basket";
import { ReportPrice } from "@/components/ReportForms";
import type { Product } from "@/lib/types";
import { reviewsOf, reviewsOpen } from "@/lib/ratings";
import { SCHEMA_MIN_RATINGS, starsText, type ProductReviews } from "@/lib/reviews";
import { Stars } from "@/components/reviews/Stars";
import { ReviewsSection } from "@/components/reviews/ReviewsSection";

// Prerendered at build, one static file per product; a slug the release does
// not know is a 404, never a render on request.
export const dynamicParams = false;
export function generateStaticParams() {
  return getProducts().map((f) => ({ slug: f.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const f = getProduct(params.slug);
  if (!f) return {};
  const n = storeCount(f);
  const lows = regionsOf(f)
    .map((r) => bestIn(f, r))
    .filter((b) => b != null)
    .slice(0, 2)
    .map((b) => `${money(b!.offer.p, b!.region)} ${REGIONS.find((x) => x.code === b!.region)!.phrase}`);
  const title = `${f.name} price: compare ${n} store${n === 1 ? "" : "s"}`;
  const description = `${f.name} prices across ${n} K-beauty stores${lows.length ? `, from ${lows.join(" and ")}` : ""}. Same barcode (${f.ean}), every store side by side, updated daily.`;
  return {
    title,
    description,
    alternates: { canonical: `/product/${f.slug}` },
    robots: isIndexable(f) ? undefined : { index: false, follow: true },
    openGraph: { title, description, url: `/product/${f.slug}`, images: f.img ? [{ url: f.img }] : undefined },
  };
}

export default function ProductPage({ params }: { params: { slug: string } }) {
  const f = getProduct(params.slug);
  if (!f) notFound();
  const cat = CAT_BY_KEY[f.cat];
  const regions = regionsOf(f);
  const ebay = getEbay()[f.ean] ?? {};
  const history = getHistory()[f.ean] ?? {};
  const today = dayNumber(new Date().toISOString().slice(0, 10));
  const hasBrandPage = !!f.b && brandPages().has(f.b);
  const sameBrand = f.b ? productsOfBrand(f.b).filter((x) => x.ean !== f.ean) : [];
  const variants = variantsOf(f).sort((a, b) => variantLabel(a).localeCompare(variantLabel(b), undefined, { numeric: true }));
  const labels = variantLabels([f, ...variants]);
  const ko = brandKo(f.brand);
  const siblings = (sameBrand.length >= 4 ? sameBrand : productsOfCat(f.cat).filter((x) => x.ean !== f.ean))
    .sort((a, b) => storeCount(b) - storeCount(a))
    .slice(0, 8);

  const rated = reviewsOf(f);
  const meta = getMeta();
  const showSchema = !!rated && rated.n >= SCHEMA_MIN_RATINGS;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: f.name,
    gtin13: f.ean,
    brand: f.brand ? { "@type": "Brand", name: f.brand } : undefined,
    category: `Health & Beauty > Skin Care > ${cat.name}`,
    image: f.img ?? undefined,
    url: `${SITE.url}/product/${f.slug}`,
    // Only from a real sample (SCHEMA_MIN_RATINGS), and only what the page shows.
    aggregateRating: showSchema ? { "@type": "AggregateRating", ratingValue: starsText(rated!.avg), ratingCount: rated!.n, reviewCount: rated!.w || undefined, bestRating: 5, worstRating: 1 } : undefined,
    review: showSchema && rated!.reviews.length
      ? rated!.reviews.slice(0, 10).map((r) => ({
          "@type": "Review",
          reviewRating: { "@type": "Rating", ratingValue: r.s, bestRating: 5, worstRating: 1 },
          author: { "@type": "Person", name: r.n },
          datePublished: r.d,
          name: r.t,
          reviewBody: r.b,
        }))
      : undefined,
    offers: regions
      .map((r) => {
        const orderable = (f.offers[r] ?? []).filter((o) => o.st !== "out");
        if (!orderable.length) return null;
        const ps = orderable.map((o) => o.p);
        return {
          "@type": "AggregateOffer",
          priceCurrency: REGIONS.find((x) => x.code === r)!.currency,
          lowPrice: decimal(Math.min(...ps), r),
          highPrice: decimal(Math.max(...ps), r),
          offerCount: orderable.length,
          availability: "https://schema.org/InStock",
        };
      })
      .filter(Boolean),
  };

  return (
    <div className="mx-auto max-w-6xl px-4 pb-28 pt-5 md:pb-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <nav aria-label="Breadcrumb" className="mb-4 text-sm text-soft">
        <Link prefetch={false} href="/" className="hover:text-ink">Home</Link>
        <span className="mx-1.5">/</span>
        <Link prefetch={false} href={`/${cat.key}`} className="hover:text-ink">{cat.name}</Link>
        {hasBrandPage && (
          <>
            <span className="mx-1.5">/</span>
            <Link prefetch={false} href={`/brands/${f.b}`} className="hover:text-ink">{f.brand}</Link>
          </>
        )}
      </nav>

      <section className="grid grid-cols-1 gap-8 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div>
          <div className="card relative mx-auto max-w-[240px] overflow-hidden bg-white sm:max-w-sm md:max-w-none">
            <ProductImage src={f.img} alt={f.name} label={f.brand || "K-beauty"} eager className="relative aspect-square w-full object-contain p-8" />
          </div>
          <p className="mt-2 text-center text-xs text-soft">Photo from a store listing.</p>
        </div>

        <div>
          {f.brand &&
            (hasBrandPage ? (
              <Link prefetch={false} href={`/brands/${f.b}`} className="eyebrow hover:text-ink">
                {f.brand}
                {ko && <span lang="ko" className="ml-1.5 normal-case tracking-normal text-soft">{ko}</span>}
              </Link>
            ) : (
              <p className="eyebrow">
                {f.brand}
                {ko && <span lang="ko" className="ml-1.5 normal-case tracking-normal text-soft">{ko}</span>}
              </p>
            ))}
          <h1 className="h-display mt-1.5 text-3xl leading-tight sm:text-[2.4rem]">{f.name}</h1>
          <div className="mt-3 flex flex-wrap gap-1.5 text-xs">
            <span className="chip bg-subtle text-ink">{cat.name}</span>
            {f.size && <span className="chip bg-subtle text-ink">{f.size}</span>}
            <span className="chip bg-subtle text-soft">Barcode {f.ean}</span>
          </div>
          {rated && rated.n > 0 && (
            <a href="#reviews" className="mt-3 inline-flex items-center gap-2 text-sm text-soft hover:text-ink">
              <Stars value={rated.avg} size={16} />
              <span className="font-semibold tabular-nums text-ink">{starsText(rated.avg)}</span>
              <span className="underline-offset-4 hover:underline">
                {rated.n} rating{rated.n === 1 ? "" : "s"}
                {rated.w ? `, ${rated.w} review${rated.w === 1 ? "" : "s"}` : ""}
              </span>
            </a>
          )}

          {variants.length > 0 && (
            <div className="mt-4">
              <p className="eyebrow mb-1.5">Other sizes and shades</p>
              <ul className="flex max-h-40 flex-wrap gap-1.5 overflow-y-auto text-xs">
                <li>
                  <span aria-current="page" className="chip border border-ink bg-card font-semibold text-ink">{labels.get(f.ean)}</span>
                </li>
                {variants.slice(0, 60).map((v) => (
                  <li key={v.ean}>
                    <Link prefetch={false} href={`/product/${v.slug}`} className="chip border border-line bg-card text-ink hover:border-soft">
                      {labels.get(v.ean)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {regions.length > 1 && (
            <div className="mt-5">
              <p className="eyebrow mb-1.5">Prices in</p>
              <RegionTabs available={regions} />
            </div>
          )}

          {REGIONS.map((r) => {
            const b = bestIn(f, r.code);
            const s = spreadIn(f, r.code);
            return (
              <div key={r.code} className={`rp rp-${r.code} mt-5`}>
                {b ? (
                  <div className="card p-5">
                    <p className="text-sm text-soft">Lowest price {r.phrase}</p>
                    <p className="mt-0.5 text-4xl font-semibold tabular-nums tracking-tight text-ink">{money(b.offer.p, r.code)}</p>
                    <p className="mt-1 text-sm text-soft">
                      at <span className="font-medium text-ink">{storeName(b.offer.s)}</span> · {b.stores} store{b.stores === 1 ? "" : "s"} compared
                      {s != null && s >= 0.05 ? (
                        <>
                          {" "}· <span className="font-semibold text-save">save up to {pct(s)}</span>
                        </>
                      ) : null}
                    </p>
                    <DeliveredLine f={f} region={r.code} />
                    <OutLink
                      href={storeUrl(b.offer.s, b.offer.u)}
                      event={{ source: b.offer.s, region: r.code, placement: "hero", ean: f.ean }}
                      className="btn-pop btn-buy mt-4 px-7 py-2.5 text-[15px]"
                    >
                      Shop at {storeName(b.offer.s)} <span aria-hidden>→</span>
                    </OutLink>
                    <div>
                      <AddToBasket slug={f.slug} />
                    </div>
                  </div>
                ) : (
                  <div className="card p-5 text-sm">
                    <p className="font-semibold">{f.offers[r.code]?.length ? `Sold out at every store ${r.phrase} right now.` : `No store ${r.phrase} lists this product yet.`}</p>
                    {regions.filter((x) => x !== r.code).length > 0 && (
                      <p className="mt-1 text-soft">
                        It is sold {regions.filter((x) => x !== r.code).map((x) => REGIONS.find((y) => y.code === x)!.phrase).join(", ")}: pick a region above, or see the retailers below.
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <div>
          <h2 className="h-display mb-4 text-2xl">Every store&apos;s price</h2>
          {REGIONS.map((r) => (
            <div key={r.code} className={`rp rp-${r.code}`}>
              <PriceTable f={f} region={r.code} ebay={ebay[r.code]} />
            </div>
          ))}
          <p className="mt-3 text-xs leading-relaxed text-soft">
            Prices are what each store&apos;s own site showed at our last daily check{meta ? ` (${niceDate(meta.updatedAt)})` : ""}, before delivery, and they can change at any time: the store&apos;s checkout is always the final price. Delivery
            costs are each store&apos;s own quote for a small order to one city in your region, checked weekly; they can differ for your address. Every store listing here carries this product&apos;s barcode ({f.ean}), so it is the same product and
            size, not a look-alike.{" "}
            <Link prefetch={false} href="/basket" className="font-medium text-accent-deep hover:underline">Buying several products? Compare a whole basket →</Link>
          </p>
          <ReportPrice
            product={`${f.name} (${f.ean})`}
            stores={REGIONS.flatMap((r) => (f.offers[r.code] ?? []).map((o) => ({ name: `${storeName(o.s)} (${r.code})`, price: money(o.p, r.code) })))}
          />
        </div>

        <aside className="space-y-6">
          <div className="card p-5">
            <h2 className="h-display mb-3 text-lg">Price history</h2>
            {REGIONS.map((r) => (
              <div key={r.code} className={`rp rp-${r.code}`}>
                <PriceHistory series={history[r.code]} region={r.code} today={today} />
              </div>
            ))}
          </div>
          <div className="card p-5 text-sm">
            <h2 className="h-display mb-3 text-lg">Product details</h2>
            <dl className="grid grid-cols-[auto_1fr] gap-x-5 gap-y-1.5">
              {f.brand && (
                <>
                  <dt className="text-soft">Brand</dt>
                  <dd>{f.brand}</dd>
                </>
              )}
              <dt className="text-soft">Category</dt>
              <dd>{cat.name}</dd>
              {f.size && (
                <>
                  <dt className="text-soft">Size</dt>
                  <dd>{f.size}</dd>
                </>
              )}
              <dt className="text-soft">Barcode (EAN)</dt>
              <dd className="tabular-nums">{f.ean}</dd>
              <dt className="text-soft">Stores</dt>
              <dd>{storeCount(f)}</dd>
              <dt className="text-soft">First seen</dt>
              <dd>{niceDate(f.first)}</dd>
            </dl>
          </div>
        </aside>
      </section>

      {siblings.length > 0 && (
        <section className="mt-12">
          <h2 className="h-display mb-4 text-2xl">{sameBrand.length >= 4 ? `More from ${f.brand}` : `More ${cat.name.toLowerCase()}`}</h2>
          <TileGrid products={siblings} />
        </section>
      )}

      <ReviewsSection ean={f.ean} slug={f.slug} name={f.name} data={rated} open={reviewsOpen()} />

      <section className="mt-12 max-w-3xl">
        <h2 className="h-display mb-4 text-2xl">Questions</h2>
        <Faq f={f} regions={regions} rated={rated} />
      </section>

      {/* Phone buy bar: the region's cheapest orderable store, always in reach. */}
      {REGIONS.map((r) => {
        const low = lowestOrderable(f.offers[r.code]);
        return (
          <div key={r.code} className={`rp rp-${r.code}`}>
            <div className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-3 border-t border-line bg-card/95 px-4 py-2.5 backdrop-blur md:hidden">
              <div className="min-w-0 flex-1">
                {low ? (
                  <>
                    <p className="truncate text-xs text-soft">Lowest {r.phrase}: {storeName(low.s)}</p>
                    <p className="text-xl font-semibold tabular-nums">{money(low.p, r.code)}</p>
                  </>
                ) : (
                  <p className="text-sm text-soft">No store {r.phrase} has it in stock</p>
                )}
              </div>
              {low && (
                <OutLink href={storeUrl(low.s, low.u)} event={{ source: low.s, region: r.code, placement: "buybar", ean: f.ean }} className="btn-pop btn-buy px-6">
                  Shop
                </OutLink>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** The hero's second line: when delivery changes which store is cheapest. */
function DeliveredLine({ f, region }: { f: Product; region: RegionCode }) {
  const d = cheapestDelivered(f, region);
  if (!d) return null;
  return (
    <p className="mt-2 rounded-lg bg-subtle px-3 py-2 text-sm text-soft">
      With delivery for one item, <span className="font-medium text-ink">{storeName(d.offer.s)}</span> works out cheapest: {money(d.offer.p, region)} + {d.delivery ? money(d.delivery, region) : "free"} delivery ={" "}
      <span className="font-semibold text-ink">{money(d.total, region)}</span> (of the {d.known} stores whose delivery we know).
    </p>
  );
}

function Faq({ f, regions, rated }: { f: Product; regions: RegionCode[]; rated: ProductReviews | undefined }) {
  const qa: [string, string][] = [];
  for (const r of regions) {
    const b = bestIn(f, r);
    const reg = REGIONS.find((x) => x.code === r)!;
    if (b) qa.push([`Where is ${f.name} cheapest ${reg.phrase}?`, `${storeName(b.offer.s)} at ${money(b.offer.p, r)}, the lowest of ${b.stores} store${b.stores === 1 ? "" : "s"} we compared at our last check.`]);
  }
  if (rated && rated.n >= SCHEMA_MIN_RATINGS) {
    qa.push([`What do shoppers rate ${f.name}?`, `${starsText(rated.avg)} out of 5 from ${rated.n} KaeYoung shoppers' ratings, with ${rated.dist[4] + rated.dist[3]} giving it four or five stars.`]);
  }
  qa.push([
    `How do you know every store sells the same ${f.name}?`,
    `We match listings only by the barcode printed on the box (${f.ean}). A listing without that barcode is left out rather than guessed, so other sizes, refills, old packaging and look-alikes never get mixed up.`,
  ]);
  qa.push([
    "Are these prices with shipping?",
    "The prices are each store's own listed price, before delivery, and they are sorted by that price. Under each store we show what delivery cost in that store's own quote for a small order to a city in your region (checked weekly), and from what order total it becomes free, when we know it. Your address can change the cost, so check the store's checkout before you buy. Buying several products? The basket compares whole orders with delivery.",
  ]);
  const ld = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: qa.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <div className="divide-y divide-line rounded-xl border border-line bg-card">
        {qa.map(([q, a]) => (
          <details key={q} className="group px-5 py-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">
              {q}
              <span aria-hidden className="text-soft transition group-open:rotate-45">+</span>
            </summary>
            <p className="mt-2 text-sm leading-relaxed text-soft">{a}</p>
          </details>
        ))}
      </div>
    </>
  );
}
