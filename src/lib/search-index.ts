// Builds the rows of /search-index.json (lib/browse.ts IndexRow), at build time.
import { REGIONS } from "@/site";
import { brandKo, brandPages, getProducts } from "./data";
import { lowestOrderable } from "./history";
import { popularity, reviewsOf } from "./ratings";
import type { IndexRow } from "./browse";

export function indexRows(): IndexRow[] {
  const pages = brandPages();
  return getProducts().map((f) => {
    const prices: IndexRow[4] = {};
    for (const r of REGIONS) {
      const low = lowestOrderable(f.offers[r.code]);
      if (low) prices[r.code] = low.p;
    }
    const rv = reviewsOf(f);
    return [f.slug, f.name, f.cat, f.ean, prices, f.brand, f.b && pages.has(f.b) ? f.b : "", rv ? Math.round(rv.avg * 10) : 0, rv?.n ?? 0, Math.round(popularity(f) * 10) / 10, f.first, brandKo(f.brand) ?? ""];
  });
}
