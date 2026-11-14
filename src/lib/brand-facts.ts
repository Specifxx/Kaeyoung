// What a brand page can say in words about its own prices (2026-11-14), read from the day's offers like the product
// page's summary (lib/product-facts.ts): never typed in, never converted between currencies. Pure functions.
import { REGIONS, REGION_BY_CODE, type RegionCode } from "@/site";
import { STORE_BY_ID } from "@/content/stores";
import { money, niceDate } from "./format";
import type { Offer, Product } from "./types";

const storeName = (id: string) => STORE_BY_ID[id]?.name ?? id;
const inStock = (f: Product, r: RegionCode): Offer[] => (f.offers[r] ?? []).filter((o) => o.st !== "out").sort((a, b) => a.p - b.p);
const storesOf = (f: Product) => new Set(Object.values(f.offers).flatMap((o) => (o ?? []).map((x) => x.s))).size;

/** How many regions get a sentence: the three with the most of the brand's products in stock. */
export const BRAND_REGIONS = 3;
/** A gap between stores is named only with this many stores in stock and at least this share of the dearest price. */
export const GAP_MIN_STORES = 3;
export const GAP_MIN_SHARE = 0.1;

export function brandSentences(name: string, products: Product[], updatedAt: string | undefined): string[] {
  const out: string[] = [];
  if (!products.length) return out;
  const top = [...products].sort((a, b) => storesOf(b) - storesOf(a) || a.name.localeCompare(b.name))[0];
  out.push(`The most widely stocked ${name} product we compare is ${top.name}, listed by ${storesOf(top)} stores.`);
  const regions = REGIONS.map((r) => ({ r: r.code, list: products.map((f) => ({ f, stock: inStock(f, r.code) })).filter((x) => x.stock.length) }))
    .filter((x) => x.list.length)
    .sort((a, b) => b.list.length - a.list.length)
    .slice(0, BRAND_REGIONS);
  for (const { r, list } of regions) {
    const phrase = REGION_BY_CODE[r].phrase.replace(/^in /, "In ");
    const byLow = [...list].sort((a, b) => a.stock[0].p - b.stock[0].p || a.f.name.localeCompare(b.f.name));
    const lo = byLow[0];
    const hi = byLow[byLow.length - 1];
    out.push(
      list.length === 1
        ? `${phrase}, one is in stock: ${lo.f.name}, from ${money(lo.stock[0].p, r)} at ${storeName(lo.stock[0].s)}.`
        : lo.stock[0].p === hi.stock[0].p
          ? `${phrase}, ${list.length} of the ${products.length} are in stock, each from ${money(lo.stock[0].p, r)}.`
          : `${phrase}, ${list.length} of the ${products.length} are in stock, and their lowest prices run from ${money(lo.stock[0].p, r)} (${lo.f.name} at ${storeName(lo.stock[0].s)}) to ${money(hi.stock[0].p, r)} (${hi.f.name}).`,
    );
  }
  // The product whose stores disagree most, in the brand's biggest region.
  if (regions.length) {
    const { r, list } = regions[0];
    const gaps = list
      .filter((x) => x.stock.length >= GAP_MIN_STORES)
      .map((x) => ({ ...x, lo: x.stock[0], hi: x.stock[x.stock.length - 1] }))
      .map((x) => ({ ...x, share: x.hi.p > 0 ? (x.hi.p - x.lo.p) / x.hi.p : 0 }))
      .filter((x) => x.share >= GAP_MIN_SHARE)
      .sort((a, b) => b.share - a.share || a.f.name.localeCompare(b.f.name));
    const g = gaps[0];
    if (g) {
      out.push(
        `Stores ${REGION_BY_CODE[r].phrase} disagree most on ${g.f.name}: ${money(g.lo.p, r)} at ${storeName(g.lo.s)} against ${money(g.hi.p, r)} at ${storeName(g.hi.s)}, with ${g.stock.length} stores holding stock.`,
      );
    }
  }
  if (updatedAt) out.push(`Prices are from our daily check on ${niceDate(updatedAt)}.`);
  return out;
}
