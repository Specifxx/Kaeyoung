import type { MetadataRoute } from "next";
import { CATEGORIES, SITE } from "@/site";
import { getBrands, getMeta, getProducts } from "@/lib/data";
import { isIndexable } from "@/lib/index-tiers";
import { GUIDES } from "@/lib/guides";
import { pageCount } from "@/components/CatHub";

// Only pages worth landing on (src/lib/index-tiers.ts): hubs, brands, guides,
// and products someone can order with 2+ stores compared. Sold-out products
// stay reachable but noindex, and out of here.
export default function sitemap(): MetadataRoute.Sitemap {
  const updated = getMeta()?.updatedAt ?? new Date().toISOString();
  const u = (p: string, priority: number): MetadataRoute.Sitemap[number] => ({ url: `${SITE.url}${p}`, lastModified: updated, priority });
  return [
    u("/", 1),
    ...CATEGORIES.map((c) => u(`/${c.key}`, 0.9)),
    ...CATEGORIES.flatMap((c) => Array.from({ length: pageCount(c.key) - 1 }, (_, i) => u(`/${c.key}/page/${i + 2}`, 0.4))),
    u("/deals", 0.8),
    u("/new", 0.7),
    u("/brands", 0.8),
    ...getBrands().map((b) => u(`/brands/${b.slug}`, 0.8)),
    u("/guides", 0.7),
    ...GUIDES.map((g) => u(`/guides/${g.slug}`, 0.8)),
    u("/stores", 0.6),
    u("/about", 0.3),
    ...getProducts().filter(isIndexable).map((f) => u(`/product/${f.slug}`, 0.7)),
  ];
}
