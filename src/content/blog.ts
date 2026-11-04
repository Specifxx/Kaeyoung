// The blog (owner, 2026-10-30: "we need a couple of blog posts"). Each post is
// prose around live blocks drawn from the day's prices at build, so every
// number in a post is a real store price and the posts stay current without
// editing. Never repeat a category hub or a price guide as a post: a post asks
// one question the data answers (playbook: never a /rarity-style list).
import type { CatKey } from "@/site";
import { ADVICE_POSTS } from "./blog-advice";

export interface Post {
  slug: string;
  title: string;
  /** footer link text */
  short: string;
  description: string;
  /** The day the post goes live, YYYY-MM-DD: the real publication date, never
   *  a backdate. A future date holds the post back (no page, no link, not in
   *  the sitemap) until the first daily build on or after it, so posts come
   *  out a couple a week rather than all at once (DECISIONS.md, "Honest blog
   *  dates"). */
  date: string;
  /** The day the TEXT was last revised (not the live price tables, which
   *  change every day), shown as "Updated" when set. */
  updated?: string;
  /** Where the post's factual claims come from, listed at its foot. Posts
   *  built only from our own price data cite the daily import instead. */
  sources?: Source[];
  /** the drawing on its card and header */
  art: CatKey;
  /** The post's own thumbnail (public/blog/<slug>.jpg, 1200×630): its link preview and the picture on its card. Absent: the drawing and the site's share image. */
  image?: { src: string; alt: string };
  /** An advice post written as data: prose sections, each optionally followed
   *  by a live price table of the products its `picks` select (per region,
   *  most-stocked first, shown cheapest first). Posts without it have their
   *  own body in src/app/blog/[slug]/page.tsx. */
  sections?: Section[];
}

export interface Source {
  title: string;
  /** who published it: "American Academy of Dermatology" */
  by: string;
  url: string;
}

export interface Picks {
  /** table heading, "{region}" becomes "in Australia" etc. */
  title: string;
  /** a regular expression over the product name (case-insensitive) */
  match: string;
  cat?: CatKey;
  limit?: number;
}

export interface Section {
  h?: string;
  /** paragraphs; [text](/path) becomes a link */
  p: string[];
  picks?: Picks;
}

