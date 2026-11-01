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
  shippingOptions?: { shippingCost?: { value?: string; currency?: string } }[];
  condition?: string;
}

/** EU countries: an EU buyer's eBay row may come from a seller in any of them (no customs). */
export const EU_COUNTRIES: ReadonlySet<string> = new Set(["AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES", "SE"]);

/** Where the products come from: sellers there are kept for every region, priced delivered (owner, 2026-10-31). */
export const HOME_COUNTRY = "KR";

/** eBay's two-letter country code for a region (the UK is GB on eBay). */
export const EBAY_COUNTRY: Partial<Record<RegionCode, string>> = { US: "US", UK: "GB", CA: "CA", AU: "AU", EU: "DE" };

/**
 * Is a seller local to the region? Visitor feedback (WargameCompare, 2026-10-31): overseas sellers' postage made eBay rows
 * "a lot of wasted clicks", so a region's row comes only from a seller in its own country (any EU country for the EU).
 * A listing that gives no location passes: the search itself asked for local sellers.
 */
export function localSeller(region: RegionCode, country: string | undefined): boolean {
  if (!country) return true;
  // The products' home country (Korea) is often the cheapest genuine source: its sellers stay, priced with postage.
  if (country === HOME_COUNTRY) return true;
  return region === "EU" ? EU_COUNTRIES.has(country) : country === EBAY_COUNTRY[region];
}

/** The postage eBay states for the listing, in minor units, or null when it states none (calculated) or in another currency. */
export function statedPostage(it: EbayItem, currency: string, minor: number): number | null {
  const c = it.shippingOptions?.[0]?.shippingCost;
  if (!c || c.value == null || (c.currency && c.currency !== currency)) return null;
  const n = Math.round(Number(c.value) * minor);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

/** May a stored row be shown? Only one with its postage known (rows from before 2026-10-31 have none). */
export const ebayRowShown = (pick: EbayPick | undefined): pick is EbayPick => !!pick && pick.sh != null;

// Counterfeit K-beauty overwhelmingly ships from these; genuine stock from a
// real seller is listed from Korea, the US, Europe or Australia.
const BOOTLEG_ORIGINS = new Set(["CN", "HK"]);

/**
 * The cheapest believable listing: new, from outside the counterfeit origins, a
 * title that is still one product (no tester, bundle, short-dated stock),
 * in the region's currency, and within 60%–300% of the stores' median; from a
 * seller in the region (localSeller) with postage eBay states, priced delivered. No
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
    if (!localSeller(region, it.itemLocation?.country)) continue;
    const sh = statedPostage(it, cur, minor);
    if (sh == null) continue;
    if ("refused" in readTitle(it.title)) continue;
    const p = Math.round(Number(it.price.value) * minor);
    if (!(p > 0) || p < ref * 0.6 || p > ref * 3) continue;
    // The row shows the DELIVERED price, and the cheapest delivered wins.
    if (!best || p + sh < best.p) best = { p: p + sh, sh, u: it.itemWebUrl.split("?")[0], t: it.title.slice(0, 120), img: it.image?.imageUrl ?? null };
  }
  return best;
}

/** How a (product, region) pair ranks for eBay: tier 0 is on the home page,
 *  1 is popular or new, 2 is everything else; score breaks ties (higher first). */
export interface EbayPrio {
  tier: 0 | 1 | 2;
  score: number;
}

/** Days before a pair with an eBay row is searched again, by tier (owner,
 *  2026-10-30: front-page, popular and recent products first and most often;
 *  2026-11-01: the rest weekly, so the calls reach every product). */
export const EBAY_REFRESH_DAYS = [1, 3, 7] as const;

/** Days before a pair whose last search found nothing is searched again, by
 *  tier. A barcode with no local listing rarely gains one within days, so those
 *  calls wait longer and go to products never searched (owner, 2026-11-01:
 *  coverage, so every product has an eBay price where eBay sells it). */
export const EBAY_EMPTY_RECHECK_DAYS = [2, 7, 21] as const;

/** The region searched first when everything else ties (owner, 2026-11-01: "prioritise the US"). */
export const EBAY_FIRST_REGION: RegionCode = "US";

const dayDiff = (a: string, b: string) => Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000);

/**
 * Which (product, region) pairs to search today, among pairs where stores sell
 * the product. Due pairs first (never checked, or older than their interval:
 * EBAY_REFRESH_DAYS when the last search found a listing, EBAY_EMPTY_RECHECK_DAYS
 * when it found none), by tier, never-searched first (coverage), US before other
 * regions, then oldest check, then score; budget left over goes to pairs not yet due, oldest
 * first, so no call of the day is wasted. Without `prio` every pair is tier 2,
 * scored by its store count; without `hasRow` every pair counts as found.
 */
export function planEbay(
  products: Product[],
  checked: Record<string, string>,
  regions: RegionCode[],
  budget: number,
  prio?: (f: Product, region: RegionCode) => EbayPrio,
  today?: string,
  hasRow?: (ean: string, region: RegionCode) => boolean,
): { f: Product; region: RegionCode }[] {
  const pairs: { f: Product; region: RegionCode; at: string; due: boolean; tier: number; score: number; first: number }[] = [];
  for (const f of products) {
    for (const region of regions) {
      const offers = f.offers[region];
      if (!offers?.length) continue;
      const { tier, score } = prio ? prio(f, region) : { tier: 2 as const, score: offers.length };
      const at = checked[`${f.ean}:${region}`] ?? "";
      const every = !hasRow || hasRow(f.ean, region) ? EBAY_REFRESH_DAYS[tier] : EBAY_EMPTY_RECHECK_DAYS[tier];
      const due = !at || !today || dayDiff(at, today) >= every;
      pairs.push({ f, region, at, due, tier, score, first: region === EBAY_FIRST_REGION ? 0 : 1 });
    }
  }
  return pairs
    .sort(
      (a, b) =>
        Number(b.due) - Number(a.due) ||
        (a.due ? a.tier - b.tier || Number(!!a.at) - Number(!!b.at) || a.first - b.first : 0) ||
        a.at.localeCompare(b.at) ||
        a.tier - b.tier ||
        a.first - b.first ||
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
