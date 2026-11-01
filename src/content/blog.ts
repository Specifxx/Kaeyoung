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
