// Shoppers' ratings (data/public/reviews.json, written by the daily reviews
// export) and the popularity ranking built on them. Read at BUILD time only,
// like lib/data.ts: a visit never reads the reviews database.
import fs from "node:fs";
import path from "node:path";
import type { RegionCode } from "@/site";
import { getProducts, orderableIn } from "./data";
import type { Product } from "./types";
import type { ProductReviews, ReviewsFile } from "./reviews";

const DIR = path.resolve(process.cwd(), process.env.KY_DATA_DIR || "data/public");
let file: ReviewsFile | null = null;

export function getReviewsFile(): ReviewsFile {
  if (file) return file;
  try {
    file = JSON.parse(fs.readFileSync(path.join(DIR, "reviews.json"), "utf8")) as ReviewsFile;
  } catch {
    file = { exportedAt: "", held: 0, products: {} };
  }
  return file;
}

export const reviewsOf = (f: Pick<Product, "ean">): ProductReviews | undefined => getReviewsFile().products[f.ean];

/** The form shows only when the build can reach a reviews database (Vercel's
 *  DATABASE_URL from the Neon integration): before that the page says nothing
 *  about writing a review rather than offering a form that cannot save. */
export const reviewsOpen = () => Boolean((process.env.REVIEWS_DATABASE_URL || process.env.DATABASE_URL || "").trim());

/**
 * Popularity, until click data exists: how many stores stock it in stock (the
 * K-beauty staples are the ones every shop carries), plus what shoppers say.
 * A rating counts by how many there are (diminishing) and how good they are,
 * so ten 5★ ratings lift a product about as much as three more stores do.
 * Never used to order prices: only lists of products.
 */
export function popularity(f: Product, region?: RegionCode): number {
  const offers = region ? f.offers[region] ?? [] : Object.values(f.offers).flatMap((o) => o ?? []);
  const inStock = new Set(offers.filter((o) => o.st !== "out").map((o) => o.s)).size;
  const all = new Set(offers.map((o) => o.s)).size;
  const r = reviewsOf(f);
  const said = r && r.n ? Math.log2(1 + r.n) * ((r.avg - 2.5) / 2.5) * 1.5 : 0;
  return inStock + 0.25 * (all - inStock) + said;
}

/** Most popular products someone can order in this region today. */
export function popularNow(region: RegionCode, limit = 24, list: Product[] = getProducts()): Product[] {
  return orderableIn(region, list)
    .map((f) => ({ f, p: popularity(f, region) }))
    .sort((a, b) => b.p - a.p || a.f.name.localeCompare(b.f.name))
    .slice(0, limit)
    .map((x) => x.f);
}

/** Best rated, with enough ratings to mean something (SCHEMA_MIN_RATINGS). */
export function topRated(region: RegionCode | null, limit = 24, min = 3): Product[] {
  const list = region ? orderableIn(region) : getProducts();
  return list
    .flatMap((f) => {
      const r = reviewsOf(f);
      return r && r.n >= min ? [{ f, r }] : [];
    })
    .sort((a, b) => b.r.avg - a.r.avg || b.r.n - a.r.n || a.f.name.localeCompare(b.f.name))
    .slice(0, limit)
    .map((x) => x.f);
}
