// A partner retailer's affiliate product feed (Awin "Create-a-Feed" and the like): the retailer's own price for
// the exact barcode we compare, so its row shows a price and links to the product instead of a search
// (2026-11-06, Stylevana through Awin). Pure functions here; scripts/partner-feeds.ts downloads the feed in the
// daily import and writes data/public/partners.json; the price table reads it through lib/data.ts.
//
// Rules, as for Amazon's and eBay's rows: the barcode is the only match (a Korean 880 EAN, never a title), the
// price is never converted (a row priced in a currency maps to the one region that charges it), a price under 60%
// or over 160% of that region's in-stock store median is dropped (another size, a bundle, a typo), only in-stock
// rows are kept, and a partner row is never a store, never the cheapest, never a deal, the feed or history.
import { eanOf } from "./ean";
import type { RegionCode } from "@/site";

/** ean → [price in minor units, the retailer's own product URL] */
export type PartnerRegionPrices = Record<string, [number, string]>;
export interface PartnerFeedRun {
  /** ISO time of the last successful read */
  at?: string;
  /** feed rows read, rows kept */
  rows?: number;
  kept?: number;
  /** the last read's error, when it failed (yesterday's prices are kept up to KEEP_DAYS) */
  error?: string;
}
export interface PartnerPricesFile {
  v: 1;
  feeds: Record<string, PartnerFeedRun>;
  prices: Record<string, Partial<Record<RegionCode, PartnerRegionPrices>>>;
}

export const PARTNER_KEEP_DAYS = 3;
export const PARTNER_MIN_SHARE = 0.6;
export const PARTNER_MAX_SHARE = 1.6;

export const CURRENCY_REGION: Record<string, RegionCode> = { USD: "US", GBP: "UK", CAD: "CA", AUD: "AU", NZD: "NZ", EUR: "EU" };

/** Header spellings in Awin's feeds (and Google Shopping's, for another network). */
const FIELDS = {
  link: ["merchant_deep_link", "link", "product_url", "url"],
  awLink: ["aw_deep_link"],
  price: ["search_price", "store_price", "price", "display_price"],
  currency: ["currency", "currency_code"],
  ean: ["ean", "product_gtin", "gtin", "upc", "barcode"],
  mpn: ["mpn", "merchant_product_id"],
  stock: ["in_stock", "stock_status", "availability", "is_for_sale"],
} as const;
export type PartnerFeedRow = Partial<Record<keyof typeof FIELDS, string>>;

export function feedHeader(cells: string[]): Map<number, keyof typeof FIELDS> {
  const m = new Map<number, keyof typeof FIELDS>();
  const taken = new Set<string>();
  cells.forEach((h, i) => {
    const k = h.trim().toLowerCase().replace(/^"|"$/g, "").replace(/^g:/, "");
    for (const [field, names] of Object.entries(FIELDS) as [keyof typeof FIELDS, readonly string[]][]) {
      if ((names as readonly string[]).includes(k) && !taken.has(field)) {
        m.set(i, field);
        taken.add(field);
        break;
      }
    }
  });
  return m;
}

/** One delimited line → cells, with "quoted, cells" and "" escapes; `open` when the text ends inside quotes. */
export function splitCells(line: string, delim: string): { cells: string[]; open: boolean } {
  const out: string[] = [];
  let cur = "";
  let q = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (q) {
      if (ch === '"' && line[i + 1] === '"') (cur += '"'), i++;
      else if (ch === '"') q = false;
      else cur += ch;
    } else if (ch === '"' && cur === "") q = true;
    else if (ch === delim) out.push(cur), (cur = "");
    else cur += ch;
  }
  out.push(cur);
  return { cells: out, open: q };
}

const inStock = (v: string | undefined) => !v || /^(1|y|yes|true|in.?stock|available|limited)/i.test(v.trim());
const cents = (v: string | undefined) => {
  const n = Number((v ?? "").replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) : 0;
};

/** The product page a feed row is for: the merchant's own link, else the `ued` an Awin link wraps. */
export function productLink(r: PartnerFeedRow): string | null {
  const own = r.link?.trim();
  if (own && /^https:\/\//.test(own)) return own;
  try {
    const ued = r.awLink ? new URL(r.awLink).searchParams.get("ued") : null;
    if (ued && /^https:\/\//.test(ued)) return ued;
  } catch {}
  return null;
}

const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  return s.length ? (s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2) : 0;
};

/** One feed row → the (region, ean, price, url) it gives us, or null with nothing kept.
 *  `storePrices(region, ean)` = the in-stock store prices we compare there (none: no reference, not kept). */
export function keepRow(
  r: PartnerFeedRow,
  storePrices: (region: RegionCode, ean: string) => number[],
  fallbackCurrency?: string,
): { region: RegionCode; ean: string; p: number; u: string } | null {
  const ean = eanOf({ barcode: r.ean ?? null }) ?? eanOf({ barcode: r.mpn ?? null });
  if (!ean || !inStock(r.stock)) return null;
  const cur = (r.currency?.trim().toUpperCase() || fallbackCurrency || "").slice(0, 3);
  const region = CURRENCY_REGION[cur];
  const p = cents(r.price);
  const u = productLink(r);
  if (!region || !p || !u) return null;
  const ref = median(storePrices(region, ean));
  if (!ref || p < ref * PARTNER_MIN_SHARE || p > ref * PARTNER_MAX_SHARE) return null;
  return { region, ean, p, u };
}

/** A partner's price for a product in a region, if its last feed read is recent enough to show. */
export function partnerPriceIn(file: PartnerPricesFile | null, key: string, region: RegionCode, ean: string, now = Date.now()): { p: number; u: string; at: string } | null {
  const run = file?.feeds[key];
  if (!run?.at || (now - Date.parse(run.at)) / 86_400_000 > PARTNER_KEEP_DAYS) return null;
  const hit = file!.prices[key]?.[region]?.[ean];
  return hit ? { p: hit[0], u: hit[1], at: run.at } : null;
}
