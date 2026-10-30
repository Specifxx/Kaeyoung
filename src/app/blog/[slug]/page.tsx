import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { REGIONS, SITE, type CatKey, type RegionCode } from "@/site";
import { STORE_BY_ID } from "@/content/stores";
import { LIVE_POSTS, POST_BY_SLUG, type Post, type Section } from "@/content/blog";
import { bestIn, dealsIn, getBrands, getMeta, getProducts, orderableIn, popularIn, productsOfCat, storeName } from "@/lib/data";
import { money, niceDate, pct } from "@/lib/format";
import { storeUrl } from "@/lib/affiliate";
import { PageHead } from "@/components/Section";
import { PriceList } from "@/components/PriceList";
import { CatIcon } from "@/components/Art";
import type { Product } from "@/lib/types";

export const dynamicParams = false;
export const generateStaticParams = () => LIVE_POSTS.map((p) => ({ slug: p.slug }));

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const p = POST_BY_SLUG[params.slug];
  if (!p) return {};
  return {
    title: p.title,
    description: p.description,
    alternates: { canonical: `/blog/${p.slug}` },
    openGraph: { type: "article", title: p.title, description: p.description, publishedTime: p.date, modifiedTime: p.updated },
  };
}

export default function PostPage({ params }: { params: { slug: string } }) {
  const p = POST_BY_SLUG[params.slug];
  if (!p) notFound();
  const meta = getMeta();
  const asOf = meta ? niceDate(meta.updatedAt) : null;
  const Body = BODIES[p.slug];
  const sections = p.sections;
  return (
    <article className="mx-auto max-w-4xl px-4">
      <PageHead
        eyebrow={`Blog · Published ${niceDate(p.date)}${p.updated && p.updated > p.date ? ` · Updated ${niceDate(p.updated)}` : ""}`}
        title={p.title}
        sub={<p>{p.description}</p>}
        art={<CatIcon cat={p.art} size={150} />}
      />
      <div className="prose-ky">{Body ? <Body asOf={asOf} /> : sections ? <Advice post={p} sections={sections} /> : null}</div>
      <aside className="mt-12 space-y-3 rounded-2xl bg-subtle p-5 text-sm text-soft">
        <h2 className="font-semibold text-ink">How this post was made</h2>
        <p>
          Every price table is drawn from the stores&apos; own listings at our daily check{asOf ? ` (last run ${asOf})` : ""}, matched by the barcode on the box, in each store&apos;s own currency and before delivery. Tables refresh every day; the text is
          only changed when we revise it, and then it shows an updated date. Prices change fast, so the store&apos;s own page is always the final word. If you spot a mistake, email{" "}
          <a className="underline" href={`mailto:${SITE.email}?subject=${encodeURIComponent(`Correction: ${p.title}`)}`}>{SITE.email}</a> and we will fix it.
        </p>
        {p.sources?.length ? (
          <div>
            <h3 className="font-semibold text-ink">Sources</h3>
            <ul className="mt-1 list-disc space-y-1 pl-5">
              {p.sources.map((x) => (
                <li key={x.url}>
                  <a href={x.url} target="_blank" rel="noopener" className="underline underline-offset-2 hover:text-ink">{x.title}</a>, {x.by}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        <p>
          Some store links earn us a commission; it never changes the order of prices (<Link prefetch={false} href="/disclosure" className="underline">how we make money</Link>).{" "}
          <Link prefetch={false} href="/blog" className="font-medium text-accent-deep hover:underline">
            More posts →
          </Link>
        </p>
      </aside>
    </article>
  );
}

const P = ({ children }: { children: ReactNode }) => <p className="mb-4 text-[16px] leading-relaxed">{children}</p>;
const H2 = ({ children }: { children: ReactNode }) => <h2 className="h-display mb-3 mt-10 text-2xl">{children}</h2>;
const A = ({ href, children }: { href: string; children: ReactNode }) => (
  <Link prefetch={false} href={href} className="font-medium text-accent-deep underline underline-offset-4">
    {children}
  </Link>
);
const Empty = ({ region }: { region: RegionCode }) => (
  <p className="card p-6 text-center text-soft">Not enough stores {REGIONS.find((r) => r.code === region)!.phrase} sell these yet to compare. Try another country at the top.</p>
);

/** One block per region, shown by the region switch (CSS). */
function PerRegion({ render }: { render: (r: RegionCode) => ReactNode }) {
  return (
    <>
      {REGIONS.map((r) => (
        <div key={r.code} className={`rp rp-${r.code}`}>
          {render(r.code)}
        </div>
      ))}
    </>
  );
}

type BodyProps = { asOf: string | null };

const BODIES: Record<string, (p: BodyProps) => ReactNode> = {
  "brand-stores-vs-kbeauty-shops": BrandStores,
  "korean-skincare-routine-priced": Routine,
  "korean-sunscreen-where-cheapest": Sunscreen,
  "same-product-different-price": Gaps,
  "cosrx-beauty-of-joseon-anua-prices": ThreeBrands,
  "avoid-fake-kbeauty": AvoidFakes,
};

// ---- Brand stores vs K-beauty shops -------------------------------------

type Duel = { f: Product; official: { s: string; p: number; u: string }; shop: { s: string; p: number; u: string } };

/** Products a brand sells from its own store AND at least one specialist shop,
 *  both in stock, in one region: the brand's price against the cheapest shop. */
function duels(region: RegionCode): Duel[] {
  const out: Duel[] = [];
  for (const f of getProducts()) {
    const offers = (f.offers[region] ?? []).filter((o) => o.st === "in");
    const off = offers.filter((o) => STORE_BY_ID[o.s]?.official).sort((a, b) => a.p - b.p)[0];
    const shop = offers.filter((o) => !STORE_BY_ID[o.s]?.official).sort((a, b) => a.p - b.p)[0];
    if (off && shop) out.push({ f, official: off, shop });
  }
  return out.sort((a, b) => (b.official.p - b.shop.p) / b.official.p - (a.official.p - a.shop.p) / a.official.p);
}

function BrandStores() {
  return (
    <>
      <P>
        Most of the big Korean skincare brands now sell from their own online stores: COSRX, Beauty of Joseon, Anua, SKIN1004, Torriden, TIRTIR, Klairs and more. It is natural to assume the brand&apos;s own store is the safe, fair-price choice. We
        checked that against every specialist K-beauty shop that sells the same product, matched by the barcode on the box, so the size and version are identical.
      </P>
      <PerRegion
        render={(r) => {
          const d = duels(r);
          if (!d.length) return <Empty region={r} />;
          const cheaper = d.filter((x) => x.shop.p < x.official.p).length;
          const same = d.filter((x) => x.shop.p === x.official.p).length;
          const savings = d.filter((x) => x.shop.p < x.official.p).map((x) => (x.official.p - x.shop.p) / x.official.p).sort((a, b) => a - b);
          const median = savings.length ? savings[Math.floor(savings.length / 2)] : 0;
          return (
            <>
              <H2>What the prices say</H2>
              <P>
                Of the {d.length} products both a brand store and a K-beauty shop have in stock, a shop is cheaper for <b>{cheaper}</b>
                {same ? `, the price is the same for ${same}` : ""} and the brand&apos;s own store is cheaper for {d.length - cheaper - same}.
                {savings.length ? ` When a shop is cheaper, the typical saving is ${pct(median)} off the brand's own price.` : ""} Brand stores often run their own sales and
                bundles, so check both before you buy; and remember shipping, which brand stores sometimes make free above a lower threshold.
              </P>
              <H2>The biggest differences</H2>
              <div className="overflow-x-auto rounded-2xl border border-line bg-card">
                <table className="w-full min-w-[600px] text-sm">
                  <thead className="border-b border-line text-left text-xs uppercase tracking-wider text-soft">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Product</th>
                      <th className="px-4 py-3 font-semibold">Brand store</th>
                      <th className="px-4 py-3 font-semibold">Cheapest shop</th>
                      <th className="px-4 py-3 text-right font-semibold">Difference</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {d.slice(0, 15).map(({ f, official, shop }) => (
                      <tr key={f.ean}>
                        <td className="px-4 py-2.5">
                          <Link prefetch={false} href={`/product/${f.slug}`} className="font-medium hover:underline">
                            {f.name}
                          </Link>
                        </td>
                        <td className="whitespace-nowrap px-4 py-2.5 tabular-nums">{money(official.p, r)}</td>
                        <td className="px-4 py-2.5">
                          <span className="font-semibold tabular-nums">{money(shop.p, r)}</span>{" "}
                          <a href={storeUrl(shop.s, shop.u)} target="_blank" rel="nofollow noopener" className="text-soft hover:underline">
                            {storeName(shop.s)}
                          </a>
                        </td>
                        <td className={`px-4 py-2.5 text-right tabular-nums ${shop.p < official.p ? "text-save" : "text-soft"}`}>
                          {shop.p < official.p ? `−${pct((official.p - shop.p) / official.p)}` : shop.p === official.p ? "same" : `+${pct((shop.p - official.p) / official.p)}`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          );
        }}
      />
      <P>
        <span className="mt-6 block">
          Every product page on K Young lists the brand&apos;s own store alongside the shops when it sells there, so you never have to check twice. Start with the <A href="/deals">deals list</A> or search for your product at the top.
        </span>
      </P>
    </>
  );
}

// ---- A routine, priced ---------------------------------------------------

const STEPS: { cat: CatKey; label: string; why: string }[] = [
  { cat: "cleansers", label: "Cleanser", why: "removes sunscreen, makeup and the day" },
  { cat: "toners", label: "Toner", why: "rebalances and preps the skin" },
  { cat: "serums", label: "Serum or essence", why: "the targeted step: hydration, brightening or calming" },
  { cat: "moisturisers", label: "Moisturiser", why: "seals it all in" },
  { cat: "sunscreen", label: "Sunscreen", why: "every morning, the step that matters most" },
];

function Routine() {
  return (
    <>
      <P>
        Korean skincare has a reputation for ten-step routines, but most people do five: cleanse, tone, treat, moisturise and protect. Below is each step&apos;s most widely stocked product (the one the most stores carry, usually the safest
        place to start) at the cheapest store in your country today, and what the five cost together.
      </P>
      <PerRegion
        render={(r) => {
          const picks = STEPS.map((s) => {
            const f = popularIn(r, 1, productsOfCat(s.cat).filter((x) => bestIn(x, r)?.offer.st === "in"))[0];
            return { s, f, b: f ? bestIn(f, r) : null };
          });
          const have = picks.filter((x) => x.b);
          if (have.length < 3) return <Empty region={r} />;
          const total = have.reduce((n, x) => n + x.b!.offer.p, 0);
          return (
            <>
              <ol className="mt-6 space-y-3">
                {picks.map(({ s, f, b }, i) => (
                  <li key={s.cat} className="card flex flex-wrap items-center gap-4 p-4">
                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-subtle">
                      <CatIcon cat={s.cat} size={36} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="eyebrow">
                        Step {i + 1} · {s.label}
                      </p>
                      {f && b ? (
                        <Link prefetch={false} href={`/product/${f.slug}`} className="font-medium hover:underline">
                          {f.name}
                        </Link>
                      ) : (
                        <p className="text-soft">No product in stock here today</p>
                      )}
                      <p className="text-xs text-soft">It {s.why}.</p>
                    </div>
                    {b && (
                      <div className="text-right">
                        <p className="text-lg font-semibold tabular-nums text-accent-deep">{money(b.offer.p, r)}</p>
                        <p className="text-xs text-soft">at {storeName(b.offer.s)}</p>
                      </div>
                    )}
                  </li>
                ))}
              </ol>
              <p className="mt-4 rounded-2xl bg-accent-pale px-5 py-4 text-[16px]">
                The {have.length} steps together: <b className="tabular-nums">{money(total, r)}</b> before shipping, each at its own cheapest store. Buying all of them at one store usually costs a little more but saves on shipping.
              </p>
            </>
          );
        }}
      />
      <H2>Cheaper still</H2>
      <P>
        Every step has cheaper choices than the best-stocked one. Each step&apos;s page lists every product we compare, and the price guides show the cheapest of the popular ones: <A href="/guides/cheapest-cleansers">cleansers</A>,{" "}
        <A href="/guides/cheapest-toners">toners</A>, <A href="/guides/cheapest-serums">serums</A>, <A href="/guides/cheapest-moisturisers">moisturisers</A> and <A href="/guides/cheapest-sunscreen">sunscreen</A>.
      </P>
    </>
  );
}

// ---- Sunscreen -------------------------------------------------------------

function Sunscreen() {
  const list = productsOfCat("sunscreen");
  return (
    <>
      <P>
        Korean sunscreens are some of the most-bought K-beauty products abroad, and some of the most widely stocked, so prices for the same tube differ a lot between stores. These are the sunscreens the most stores in your country carry, cheapest
        first, with the cheapest store and how much less it charges than the dearest one.
      </P>
      <PerRegion
        render={(r) => (
          <>
            <H2>Korean sunscreen prices {REGIONS.find((x) => x.code === r)!.phrase}</H2>
            <PriceList region={r} products={popularIn(r, 20, list)} />
          </>
        )}
      />
      <H2>One thing to check</H2>
      <P>
        Sunscreen rules differ by country, so a sunscreen sold in one country can be labelled or formulated differently in another. K Young only ever compares the exact same barcode, so the stores in each row sell the identical product; check
        the store&apos;s listing for the SPF and PA rating you want. Every sunscreen we compare is in <A href="/sunscreen">Sunscreen</A>.
      </P>
    </>
  );
}

// ---- Biggest gaps ------------------------------------------------------------

function Gaps() {
  return (
    <>
      <P>
        The same product, the same size, the same barcode, and one store charges far more than another. That is the whole reason K Young exists. Here are today&apos;s widest gaps in your country among products at least two stores have in stock,
        with the cheapest store first.
      </P>
      <PerRegion
        render={(r) => {
          const d = dealsIn(r, 20);
          return d.length ? (
            <>
              <H2>Biggest gaps today</H2>
              <PriceList region={r} products={d.map((x) => x.f)} />
            </>
          ) : (
            <Empty region={r} />
          );
        }}
      />
      <P>
        <span className="mt-6 block">
          A big gap is usually a sale at one store or an old price at another, so it rarely lasts. The live list is always on <A href="/deals">Deals today</A>.
        </span>
      </P>
    </>
  );
}

// ---- Three brands ------------------------------------------------------------

const BRANDS = ["COSRX", "Beauty of Joseon", "Anua"];

function ThreeBrands() {
  const all = getBrands();
  const found = BRANDS.map((n) => all.find((b) => b.name.toLowerCase() === n.toLowerCase())).filter((b): b is NonNullable<typeof b> => !!b);
  return (
    <>
      <P>
        COSRX, Beauty of Joseon and Anua are three of the most-searched Korean skincare brands outside Korea, and almost every K-beauty store sells them. That makes them the easiest products to overpay for. For each brand, here are its
        best-stocked products in your country, cheapest first, with the store that has the lowest price today.
      </P>
      {found.map((b) => (
        <section key={b.slug}>
          <H2>{b.name}</H2>
          <PerRegion render={(r) => (orderableIn(r, b.products).length ? <PriceList region={r} products={popularIn(r, 12, b.products)} /> : <Empty region={r} />)} />
          <p className="mt-2 text-sm">
            <A href={`/brands/${b.slug}`}>Every {b.name} product we compare</A>
          </p>
        </section>
      ))}
      {!found.length && <P>These brands appear here once the day&apos;s prices are in.</P>}
    </>
  );
}

// ---- Avoiding fakes ------------------------------------------------------------

function AvoidFakes() {
  return (
    <>
      <P>
        Popular Korean skincare is copied. Counterfeits turn up most on open marketplaces, where anyone can list a product, and they can look very close to the real thing. A fake is not just a waste of money: you do not know what is in it.
        Here is what we check, and what you can.
      </P>
      <H2>1. Buy from a store, not a stranger</H2>
      <P>
        Specialist K-beauty stores and the brands&apos; own stores buy their stock from the brand or its distributors. Many brands publish a list of authorised sellers on their website; if a shop is on it, that is a good sign. Every store K Young
        compares is a real shop selling new, sealed products; open marketplaces and second-hand sellers are never part of the store comparison. You can see all of them on <A href="/stores">Stores we compare</A>. We do show an eBay and an Amazon row
        above the stores on product pages, labelled as ads and kept out of the &quot;cheapest&quot; ranking; on either site, buy from the brand&apos;s official shop or a seller with a long record.
      </P>
      <H2>2. Be wary of a price far below everyone else&apos;s</H2>
      <P>
        Real stores price within a fairly narrow band of each other. When one listing is a fraction of what every store charges, ask why. When three or more stores sell a product, K Young drops any price far below the others, so a price that looks too
        good to be true doesn&apos;t become the &quot;cheapest&quot;.
      </P>
      <H2>3. Check the box when it arrives</H2>
      <P>
        Compare the packaging with the brand&apos;s own photos: fonts, colours, the seal and the batch or expiry code printed on the box and the container. Real products have a batch code that matches between box and bottle. A texture, smell or
        colour unlike what you have used before is a reason to stop and contact the seller.
      </P>
      <H2>4. What a barcode does and doesn&apos;t tell you</H2>
      <P>
        K Young matches every listing by the barcode printed on the box (Korean products&apos; barcodes start with 880), which is how we know two stores sell the identical product and size. A barcode alone does not prove a product is genuine,
        because a counterfeit can copy it; that is why we also only list real stores.
      </P>
      <P>
        <span className="mt-2 block">
          Want the lowest price from a store you can trust? Search for your product at the top of the page, or start from <A href="/deals">today&apos;s deals</A>.
        </span>
      </P>
    </>
  );
}

// ---- Advice posts (src/content/blog-advice.ts) ----------------------------

/** "[text](/path)" in a paragraph becomes a link; everything else is text. */
function Linked({ text }: { text: string }) {
  const parts = text.split(/(\[[^\]]+\]\([^)]+\))/g);
  return (
    <>
      {parts.map((part, i) => {
        const m = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
        return m ? (
          <A key={i} href={m[2]}>
            {m[1]}
          </A>
        ) : (
          part
        );
      })}
    </>
  );
}

function picked(sec: Section): Product[] {
  if (!sec.picks) return [];
  const re = new RegExp(sec.picks.match, "i");
  return (sec.picks.cat ? productsOfCat(sec.picks.cat) : getProducts()).filter((f) => re.test(f.name));
}

function Advice({ sections }: { post: Post; sections: Section[] }) {
  return (
    <>
      {sections.map((sec, i) => {
        const list = picked(sec);
        return (
          <section key={i}>
            {sec.h && <H2>{sec.h}</H2>}
            {sec.p.map((t, j) => (
              <P key={j}>
                <Linked text={t} />
              </P>
            ))}
            {sec.picks && (
              <PerRegion
                render={(r) => {
                  const rows = popularIn(r, sec.picks!.limit ?? 10, list);
                  if (!rows.length) return <Empty region={r} />;
                  return (
                    <div className="mb-6">
                      <h3 className="mb-2 text-sm font-semibold text-soft">{sec.picks!.title.replace("{region}", REGIONS.find((x) => x.code === r)!.phrase)}</h3>
                      <PriceList region={r} products={rows} />
                    </div>
                  );
                }}
              />
            )}
          </section>
        );
      })}
      <P>
        Picks are the products the most stores in your country stock, shown cheapest first, so the table changes as stores restock and reprice. Nothing here is medical advice: patch test new products, and see a dermatologist for skin problems that
        don&apos;t settle. <A href="/blog">More from the blog</A>.
      </P>
    </>
  );
}
