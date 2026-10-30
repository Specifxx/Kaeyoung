// The committed data under data/public, read at BUILD time only: every page is
// prerendered once per release (one [deploy] build a day), so a visit is a
// static file from Vercel's CDN, never a function and never a database read.
import fs from "node:fs";
import path from "node:path";
import { CATEGORIES, REGIONS, type CatKey, type RegionCode } from "@/site";
import { STORE_BY_ID } from "@/content/stores";
import { lowestOrderable } from "./history";
import { canonicalKey } from "./brand";
import { BRAND_KO } from "@/content/brands-ko";
import type { EbayData, History, Meta, Offer, Product } from "./types";
import { deliveryFor, MAX_SMALL_ORDER_FEE, type ShippingData } from "./shipping";

// KY_DATA_DIR points local development and tests at a fixture; production
// always reads the committed files.
const DIR = path.resolve(process.cwd(), process.env.KY_DATA_DIR || "data/public");
const memo = new Map<string, unknown>();
function load<T>(file: string, fallback: T): T {
  if (memo.has(file)) return memo.get(file) as T;
  let v: T = fallback;
  try {
    v = JSON.parse(fs.readFileSync(path.join(DIR, file), "utf8")) as T;
  } catch {}
  memo.set(file, v);
  return v;
}

/** Built once per build process and reused by every page: with tens of
 *  thousands of products, a per-page scan of the catalogue (or of the brand
 *  list) makes the daily build quadratic. */
function once<T>(key: string, build: () => T): T {
  if (!memo.has(key)) memo.set(key, build());
  return memo.get(key) as T;
}

export const getProducts = (): Product[] =>
  once("products", () => load<{ products: Product[] }>("products.json", { products: [] }).products.filter((f) => f.offers && Object.values(f.offers).some((o) => o?.length)));
export const getMeta = (): Meta | null => load<Meta | null>("meta.json", null);
export const getHistory = (): History => load<History>("history.json", {});
export const getEbay = (): EbayData => load<EbayData>("ebay.json", {});
/** Weekly delivery quotes per store (scripts/shipping.ts; lib/shipping.ts). */
export const getShipping = (): ShippingData =>
  once("shipping", () => Object.fromEntries(Object.entries(load<ShippingData>("shipping.json", {})).filter(([, q]) => q.fee <= MAX_SMALL_ORDER_FEE)));

export function getProduct(slug: string): Product | undefined {
  return once("bySlug", () => new Map(getProducts().map((f) => [f.slug, f]))).get(slug);
}

/** A fresh array each call: callers sort it. */
export function productsOfCat(cat: CatKey): Product[] {
  return [...(once("byCat", () => {
    const m = new Map<CatKey, Product[]>();
    for (const f of getProducts()) m.set(f.cat, [...(m.get(f.cat) ?? []), f]);
    return m;
  }).get(cat) ?? [])];
}

export function productsOfBrand(b: string): Product[] {
  return [...(once("byBrand", () => {
    const m = new Map<string, Product[]>();
    for (const f of getProducts()) if (f.b) m.set(f.b, [...(m.get(f.b) ?? []), f]);
    return m;
  }).get(b) ?? [])];
}

/**
 * The same product in other sizes and shades: same brand, same name once the
 * size, the shade in brackets and a shade number are taken out ("TIRTIR Mask
 * Fit Red Cushion 18g (21N Ivory)" and "… (23N Sand)"). Each has its own
 * barcode and page; this only links them. A mini or a refill names itself and
 * stays apart.
 */
export function familyKey(f: Product): string {
  let n = f.name.toLowerCase();
  if (f.brand) n = n.replace(f.brand.toLowerCase(), " ");
  return `${f.b}|${n
    .replace(/\([^()]*\)/g, " ")
    .replace(/\d+(?:[.,]\d+)?\s?(?:ml|g|fl\.?\s?oz|oz|sheets?|pcs|pads?|patches|ea)\b/g, " ")
    .replace(/#\s?[\w-]+/g, " ")
    .replace(/\bno\.?\s?\d+\w*/g, " ")
    .replace(/\s[-–]\s*\d+\w*(?:\s[\w']+){0,3}$/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()}`;
}

