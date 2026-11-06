// What the site features (owner, 2026-11-06: "the products we feature should be at least 20 USD or the equivalent"):
// the homepage's hero and rows show only products whose cheapest in-stock price in the region is at least
// US$20 or about the same in the local currency, and the eBay pass spends calls only on those. Cheaper products
// stay everywhere else (sections, brands, search, their own pages); they are just not featured.
// Pure, so the pages, the eBay plan and tests agree. Never used to order prices.
import { REGION_BY_CODE, type RegionCode } from "@/site";
import type { Product } from "./types";

/** About US$20 in each currency, in minor units (rounded up, so a featured product is never under US$20). */
export const FEATURE_MIN_MINOR: Record<string, number> = { USD: 2000, CAD: 2800, AUD: 3100, NZD: 3400, GBP: 1600, EUR: 1900 };

export const featureMin = (region: RegionCode): number => FEATURE_MIN_MINOR[REGION_BY_CODE[region].currency] ?? 2000;

/** The cheapest in-stock price in the region is at least about US$20. */
export function isFeatured(f: Product, region: RegionCode): boolean {
  const open = (f.offers[region] ?? []).filter((o) => o.st !== "out");
  if (!open.length) return false;
  return Math.min(...open.map((o) => o.p)) >= featureMin(region);
}

export const featuredIn = (region: RegionCode, list: Product[]): Product[] => list.filter((f) => isFeatured(f, region));
