// Shopper ratings and reviews (owner, 2026-10-30: "users should be able to rate
// the products … stars … and reviews"). The pure, client-safe half: limits,
// what a review may say, the spam rules and the summary maths. No database and
// no node:crypto here (that is lib/reviews-db.ts, used only by the two
// /api/reviews routes), so the form, the pages and tests/reviews.test.ts all
// import this file.
//
// How a review travels (DECISIONS.md "Ratings and reviews"): the form POSTs to
// /api/reviews → one row in a small Neon table → the daily import exports the
// published ones to data/public/reviews.json → the day's build draws them into
// the static product page (server HTML, Review + AggregateRating JSON-LD).
// Pages never read the database.

export const SKIN_TYPES = [
  { key: "dry", label: "Dry" },
  { key: "oily", label: "Oily" },
  { key: "combination", label: "Combination" },
  { key: "normal", label: "Normal" },
  { key: "sensitive", label: "Sensitive" },
  { key: "acne", label: "Acne-prone" },
] as const;
export type SkinType = (typeof SKIN_TYPES)[number]["key"];
export const skinLabel = (k: string | undefined) => SKIN_TYPES.find((s) => s.key === k)?.label;

export const TITLE_MAX = 80;
export const BODY_MIN = 20;
export const BODY_MAX = 3000;
export const NAME_MAX = 40;
export const DEFAULT_NAME = "K Young shopper";
/** Fewer than this many seconds between the form appearing and the send: a bot. */
export const MIN_FILL_SECONDS = 4;
/** Google shows review stars only from a real sample; below this the page says
 *  "N ratings" but its JSON-LD carries no aggregateRating. */
export const SCHEMA_MIN_RATINGS = 3;
/** Written reviews drawn on one product page (newest first); the count and
 *  average always include every rating. */
export const PAGE_REVIEWS_MAX = 30;

export interface ReviewInput {
  ean: string;
  stars: number;
  title?: string;
  body?: string;
  name?: string;
  skin?: string;
}

export interface CleanReview {
  ean: string;
  stars: 1 | 2 | 3 | 4 | 5;
  title: string | null;
  body: string | null;
  name: string | null;
  skin: SkinType | null;
}

/** One published review as data/public/reviews.json carries it. Never an
 *  email, an IP or anything else private: that file is public with the source. */
export interface PublicReview {
  id: number;
  /** stars, 1–5 */
  s: number;
  t?: string;
  b?: string;
  /** the name the shopper chose (or DEFAULT_NAME) */
  n: string;
  k?: SkinType;
  /** YYYY-MM-DD */
  d: string;
}

export interface ProductReviews {
  /** every published rating, with or without words */
  n: number;
  /** average stars, one decimal */
  avg: number;
  /** how many have words (all of them, not only the ones drawn) */
  w: number;
  /** how many 1★ … 5★ */
  dist: [number, number, number, number, number];
  /** the written ones, newest first, at most PAGE_REVIEWS_MAX */
  reviews: PublicReview[];
}

export interface ReviewsFile {
  exportedAt: string;
  /** reviews waiting for the owner (a count only) */
  held: number;
  /** set when the export could not read the database (the file then keeps the last good products) */
  error?: string;
  products: Record<string, ProductReviews>;
}

/** Collapse whitespace, drop control characters and zero-width tricks. */
export function cleanText(s: unknown, max: number): string | null {
  if (typeof s !== "string") return null;
  const t = s
    .normalize("NFC")
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f​-‏‪-‮⁦-⁩﻿]/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return t ? t.slice(0, max) : null;
}

