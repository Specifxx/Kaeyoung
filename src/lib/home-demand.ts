// The home page's ranking input and how a product reads into it (lib/home-rank.ts; DECISIONS.md "Home pages rank items by
// demand", 2026-11-18). data/demand.json is written into the daily data commit by import.yml (scripts/pull-demand.sh, from
// RiftCompare's /api/demand/<site>: product page views, last 28 and 7 days) and read at build: imported, no request-time read.
import raw from "../../data/demand.json";
import type { RegionCode } from "@/site";
import { bestIn } from "./data";
import { rankItems, type DemandFile } from "./home-rank";
import type { Product } from "./types";

export const HOME_DEMAND = raw as DemandFile;

/** Products, most likely to earn first in a region: their page's views, stores in stock there, price, how new. */
export function rankProducts(list: readonly Product[], region: RegionCode): Product[] {
  return rankItems(
    list,
    (f) => {
      const best = bestIn(f, region);
      const open = (f.offers[region] ?? []).filter((o) => o.st !== "out");
      return {
        paths: [`/product/${f.slug}`],
        clickKey: f.slug,
        priceCents: best?.offer.p ?? null,
        inStock: new Set(open.map((o) => o.s)).size,
        releaseDate: f.first ? f.first.slice(0, 10) : null,
      };
    },
    HOME_DEMAND,
  );
}
