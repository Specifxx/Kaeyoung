// ─────────────────────────────────────────────────────────────────────────────
// "or A$X on eBay" under the cheapest store (2026-11-10, ported from RiftCompare's
// lib/paid-alternative.ts, owner 2026-10-27).
//
// The 30 days to 10 Nov: 42 buy clicks, 9 of them to a link that can earn
// (/mnt/project-files/traffic/zero-earnings-diagnosis-2026-11-10.html). The hero
// and the phone buy bar name only the cheapest store, which usually pays nothing,
// and a buyer who would rather check out on eBay, Amazon or a paying retailer had
// to scroll to the table to find one.
//
// The rule: when the cheapest orderable store is NOT a paid link, name the
// cheapest paid row of the same table (eBay, Amazon's own listing, a partner's
// feed price for this barcode, a store on a joined programme) if its price is
// within PAID_ALTERNATIVE_BAND of the cheapest. It is quoted at its real price and
// labelled "Paid link"; it is never called cheaper, never the best price and never
// reorders anything. When the cheapest store already pays, nothing is added.
// ─────────────────────────────────────────────────────────────────────────────
import { REGION_BY_CODE, type RegionCode } from "@/site";
import { amazonItemUrl, buyLink, ebayAffiliateUrl, PARTNERS, partnerProductUrl, storePays, subId } from "./affiliate";
import { amazonLive } from "@/lib/amazon-live";
import { getPartnerPrices, storeName } from "./data";
import { lowestOrderable } from "./history";
import { partnerPriceIn } from "./partner-feed";
import type { EbayPick, Product } from "./types";

/** At most 20% above the cheapest orderable store price. */
export const PAID_ALTERNATIVE_BAND = 1.2;

export interface PaidCandidate {
  /** "eBay", "Amazon", a partner's or a store's name */
  name: string;
  /** minor units */
  p: number;
  href: string;
  /** the click event's source */
  source: string;
  /** a few words after the name ("incl. postage") */
  note?: string;
  /** Amazon only: when its price was fetched (shown for 24 hours, then hidden) */
  at?: string;
}

/** The cheapest paid candidate within the band, or null when the cheapest store pays or none qualifies. */
export function paidAlternative(cheapest: { p: number; paid: boolean } | null, candidates: PaidCandidate[]): { c: PaidCandidate; pctMore: number } | null {
  if (!cheapest || cheapest.paid || !(cheapest.p > 0)) return null;
  let pick: PaidCandidate | null = null;
  for (const c of candidates) if (c.p > 0 && c.p <= cheapest.p * PAID_ALTERNATIVE_BAND && (!pick || c.p < pick.p)) pick = c;
  return pick ? { c: pick, pctMore: Math.max(0, Math.round(((pick.p - cheapest.p) / cheapest.p) * 100)) } : null;
}

/** The paid alternative to a region's cheapest orderable store, links tagged with `placement` (hero_alt, buybar_alt). */
export function paidAlternativeFor(f: Product, region: RegionCode, ebay: EbayPick | undefined, placement: string): { c: PaidCandidate; pctMore: number } | null {
  const offers = f.offers[region] ?? [];
  const low = lowestOrderable(offers);
  if (!low || storePays(low.s)) return null;
  const sub = subId(region, placement, f.ean);
  const out: PaidCandidate[] = [];
  if (ebay) out.push({ name: "eBay", p: ebay.p, href: ebayAffiliateUrl(ebay.u, sub), source: "ebay", note: ebay.sh ? "incl. postage" : "free postage" });
  const az = amazonLive(f.ean, region);
  const azUrl = az && amazonItemUrl(az.asin, region, sub);
  if (az && azUrl) out.push({ name: "Amazon", p: az.p, href: azUrl, source: "amazon", at: az.at, note: REGION_BY_CODE[region].amazonHost?.replace("www.", "") });
  const feeds = getPartnerPrices();
  for (const p of PARTNERS.filter((x) => x.regions.includes(region))) {
    // A retailer's own feed price for this barcode, linked only through its tracking template (null without one).
    const fed = partnerPriceIn(feeds, p.key, region, f.ean);
    const href = fed && partnerProductUrl(p, fed.u, sub);
    if (fed && href) out.push({ name: p.name, p: fed.p, href, source: p.key, note: p.note });
  }
  for (const o of offers) if (o.st !== "out" && o !== low && storePays(o.s)) out.push({ name: storeName(o.s), p: o.p, href: buyLink(o).href, source: o.s });
  return paidAlternative({ p: low.p, paid: false }, out);
}
