// The committed data under data/public, read at BUILD time only: every page is
// prerendered once per release (one [deploy] build a day), so a visit is a
// static file from Vercel's CDN, never a function and never a database read.
import fs from "node:fs";
import path from "node:path";
import { CATEGORIES, REGIONS, type CatKey, type RegionCode } from "@/site";
import { STORE_BY_ID } from "@/content/stores";
import { lowestOrderable } from "./history";
import type { EbayData, History, Meta, Offer, Product } from "./types";

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

export const getProducts = (): Product[] =>
  load<{ products: Product[] }>("products.json", { products: [] }).products.filter((f) => f.offers && Object.values(f.offers).some((o) => o?.length));
export const getMeta = (): Meta | null => load<Meta | null>("meta.json", null);
export const getHistory = (): History => load<History>("history.json", {});
export const getEbay = (): EbayData => load<EbayData>("ebay.json", {});

export function getProduct(slug: string): Product | undefined {
  return getProducts().find((f) => f.slug === slug);
}

export function productsOfCat(cat: CatKey): Product[] {
  return getProducts().filter((f) => f.cat === cat);
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
  return getBrands().find((b) => b.slug === slug);
}

/** Brands with a page, by slug: product pages link only to these. */
export function brandPages(): Set<string> {
  return new Set(getBrands().map((b) => b.slug));
}