export function variantsOf(f: Product): Product[] {
  if (!f.b) return [];
  const fam = once("families", () => {
    const m = new Map<string, Product[]>();
    for (const x of getProducts()) {
      if (!x.b) continue;
      const k = familyKey(x);
      m.set(k, [...(m.get(k) ?? []), x]);
    }
    return m;
  });
  return (fam.get(familyKey(f)) ?? []).filter((x) => x.ean !== f.ean);
}

/** What tells a variant apart on its chip: the shade or pack in brackets, else its size. */
export function variantLabel(f: Product): string {
  const inBrackets = [...f.name.matchAll(/\(([^()]*)\)/g)].map((m) => m[1].trim()).filter((x) => x && !/^\d+(?:[.,]\d+)?\s?(?:ml|g|oz|fl oz)$/i.test(x));
  const shade = inBrackets.join(" · ") || f.name.match(/(?:#\s?[\w-]+|\bNo\.?\s?\d+\w*)/i)?.[0] || "";
  return [shade, f.size].filter(Boolean).join(" · ") || f.name;
}

/** Regions where this product has at least one offer, in REGIONS order. */
export function regionsOf(f: Product): RegionCode[] {
  return REGIONS.map((r) => r.code).filter((c) => f.offers[c]?.length);
}

export interface Best {
  region: RegionCode;
  offer: Offer;
  stores: number;
}

export function bestIn(f: Product, region: RegionCode): Best | null {
  const offers = f.offers[region];
  const o = lowestOrderable(offers);
  return o ? { region, offer: o, stores: offers!.length } : null;
}

/** How many distinct stores carry the product anywhere. */
export function storeCount(f: Product): number {
  return new Set(Object.values(f.offers).flatMap((o) => (o ?? []).map((x) => x.s))).size;
}

/** The gap between the cheapest and the dearest orderable store in a region,
 *  as a share of the dearest: "save up to 31%". Only with 2+ orderable stores. */
export function spreadIn(f: Product, region: RegionCode): number | null {
  const orderable = (f.offers[region] ?? []).filter((o) => o.st !== "out");
  if (orderable.length < 2) return null;
  const lo = Math.min(...orderable.map((o) => o.p));
  const hi = Math.max(...orderable.map((o) => o.p));
  return hi > 0 ? (hi - lo) / hi : null;
}

export const storeName = (id: string) => STORE_BY_ID[id]?.name ?? id;

/** Products sold in a region by enough stores, best savings first: the deals list. */
export function dealsIn(region: RegionCode, limit = 48, list: Product[] = getProducts()): { f: Product; spread: number; best: Best }[] {
  const out: { f: Product; spread: number; best: Best }[] = [];
  for (const f of list) {
    const s = spreadIn(f, region);
    const best = bestIn(f, region);
    if (s != null && s >= 0.1 && best && best.offer.st === "in") out.push({ f, spread: s, best });
  }
  return out.sort((a, b) => b.spread - a.spread || a.f.name.localeCompare(b.f.name)).slice(0, limit);
}

export function catCounts(): Record<CatKey, number> {
  const c = Object.fromEntries(CATEGORIES.map((l) => [l.key, 0])) as Record<CatKey, number>;
  for (const f of getProducts()) c[f.cat]++;
  return c;
}

/** Newest first-seen products (new launches and new stock). */
export function newest(limit = 24): Product[] {
  return getProducts().slice().sort((a, b) => b.first.localeCompare(a.first) || storeCount(b) - storeCount(a) || a.name.localeCompare(b.name)).slice(0, limit);
}

/** Most-stocked products: a stand-in for popularity until click data exists. */
export function popular(limit = 24, list: Product[] = getProducts()): Product[] {
  return list.slice().sort((a, b) => storeCount(b) - storeCount(a) || a.name.localeCompare(b.name)).slice(0, limit);
}

/** Products someone can order in this region today. */
export function orderableIn(region: RegionCode, list: Product[] = getProducts()): Product[] {
  return list.filter((f) => f.offers[region]?.some((o) => o.st !== "out"));
}

/** Most-stocked products in a region (a stand-in for popularity). */
export function popularIn(region: RegionCode, limit = 24, list: Product[] = getProducts()): Product[] {
  return orderableIn(region, list)
    .sort((a, b) => (b.offers[region]?.length ?? 0) - (a.offers[region]?.length ?? 0) || a.name.localeCompare(b.name))
    .slice(0, limit);
}

/** Newest products orderable in a region. */
export function newestIn(region: RegionCode, limit = 24): Product[] {
  return orderableIn(region)
    .sort((a, b) => b.first.localeCompare(a.first) || a.name.localeCompare(b.name))
    .slice(0, limit);
}

/** The cheapest orderable products of a list in a region, cheapest first. */
export function cheapestIn(region: RegionCode, list: Product[], limit = 24): { f: Product; best: Best }[] {
  return list
    .flatMap((f) => {
      const best = bestIn(f, region);
      return best && best.stores >= 2 ? [{ f, best }] : [];
    })
    .sort((a, b) => a.best.offer.p - b.best.offer.p || a.f.name.localeCompare(b.f.name))
    .slice(0, limit);
}

/** Stores with at least one listed product, and how many. */
export function activeStores(): Record<string, number> {
  const c: Record<string, number> = {};
  for (const f of getProducts()) for (const o of Object.values(f.offers)) for (const x of o ?? []) c[x.s] = (c[x.s] ?? 0) + 1;
  return c;
}

export interface BrandInfo {
  slug: string;
  name: string;
  products: Product[];
}

/** A brand gets a page once this many of its products are compared. */
export const BRAND_PAGE_MIN = 3;

/** Every brand with a page, most products first. */
export function getBrands(): BrandInfo[] {
  return once("brands", buildBrands);
}

function buildBrands(): BrandInfo[] {
  const by = new Map<string, BrandInfo>();
  for (const f of getProducts()) {
    if (!f.b) continue;
    const b = by.get(f.b) ?? { slug: f.b, name: f.brand, products: [] };
    b.products.push(f);
    by.set(f.b, b);
  }
  return [...by.values()].filter((b) => b.products.length >= BRAND_PAGE_MIN).sort((a, b) => b.products.length - a.products.length || a.name.localeCompare(b.name));
}

export function getBrand(slug: string): BrandInfo | undefined {
  return once("brandBySlug", () => new Map(getBrands().map((b) => [b.slug, b]))).get(slug);
}

/** Brands with a page, by slug: product pages link only to these. */
export function brandPages(): Set<string> {
  return once("brandPages", () => new Set(getBrands().map((b) => b.slug)));
}

/** The brand's own Korean name, when we have it checked (src/content/brands-ko.ts). */
export const brandKo = (brand: string): string | null => (brand ? BRAND_KO[canonicalKey(brand)] ?? null : null);

/** Chip labels for a family: two variants that read the same (an old and a new
 *  packaging, both 150 ml) are told apart by the end of their barcode. */
export function variantLabels(list: Product[]): Map<string, string> {
  const base = new Map(list.map((f) => [f.ean, variantLabel(f)]));
  const seen = new Map<string, number>();
  for (const l of base.values()) seen.set(l, (seen.get(l) ?? 0) + 1);
  return new Map(list.map((f) => [f.ean, seen.get(base.get(f.ean)!)! > 1 ? `${base.get(f.ean)} · …${f.ean.slice(-4)}` : base.get(f.ean)!]));
}

/** The cheapest store for one of this product with delivery added, among the
 *  orderable stores whose delivery we know; null when it is the same store as
 *  the cheapest item price, or nothing is known. `known` / `of` say how many
 *  stores the comparison covers. */
export function cheapestDelivered(f: Product, region: RegionCode): { offer: Offer; total: number; delivery: number; known: number; of: number } | null {
  const ship = getShipping();
  const orderable = (f.offers[region] ?? []).filter((o) => o.st !== "out");
  if (orderable.length < 2) return null;
  let best: { offer: Offer; total: number; delivery: number } | null = null;
  let known = 0;
  for (const o of orderable) {
    const d = deliveryFor(ship[o.s], o.p);
    if (d == null) continue;
    known++;
    if (!best || o.p + d < best.total) best = { offer: o, total: o.p + d, delivery: d };
  }
  const cheapest = orderable.reduce((a, b) => (b.p < a.p ? b : a));
  if (!best || best.offer.s === cheapest.s || known < 2) return null;
  return { ...best, known, of: orderable.length };
}
