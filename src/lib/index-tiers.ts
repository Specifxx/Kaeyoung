// Which product pages ask to be indexed (and go in the sitemap). Family lesson
// (seo-split-pages, index tiers on MTG/Dex Compare): thin pages dilute a new
// domain, so a page earns its place by being worth landing on.
//   indexed: some region has 2+ stores AND someone can order it today
//   noindex, follow: everything sold out everywhere (the page stays for visitors)
//   sitemap (first tier, 2026-11-03): indexed AND widely stocked, i.e. 3+ stores in
//     one region or 2+ stores in two regions. Stores stock what sells, so this is the
//     demand proxy until Search Console has data. Products outside it stay indexable
//     and linked from their category and brand pages; only the sitemap leaves them
//     out. Widen it (inSitemap -> isIndexable) once Search Console shows it indexed.
import { SITE } from "@/site";
import type { Product } from "./types";

export function isIndexable(f: Product): boolean {
  const orderable = Object.values(f.offers).some((o) => o?.some((x) => x.st !== "out"));
  const compared = Object.values(f.offers).some((o) => (o?.length ?? 0) >= SITE.minStoresPerRegion);
  return orderable && compared;
}

/** The first sitemap tier: indexable and stocked widely (DECISIONS.md 2026-11-03). */
export function inSitemap(f: Product): boolean {
  if (!isIndexable(f)) return false;
  const counts = Object.values(f.offers).map((o) => o?.length ?? 0);
  return counts.some((n) => n >= 3) || counts.filter((n) => n >= SITE.minStoresPerRegion).length >= 2;
}
