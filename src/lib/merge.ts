// Turns every store's listings into products: one product per barcode, offers
// grouped by region, a product kept only when one region has enough stores.
// Pure, so tests/merge.test.ts can pin every rule.
import { REGIONS, SITE, type CatKey, type RegionCode } from "@/site";
import { STORE_BY_ID } from "@/content/stores";
import { pickName, readTitle, tidyName } from "./title";
import { brandName, brandSlug, canonicalKey, listingBrand } from "./brand";
import { slugify } from "./slug";
import type { Listing, Offer, Product } from "./types";

const STOCK_RANK = { in: 0, out: 1 } as const;

export function median(xs: number[]): number {
  const s = xs.slice().sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

/**
 * Stores that are one shop under two names (a franchise's second domain on
 * the same Shopify stock) would count twice toward the two-store rule. Within
 * a region, a store whose barcode-and-price pairs are at least 80% another
 * store's (5+ listings) is a mirror: the first store in `order` keeps its
 * listings, the mirror's are dropped. Returns the mirrors as id → kept id.
 */
export function dropMirrors(listings: Listing[], order: string[]): { listings: Listing[]; mirrors: Record<string, string> } {
  const keys = new Map<string, Set<string>>();
  const region = new Map<string, string>();
  for (const l of listings) {
    if (!keys.has(l.store)) keys.set(l.store, new Set());
    keys.get(l.store)!.add(`${l.ean}:${l.cents}`);
    region.set(l.store, l.region);
  }
  const rank = (id: string) => (order.indexOf(id) + 1 || order.length + 1);
  const ids = [...keys.keys()].sort((a, b) => rank(a) - rank(b) || a.localeCompare(b));
  const mirrors: Record<string, string> = {};
  for (let i = 0; i < ids.length; i++) {
    const a = ids[i];
    if (mirrors[a]) continue;
    for (const b of ids.slice(i + 1)) {
      if (mirrors[b] || region.get(a) !== region.get(b)) continue;
      const A = keys.get(a)!;
      const B = keys.get(b)!;
      if (Math.min(A.size, B.size) < 5) continue;
      let shared = 0;
      for (const k of B) if (A.has(k)) shared++;
      if (shared >= 0.8 * Math.min(A.size, B.size)) mirrors[b] = a;
    }
  }
  return { listings: listings.filter((l) => !mirrors[l.store]), mirrors };
}

/** Offers in display order: orderable first, cheapest first. */
export function sortOffers(offers: Offer[]): Offer[] {
  return offers.slice().sort((a, b) => STOCK_RANK[a.st] - STOCK_RANK[b.st] || a.p - b.p || a.s.localeCompare(b.s));
}

/**
 * Drop prices that cannot be the same new product: with three or more stores,
 * anything under 40% or over 250% of the median is a misfiled listing (a
 * single sheet mask filed under the box's barcode), a bundle or a reseller
 * markup. With two, nothing can be judged, so
 * both stay.
 */
export function saneOffers(offers: Offer[]): Offer[] {
  if (offers.length < 3) return offers;
  const med = median(offers.map((o) => o.p));
  return offers.filter((o) => o.p >= med * 0.4 && o.p <= med * 2.5);
}

export interface MergeState {
  /** ean → slug, kept forever so a URL never changes */
  slugs: Record<string, string>;
  /** ean → first seen date */
  first: Record<string, string>;
}

function mode<T extends string>(xs: T[]): T | null {
  const c = new Map<T, number>();
  for (const x of xs) c.set(x, (c.get(x) ?? 0) + 1);
  return [...c.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0] ?? null;
}

export function mergeListings(listings: Listing[], state: MergeState, today: string): Product[] {
  const byEan = new Map<string, Listing[]>();
  for (const l of listings) {
    const list = byEan.get(l.ean) ?? [];
    list.push(l);
    byEan.set(l.ean, list);
  }
  const usedSlugs = new Set(Object.values(state.slugs));
  const out: Product[] = [];
  for (const [ean, all] of byEan) {
    const read = all.map((l) => ({ l, info: readTitle(l.title, l.kind) }));
    const kept = read.filter((r) => !("refused" in r.info));
    if (!kept.length) continue;

    const offers: Partial<Record<RegionCode, Offer[]>> = {};
    let qualifies = false;
    for (const region of REGIONS) {
      const inRegion = kept.filter((r) => r.l.region === region.code).map((r) => r.l);
      // One offer per store: its orderable, cheapest listing.
      const perStore = new Map<string, Offer>();
      for (const l of inRegion) {
        const o: Offer = { s: l.store, p: l.cents, st: l.st, u: l.url };
        const prev = perStore.get(l.store);
        if (!prev || STOCK_RANK[o.st] < STOCK_RANK[prev.st] || (STOCK_RANK[o.st] === STOCK_RANK[prev.st] && o.p < prev.p)) perStore.set(l.store, o);
      }
      const sane = sortOffers(saneOffers([...perStore.values()]));
      if (!sane.length) continue;
      offers[region.code] = sane;
      if (sane.length >= SITE.minStoresPerRegion) qualifies = true;
    }
    if (!qualifies) continue;

    // The brand most stores name, spelled the way the brand list (or most stores) spell it.
    const brands = kept
      .map((r) => listingBrand(r.l.vendor, r.l.title, STORE_BY_ID[r.l.store]?.name ?? r.l.store))
      .filter((b): b is string => !!b);
    const key = mode(brands.map(canonicalKey).filter(Boolean));
    const brand = key ? brandName(key, brands.filter((b) => canonicalKey(b) === key)) : "";
    const cat = (mode(kept.map((r) => ("refused" in r.info ? "other" : r.info.cat)).filter((c) => c !== "other")) ?? "other") as CatKey;
    const size = mode(kept.flatMap((r) => ("refused" in r.info || !r.info.size ? [] : [r.info.size])));
    let name = pickName(kept.map((r) => tidyName(r.l.title, brand)));
    if (size && !name.toLowerCase().replace(/\s/g, "").includes(size.toLowerCase().replace(/\s/g, ""))) name = `${name} ${size}`;

    let slug = state.slugs[ean];
    if (!slug) {
      const base = slugify(name) || `product-${ean}`;
      slug = usedSlugs.has(base) ? `${base}-${ean.slice(-5)}` : base;
      usedSlugs.add(slug);
      state.slugs[ean] = slug;
    }
    if (!state.first[ean]) state.first[ean] = today;
    const img = kept.find((r) => r.l.img)?.l.img ?? null;
    out.push({ ean, slug, name, brand, b: key ? brandSlug(key, brand) : "", cat, size, img, first: state.first[ean], offers });
  }
  return out.sort((a, b) => a.name.localeCompare(b.name));
}
