// The two products the homepage hero shows (owner, 2026-11-05: "images of two
// very popular products and their price and stores on the hero itself, so
// people immediately know what the site does"), and the home share card draws.
// Pure, so the hero, the card and tests agree. Never used to order prices.
import type { RegionCode } from "@/site";
import { getProducts, orderableIn } from "./data";
import { popularity } from "./ratings";
import { isFeatured } from "./featured";
import type { Product } from "./types";

/** A hero product needs a photo and a real comparison: at least this many stores with it in stock. */
export const HERO_MIN_STORES = 3;

export interface HeroPick {
  f: Product;
  /** cheapest in-stock price (minor units) */
  lo: number;
  /** the store charging it */
  loStore: string;
  /** stores with it in stock */
  stores: number;
  /** (dearest − cheapest) / dearest, 0 when every store charges the same */
  save: number;
}

/**
 * The most popular products someone can order in the region today, with a
 * photo, stocked by enough stores to be worth comparing, one per brand so the
 * pair reads as the market rather than one brand's range.
 */
export function heroPicks(region: RegionCode, list: Product[] = getProducts(), n = 2, minStores = HERO_MIN_STORES): HeroPick[] {
  const ranked = orderableIn(region, list)
    // Featured only at about US$20 or more (owner, 2026-11-06, lib/featured.ts).
    .filter((f) => f.img && isFeatured(f, region))
    .map((f) => ({ f, p: popularity(f, region) }))
    .sort((a, b) => b.p - a.p || a.f.name.localeCompare(b.f.name));
  const brands = new Set<string>();
  const out: HeroPick[] = [];
  for (const { f } of ranked) {
    if (out.length === n) break;
    const open = (f.offers[region] ?? []).filter((o) => o.st !== "out");
    if (open.length < minStores || brands.has(f.b)) continue;
    const lo = open.reduce((a, b) => (b.p < a.p ? b : a));
    const hi = Math.max(...open.map((o) => o.p));
    brands.add(f.b);
    out.push({ f, lo: lo.p, loStore: lo.s, stores: open.length, save: hi > 0 ? (hi - lo.p) / hi : 0 });
  }
  return out;
}