export const POSTS: Post[] = [
  {
    slug: "kbeauty-price-map-november-2026",
    title: "The K-beauty price map, November 2026: what the boom did to shelves and prices",
    short: "K-beauty price map, Nov 2026",
    description:
      "Korea's cosmetics exports hit a record in 2025 and the US became the biggest market. What that looks like on the shelves of 139 stores in six countries, how far prices spread for the same barcode, and where we think prices head into 11.11 and Black Friday.",
    date: "2026-11-04",
    sources: [
      { title: "Korea's cosmetics exports surpass record $11 billion in 2025", by: "Korea JoongAng Daily", url: "https://www.koreajoongangdaily.com/business/koreas-cosmetics-exports-surpass-record-11-billion-in-2025/12129724" },
      { title: "US surpasses China as K-beauty's top market amid record-breaking exports", by: "Personal Care Insights", url: "https://www.personalcareinsights.com/news/kbeauty-export-record-us-china-shift.html" },
      { title: "Korean beauty products are a $1.7 billion US market. Tariffs could change that", by: "Associated Press, via Fortune", url: "https://fortune.com/2025/07/28/1-7-billion-korean-beauty-market-tariffs-trade/" },
    ],
    art: "serums",
    image: { src: "/blog/kbeauty-price-map-november-2026.jpg", alt: "Bar chart: the price spread between the cheapest and dearest store for the same K-beauty product, by country" },
    sections: [
      {
        p: [
          "K-beauty stopped being a niche some time in 2024, and the numbers caught up in 2025. Korea exported US$11.43 billion of cosmetics last year, up 12.3% on 2024's record, and for the first time the United States was the biggest buyer, at US$2.2 billion, ahead of China. The US imported 54% more Korean cosmetics in 2024 than in 2023 and bought more skincare from Korea than from any other country, France included. That boom is why there are now dozens of specialist K-beauty shops in each English-speaking country, and why the same serum can cost very different amounts depending on which one you open.",
          "This post is a snapshot of what that looks like from where we sit: 139 stores across the US, UK, Canada, Australia, New Zealand and Europe, 11,089 products matched by their Korean barcode, read on 4 November 2026. The tables are live and refresh every day; the figures in the text are from that morning.",
        ],
      },
      {
        h: "What is on the shelves",
        p: [
          "The brands stocked by the most stores are not the ones with the biggest marketing. Across every country, MISSHA (430 products), TIRTIR (336), medicube (297), peripera (291), fwee (248) and rom&nd (246) lead the count, with COSRX, Anua and SKIN1004 close behind. Three of the top six are makeup brands, which says something about where the shops see the next wave: makeup is already the largest category we track, at 3,071 products, ahead of serums (1,385), masks (1,339) and moisturisers (1,283). Sunscreen, the product most people arrive looking for, is just 324 products, because a few famous ones carry the whole category.",
          "TIRTIR is the clearest case of a brand made by the boom. Its cushion foundation alone is 171 separate shades and sizes in our data, and it is the most-stocked brand in the US, Australia and Europe. medicube, whose devices and PDRN serums were everywhere on social media this year, is the most-stocked brand in the UK.",
        ],
        picks: { title: "The most-stocked TIRTIR products {region}", match: "tirtir", limit: 6 },
      },
      {
        h: "How far prices spread for one barcode",
        p: [
          "Because we match on the barcode, we can compare the exact same item across stores. For products sold by three or more stores in a country, the dearest store charges, at the median, 1.43 times the cheapest in the US and in Canada, 1.53 times in Europe, 1.54 times in the UK and 1.67 times in Australia. A quarter of Australian products have a store charging double the cheapest price. New Zealand's spread is the narrowest, at 1.14 times, but only because five stores stock the market.",
          "That spread is the most useful number on this page. It is far wider than the gap between countries, and far wider than any sale. If you buy from the first shop a search returns, you are paying the spread more often than not.",
        ],
        picks: { title: "medicube, at every store {region}", match: "medicube", limit: 8 },
      },
      {
        h: "Where prices have been going",
        p: [
          "We have tracked prices daily since 30 October, which is too short to call a trend, but the direction in that week was down: of the products with a price on both 30 October and 4 November, 343 got cheaper by more than 3%, 149 got dearer and 301 held. Stores were already cutting before the November sales started.",
          "Beyond our own data, two forces pull in opposite directions. The US tariff regime on Korean goods changed in 2025 (cosmetics had entered the US duty-free under the 2012 free trade agreement), and the specialist stores we track have not, so far, passed anything visible through: the US has the second-narrowest price spread we measure. Against that, the number of stores keeps rising, and every new store opens by undercutting on the famous products. Our read is that the famous products (Beauty of Joseon's sunscreen, COSRX's snail mucin, Anua's cleansing oil, SKIN1004's centella line) keep getting cheaper at the cheapest store, while the long tail of a brand's range stays at full price because nobody competes on it.",
        ],
        picks: { title: "The famous ones {region}", match: "beauty of joseon.*(rice|relief sun)|cosrx.*snail|anua.*heartleaf.*cleansing oil|skin1004.*centella.*ampoule", limit: 8 },
      },
      {
        h: "The next five weeks",
        p: [
          "11 November is Singles' Day, which the K-beauty stores treat as the start of the season, Black Friday is 27 November and Cyber Monday 30 November. K-beauty shops tend to run these weeks as site-wide percentage codes rather than cuts on individual products, which means the cheapest store on a product today is usually still the cheapest once everyone's code is applied. Our advice is to find the cheapest store for the exact product now, then wait for that store's code.",
          "Two things we expect to see more of: brands' own stores undercutting the shops that stock them, which [we found already happening in October](/blog/brand-stores-vs-kbeauty-shops), and toner pads and PDRN products, this year's two breakout categories, going from a handful of stores to every store. The pads are already at 52 products and PDRN or salmon-labelled products at 304.",
        ],
        picks: { title: "PDRN and toner pads {region}", match: "pdrn|toner pad", limit: 8 },
      },
    ],
  },
  {
    slug: "brand-stores-vs-kbeauty-shops",
    title: "Are K-beauty brands' own stores cheaper than K-beauty shops?",
    short: "Brand stores vs K-beauty shops",
    description:
      "COSRX, Anua, SKIN1004, Torriden and other brands run their own online stores. We compared their prices with every specialist shop selling the same barcode.",
    date: "2026-10-30",
    art: "serums",
  },
  {
    slug: "korean-skincare-routine-priced",
    title: "A five-step Korean skincare routine, priced at the cheapest stores",
    short: "A routine, priced",
    description:
      "Cleanser, toner, serum, moisturiser and sunscreen: the best-stocked product in each step, at the cheapest store in your country today, and what the whole routine costs.",
    date: "2026-10-30",
    art: "moisturisers",
  },
  {
    slug: "korean-sunscreen-where-cheapest",
    title: "Korean sunscreen: where the favourites are cheapest",
    short: "Korean sunscreen prices",
    description:
      "The Korean sunscreens the most stores stock, with the cheapest store and the gap to the dearest one, in your country's own currency.",
    date: "2026-10-30",
    art: "sunscreen",
  },
  {
    slug: "same-product-different-price",
    title: "Same product, very different price: today's biggest K-beauty price gaps",
    short: "Today's biggest price gaps",
    description: "The same barcode, the same size, at very different prices. The biggest gaps between K-beauty stores right now.",
    date: "2026-10-30",
    art: "masks",
  },
  {
    slug: "cosrx-beauty-of-joseon-anua-prices",
    title: "COSRX, Beauty of Joseon and Anua: where each bestseller is cheapest",
    short: "COSRX, Beauty of Joseon, Anua",
    description: "Three of the most-searched Korean skincare brands, product by product: the cheapest store for each in your country today.",
    date: "2026-10-30",
    art: "toners",
  },
  {
    slug: "avoid-fake-kbeauty",
    title: "How to avoid fake K-beauty when you shop online",
    short: "Avoiding fake K-beauty",
    description: "Counterfeit Korean skincare is common on open marketplaces. What to check before you buy, and why KaeYoung only lists specialist stores.",
    date: "2026-10-30",
    sources: [{ title: "Warning: fake cosmetics discovered", by: "Cosmetic, Toiletry and Perfumery Association (UK)", url: "https://www.ctpa.org.uk/news/warning-fake-cosmetics-discovered-4070" }],
    art: "eye-care",
  },
];

/** Every post written, the advice posts after the launch posts, including
 *  those not out yet. Pages use LIVE_POSTS. */
export const ALL_POSTS: Post[] = [...POSTS, ...ADVICE_POSTS];

/** Out on the given day (UTC): the post's date has come. */
export function isLive(p: Post, today = new Date().toISOString().slice(0, 10)): boolean {
  return p.date <= today;
}

/** The posts out at this build, newest first. Each page is built once a day,
 *  so a scheduled post appears with the first build on its date. */
export const LIVE_POSTS: Post[] = ALL_POSTS.filter((p) => isLive(p)).sort((a, b) => b.date.localeCompare(a.date));

export const POST_BY_SLUG = Object.fromEntries(LIVE_POSTS.map((p) => [p.slug, p])) as Record<string, Post>;
