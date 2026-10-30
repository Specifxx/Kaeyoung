// Pure eBay rules (tests/ebay.test.ts). eBay rows are labelled ads, pinned
// above the stores, never counted as a store and never the "best price".
import { REGION_BY_CODE, type RegionCode } from "@/site";
import { median } from "./merge";
import { readTitle } from "./title";
import type { EbayPick, Product, Offer } from "./types";

export interface EbayItem {
  title: string;
  itemWebUrl: string;
  price?: { value: string; currency: string };
  image?: { imageUrl: string };
  itemLocation?: { country?: string };
  condition?: string;
}

// Counterfeit K-beauty overwhelmingly ships from these; genuine stock from a
// real seller is listed from Korea, the US, Europe or Australia.
const BOOTLEG_ORIGINS = new Set(["CN", "HK"]);

/**
 * The cheapest believable listing: new, from outside the counterfeit origins, a
 * title that is still one product (no tester, bundle, short-dated stock),
 * in the region's currency, and within 60%–300% of the stores' median. No
 * store reference, no eBay row (family rule).
 */
export function ebayPick(items: EbayItem[], storeOffers: Offer[], region: RegionCode): EbayPick | null {
  if (!storeOffers.length) return null;
  const ref = median(storeOffers.map((o) => o.p));
  const cur = REGION_BY_CODE[region].currency;
  const minor = 100;
  let best: EbayPick | null = null;
  for (const it of items) {
    if (!it.price || it.price.currency !== cur) continue;
    if (it.itemLocation?.country && BOOTLEG_ORIGINS.has(it.itemLocation.country)) continue;
    if ("refused" in readTitle(it.title)) continue;
    const p = Math.round(Number(it.price.value) * minor);
    if (!(p > 0) || p < ref * 0.6 || p > ref * 3) continue;
    if (!best || p < best.p) best = { p, u: it.itemWebUrl.split("?")[0], t: it.title.slice(0, 120), img: it.image?.imageUrl ?? null };
  }
  return best;
}

/** How a (product, region) pair ranks for eBay: tier 0 is on the home page,
 *  1 is popular or new, 2 is everything else; score breaks ties (higher first). */
export interface EbayPrio {
  tier: 0 | 1 | 2;
  score: number;
}

/** Days before a pair is due again, by tier (owner, 2026-10-30: front-page,
 *  popular and recent products get eBay prices first and most often). */
export const EBAY_REFRESH_DAYS = [1, 3, 7] as const;

const dayDiff = (a: string, b: string) => Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000);

/**
 * Which (product, region) pairs to search today, among pairs where stores sell
 * the product. Due pairs first (never checked, or older than their tier's
 * refresh interval), by tier, then oldest check, then score; budget left over
 * goes to pairs not yet due, oldest first, so no call of the day is wasted.
 * Without `prio` every pair is tier 2, scored by its store count.
 */
export function planEbay(
  products: Product[],
  checked: Record<string, string>,
  regions: RegionCode[],
  budget: number,
  prio?: (f: Product, region: RegionCode) => EbayPrio,
  today?: string,
): { f: Product; region: RegionCode }[] {
  const pairs: { f: Product; region: RegionCode; at: string; due: boolean; tier: number; score: number }[] = [];
  for (const f of products) {
    for (const region of regions) {
      const offers = f.offers[region];
      if (!offers?.length) continue;
      const { tier, score } = prio ? prio(f, region) : { tier: 2 as const, score: offers.length };
      const at = checked[`${f.ean}:${region}`] ?? "";
      const due = !at || !today || dayDiff(at, today) >= EBAY_REFRESH_DAYS[tier];
      pairs.push({ f, region, at, due, tier, score });
    }
  }
  return pairs
    .sort(
      (a, b) =>
        Number(b.due) - Number(a.due) ||
        (a.due ? a.tier - b.tier : 0) ||
        a.at.localeCompare(b.at) ||
        a.tier - b.tier ||
        b.score - a.score ||
        a.f.ean.localeCompare(b.f.ean) ||
        a.region.localeCompare(b.region),
    )
    .slice(0, Math.max(0, budget))
    .map(({ f, region }) => ({ f, region }));
}

/** eBay's call quota resets at midnight Pacific time: the day calls count against. */
export function ebayQuotaDay(d: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Los_Angeles", year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}
