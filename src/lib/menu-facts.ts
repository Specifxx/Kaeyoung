// What the header menus list, from data already loaded (no new read): each link tagged with the markets that have products behind it,
// so a visitor is never sent to an empty page (Bill, 2026-11-09). Server-side; lib/nav.ts is the pure client-safe half.
import { CATEGORIES, type CatKey } from "@/site";
import { ACTIVE_REGIONS } from "@/lib/regions";
import { getBrands, needHubs, productsForNeed, productsOfCat, regionsOf } from "@/lib/data";
import { NEED_INDEX_MIN } from "@/lib/needs";
import { needPath } from "@/lib/needs";
import type { MenuFacts, MenuLink } from "@/lib/nav";
import type { Product } from "@/lib/types";

/** The markets with at least one of these products; undefined when that is every market the site serves (no class needed). */
export function marketsOf(list: Product[]): string[] | undefined {
  const have = new Set<string>();
  for (const f of list) for (const r of regionsOf(f)) have.add(r);
  const out = ACTIVE_REGIONS.map((r) => r.code as string).filter((c) => have.has(c));
  return out.length === ACTIVE_REGIONS.length ? undefined : out;
}

export function menuFacts(): MenuFacts {
  const need = (kind: "concern" | "ingredient", max: number): MenuLink[] =>
    needHubs(kind)
      .filter((h) => h.count >= NEED_INDEX_MIN)
      .slice(0, max)
      .map((h) => ({ href: needPath(h.need), label: h.need.name, regions: marketsOf(productsForNeed(kind, h.need.slug)) }));
  return {
    catRegions: Object.fromEntries(CATEGORIES.map((c) => [c.key, marketsOf(productsOfCat(c.key as CatKey))])),
    brands: getBrands()
      .slice(0, 14)
      .map((b) => ({ href: `/brands/${b.slug}`, label: b.name, regions: marketsOf(b.products) })),
    concerns: need("concern", 12),
    ingredients: need("ingredient", 10),
  };
}