/** Check a submission; an error is a sentence for the shopper. */
export function validateReview(raw: Partial<ReviewInput>): { ok: true; review: CleanReview } | { ok: false; error: string } {
  const ean = typeof raw.ean === "string" ? raw.ean.trim() : "";
  if (!/^880\d{10}$/.test(ean)) return { ok: false, error: "That product isn't one we compare." };
  const stars = Number(raw.stars);
  if (!Number.isInteger(stars) || stars < 1 || stars > 5) return { ok: false, error: "Pick from one to five stars." };
  const body = cleanText(raw.body, BODY_MAX + 1);
  if (body && body.length > BODY_MAX) return { ok: false, error: `Please keep your review under ${BODY_MAX} characters.` };
  if (body && body.length < BODY_MIN) return { ok: false, error: `A written review needs at least ${BODY_MIN} characters, or leave it empty to just rate.` };
  const title = cleanText(raw.title, TITLE_MAX);
  if (title && !body) return { ok: false, error: "Add a few words under your headline, or leave both empty to just rate." };
  const name = cleanText(raw.name, NAME_MAX)?.replace(/\n/g, " ") ?? null;
  const skin = SKIN_TYPES.some((s) => s.key === raw.skin) ? (raw.skin as SkinType) : null;
  return { ok: true, review: { ean, stars: stars as CleanReview["stars"], title, body, name, skin } };
}

/** Why a review should wait for the owner instead of publishing at the next
 *  export. Empty means it publishes. A rating with no words never waits:
 *  there is nothing in it to check. */
export function reviewFlags(r: Pick<CleanReview, "title" | "body" | "name">): string[] {
  const text = [r.title, r.body, r.name].filter(Boolean).join("\n");
  if (!text) return [];
  const flags: string[] = [];
  if (/https?:\/\/|www\.|\b[a-z0-9-]+\.(com|net|org|shop|store|co|io|ly|me|kr|uk|au|ca|nz|de|xyz|top|site|link)\b/i.test(text)) flags.push("link");
  if (/[^\s@]+@[^\s@]+\.[a-z]{2,}/i.test(text)) flags.push("email");
  if (/(?:\+?\d[\s().-]?){9,}/.test(text)) flags.push("phone");
  if (/\b(discount|promo|coupon) ?code\b|\buse code\b|\bdm me\b|\bwhats ?app\b|\btelegram\b|\bcrypto\b|\bbitcoin\b|\bcasino\b|\bviagra\b|\bloan\b/i.test(text)) flags.push("spam words");
  if (/\b(fuck|shit|cunt|bitch|nigg|fag|retard|whore|slut)/i.test(text)) flags.push("language");
  if (/(.)\1{7,}/u.test(text)) flags.push("repeated characters");
  const letters = text.replace(/[^A-Za-z]/g, "");
  if (letters.length >= 20 && letters.replace(/[^A-Z]/g, "").length / letters.length > 0.7) flags.push("shouting");
  // Words that are medical claims a shop or a brand shill writes, or that need a doctor, not a shopper.
  if (/\b(cures?|cured|heal(s|ed)? (my )?(eczema|psoriasis|rosacea|acne)|prescription|steroid)\b/i.test(text)) flags.push("medical claim");
  // The name is where an advertiser puts their shop.
  if (r.name && /\b(shop|store|official|beauty co|cosmetics|skincare ltd|admin)\b/i.test(r.name)) flags.push("name looks like a shop");
  return flags;
}

/** The page summary from every published rating of one product. */
export function summarize(rows: { id: number; stars: number; title: string | null; body: string | null; name: string | null; skin: string | null; created: string }[]): ProductReviews {
  const dist: ProductReviews["dist"] = [0, 0, 0, 0, 0];
  let sum = 0;
  for (const r of rows) {
    dist[r.stars - 1]++;
    sum += r.stars;
  }
  const reviews = rows
    .filter((r) => r.body)
    .sort((a, b) => b.created.localeCompare(a.created) || b.id - a.id)
    .slice(0, PAGE_REVIEWS_MAX)
    .map((r) => {
      const out: PublicReview = { id: r.id, s: r.stars, n: r.name || DEFAULT_NAME, d: r.created.slice(0, 10) };
      if (r.title) out.t = r.title;
      if (r.body) out.b = r.body;
      if (r.skin && SKIN_TYPES.some((s) => s.key === r.skin)) out.k = r.skin as SkinType;
      return out;
    });
  return { n: rows.length, w: rows.filter((r) => r.body).length, avg: rows.length ? Math.round((sum / rows.length) * 10) / 10 : 0, dist, reviews };
}

/** "4.6" from 4.6, "4.0" from 4. */
export const starsText = (avg: number) => avg.toFixed(1);
