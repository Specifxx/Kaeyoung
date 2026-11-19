// What the homepage shows in each region, in one place (owner, 2026-11-19: "all the items on the homepage … are the
// priority items and they must get eBay quota and they must have eBay prices and Amazon prices first"). The page
// (src/app/page.tsx), the eBay plan (scripts/ebay-import.ts) and the Amazon ASIN search and price fetch
// (scripts/amazon-asins.ts, scripts/fetch-amazon-prices.ts) all read it, so the products a visitor sees on the
// homepage are exactly the ones searched first. Pure over the product list; never used to order prices.
import type { RegionCode } from "@/site";
import { dealsIn, newestIn } from "./data";
import { homeFeaturedIn } from "./featured";
import { heroPicks } from "./hero-picks";
import { rankProducts } from "./home-demand";
import { popularNow } from "./ratings";
import type { Product } from "./types";

export interface HomeShelves {
  pop: Product[];
  deals: Product[];
  fresh: Product[];
}

/** The homepage's three shelves in a region: Popular, Biggest savings, New arrivals (eight each). */
export function homeShelves(region: RegionCode, all: Product[]): HomeShelves {
  // Only products of about US$75 or more are featured here (owner, 2026-11-12, lib/featured.ts).
  const feat = homeFeaturedIn(region, all);
  // Most likely to earn first (owner, 2026-11-18; lib/home-rank.ts): three times as many ranked, eight shown. New stays newest first.
  return {
    pop: rankProducts(popularNow(region, 24, feat), region).slice(0, 8),
    deals: rankProducts(dealsIn(region, 24, feat).map((d) => d.f), region).slice(0, 8),
    fresh: newestIn(region, 8, feat),
  };
}

/** Every product the homepage shows in a region (the hero's pair and the three shelves), by barcode. */
export function homeEans(region: RegionCode, all: Product[]): Set<string> {
  const s = homeShelves(region, all);
  return new Set([...heroPicks(region, all).map((p) => p.f), ...s.pop, ...s.deals, ...s.fresh].map((f) => f.ean));
}
