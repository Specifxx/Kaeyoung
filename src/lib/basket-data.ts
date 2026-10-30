// Builds /basket-data/<region> at build time (lib/basket.ts reads it in the
// browser): the region's stores with their delivery quotes, and each
// product's in-stock offers, in /search-index.json's row order.
import type { RegionCode } from "@/site";
import { getProducts, getShipping, storeName } from "./data";
import type { BasketData } from "./basket";

export function basketData(region: RegionCode): BasketData {
  const ship = getShipping();
  const ids: string[] = [];
  const idx = new Map<string, number>();
  const offers = getProducts().map((f) => {
    const flat: number[] = [];
    for (const o of f.offers[region] ?? []) {
      if (o.st !== "in") continue;
      if (!idx.has(o.s)) idx.set(o.s, ids.push(o.s) - 1);
      flat.push(idx.get(o.s)!, o.p);
    }
    return flat.length ? flat : 0;
  });
  return { stores: ids.map((id) => [id, storeName(id), ship[id] ?? null]), offers };
}
