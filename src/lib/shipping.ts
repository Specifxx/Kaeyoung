// What delivery costs at each store (a visitor's question, 2026-10-30: "does
// cheapest first include shipping? Free-delivery thresholds differ by store").
//
// scripts/shipping.ts asks each Shopify store's own cart for its delivery
// rates once a week (a small basket to one address per region, then bigger
// baskets until delivery turns free) and writes data/public/shipping.json.
// It is a quote for that address on that day, so every place that shows it
// says where to and when. Item prices stay the sort order everywhere; delivery
// is shown beside them and added up only where we say so ("with delivery",
// the basket). Client-safe: no node imports.
import type { RegionCode } from "@/site";

export interface StoreShipping {
  /** the day we asked, YYYY-MM-DD */
  at: string;
  /** where to, for the label: "Sydney", "Berlin" */
  to: string;
  /** cheapest delivery rate for a small order, minor units (0: always free) */
  fee: number;
  /** smallest basket total we saw delivered free (null: none up to maxTested) */
  freeFrom: number | null;
  /** largest basket total we saw still charged */
  paidAt: number;
  /** the biggest basket we tried */
  maxTested: number;
}

export type ShippingData = Record<string, StoreShipping>;

/** Where each region's quote is for. EU stores are asked for their own
 *  country (from the domain), since "Europe" is many delivery zones. */
export const DESTINATIONS: Record<RegionCode, { city: string; country: string; province: string; zip: string }> = {
  US: { city: "New York", country: "United States", province: "New York", zip: "10001" },
  UK: { city: "London", country: "United Kingdom", province: "", zip: "SW1A 1AA" },
  CA: { city: "Toronto", country: "Canada", province: "Ontario", zip: "M5V 2T6" },
  AU: { city: "Sydney", country: "Australia", province: "New South Wales", zip: "2000" },
  NZ: { city: "Auckland", country: "New Zealand", province: "Auckland", zip: "1010" },
  EU: { city: "Berlin", country: "Germany", province: "", zip: "10115" },
};

const EU_BY_TLD: Record<string, { city: string; country: string; province: string; zip: string }> = {
  de: DESTINATIONS.EU,
  fr: { city: "Paris", country: "France", province: "", zip: "75001" },
  nl: { city: "Amsterdam", country: "Netherlands", province: "", zip: "1012 AB" },
  ie: { city: "Dublin", country: "Ireland", province: "Dublin", zip: "D02 AF30" },
  fi: { city: "Helsinki", country: "Finland", province: "", zip: "00100" },
  lt: { city: "Vilnius", country: "Lithuania", province: "", zip: "01100" },
  lv: { city: "Riga", country: "Latvia", province: "", zip: "LV-1050" },
  it: { city: "Rome", country: "Italy", province: "Roma", zip: "00184" },
  es: { city: "Madrid", country: "Spain", province: "Madrid", zip: "28001" },
  pl: { city: "Warsaw", country: "Poland", province: "", zip: "00-001" },
  be: { city: "Brussels", country: "Belgium", province: "", zip: "1000" },
  at: { city: "Vienna", country: "Austria", province: "", zip: "1010" },
};

export function destinationFor(region: RegionCode, base: string) {
  if (region !== "EU") return DESTINATIONS[region];
  const tld = new URL(base).hostname.split(".").pop() ?? "";
  return EU_BY_TLD[tld] ?? DESTINATIONS.EU;
}

/** Delivery for an order of this total, minor units: 0 when free, the fee
 *  when charged, null when the total falls between what we saw charged and
 *  what we saw free (the threshold is somewhere in there). */
export function deliveryFor(s: StoreShipping | undefined, total: number): number | null {
  if (!s) return null;
  if (s.fee === 0) return 0;
  if (s.freeFrom != null && total >= s.freeFrom) return 0;
  if (total <= s.paidAt || s.freeFrom == null) return s.fee;
  return null;
}

/** The free-delivery line: "free from A$80". We only say what we saw: the
 *  smallest basket that went free, rounded up to a whole unit. */
export function freeLine(s: StoreShipping, money: (minor: number) => string): string | null {
  if (s.fee === 0) return "free delivery";
  if (s.freeFrom == null) return null;
  return `free from ${money(Math.ceil(s.freeFrom / 100) * 100).replace(/\.00$/, "")}`;
}

/** A store row's delivery note for one item at this price. */
export function deliveryNote(s: StoreShipping | undefined, price: number, money: (minor: number) => string): string | null {
  if (!s) return null;
  if (s.fee === 0) return `Free delivery to ${s.to}`;
  const d = deliveryFor(s, price);
  const free = freeLine(s, money);
  if (d === 0) return `Free delivery to ${s.to}`;
  if (d == null) return `Delivery to ${s.to}: ${money(s.fee)} or free (${free})`;
  return `+${money(d)} delivery to ${s.to}${free ? ` (${free})` : ""}`;
}
