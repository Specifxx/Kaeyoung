// "The price to beat" (Black Friday and Cyber Monday pages, 2026-11-26): for the products the most stores in a region sell
// today, the cheapest in-stock store's item price beside the typical (median) store's. Pure: tests/price-to-beat.test.ts.
//
// WHY. A sale is measured against the store's own price; a buyer needs the other stores' price. Across the products four or
// more stores sell, the cheapest store is typically a fifth under the median one, so "20% off" at a typical store is often
// still dearer than an ordinary day elsewhere. Only real, same-barcode, in-stock item prices: never a "was" price, never
// eBay, Amazon or a partner row, never converted, never shipping (the table says so).
import type { Offer, Product } from "./types";
import type { RegionCode } from "@/site";

export const MIN_STORES = 4;

export interface BeatRow {
  f: Product;
  stores: number;
  /** cheapest in-stock item price, minor units */
  low: number;
  /** the store charging it (the first by id, when several tie) */
  lowStore: string;
  /** median in-stock item price, minor units */
  typical: number;
  /** (typical - low) / typical */
  gap: number;
}

export interface BeatSummary {
  products: number;
  /** median of every product's gap */
  medianGap: number;
  /** share of products whose cheapest store is 20% or more under the typical one */
  over20: number;
}

function median(xs: number[]): number {
  const s = xs.slice().sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

export function beatRow(f: Product, region: RegionCode): BeatRow | null {
  const offers: Offer[] = (f.offers[region] ?? []).filter((o) => o.st === "in" && o.p > 0);
  if (offers.length < MIN_STORES) return null;
  const low = Math.min(...offers.map((o) => o.p));
  const lowStore = offers.filter((o) => o.p === low).map((o) => o.s).sort()[0];
  const typical = Math.round(median(offers.map((o) => o.p)));
  return { f, stores: offers.length, low, lowStore, typical, gap: typical > 0 ? (typical - low) / typical : 0 };
}

/** Every product with MIN_STORES+ in-stock stores, most stores first, then the biggest gap. */
export function beatRows(products: Product[], region: RegionCode): BeatRow[] {
  return products
    .map((f) => beatRow(f, region))
    .filter((r): r is BeatRow => r != null)
    .sort((a, b) => b.stores - a.stores || b.gap - a.gap || a.f.name.localeCompare(b.f.name));
}

export function beatSummary(rows: BeatRow[]): BeatSummary | null {
  if (!rows.length) return null;
  return {
    products: rows.length,
    medianGap: median(rows.map((r) => r.gap)),
    over20: rows.filter((r) => r.gap >= 0.2).length / rows.length,
  };
}
