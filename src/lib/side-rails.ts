// The side rails' tiles (components/SideRails.tsx draws them; owner, 2026-11-06: "the eBay ads … and instead of the TCGplayer ad,
// the Amazon ad banner that's scrollable"), computed once per region at build and served as one static file per region
// (/rails/<region>, force-static): a page carries none of it and a visit never runs a function.
//
//   • Left, eBay: the daily import's own matches (data/public/ebay.json), the region's most-stocked products first, live
//     Buy It Now listings only (a photo and a delivered price), tagged `ky-<region>-side-ebay-<ean>`.
//   • Right, Amazon: the region's most-stocked products as tagged links to Amazon's own page of that barcode when the import
//     found its ASIN (data/amazon/), else an exact product-name search (Associates rule 4: a specific product, never a
//     category). NO price: Amazon's API refuses us until the account has 10 qualifying sales, and its licence forbids
//     storing a price, so a rail served for a day never shows one. The photo is the store's own, as on our tiles.
//   • Never in the phone dock (an overlay: Associates rule 5), never in an email, never counted as a store.
// Server-only: reads data/ through lib/data.ts.
import { REGIONS, REGION_BY_CODE, type RegionCode } from "@/site";
import { amazonItemUrl, amazonSearchUrl, ebayAffiliateUrl, ebaySearchUrl, ebayShopHost, subId } from "./affiliate";
import { readAsins } from "./amazon-asins";
import { getEbay, popularIn } from "./data";
import { money } from "./format";
import type { Product } from "./types";

/** Up to ten tiles a rail, popular first; the list scrolls inside the rail (the sister sites' rule, owner 2026-11-06). */
export const MAX_TILES = 10;
/** A rail with fewer live tiles than this is not drawn: a rail of one is noise. */
export const MIN_TILES = 2;

export interface RailTile {
  id: string;
  name: string;
  img: string;
  /** formatted, delivered (eBay only; Amazon tiles never carry a price) */
  price: string | null;
  href: string;
}

export interface Rails {
  region: RegionCode;
  ebay: { label: string; more: string | null; tiles: RailTile[] };
  amazon: { label: string; tiles: RailTile[] } | null;
}

function searchQuery(f: Product): string {
  return f.name.replace(/[()]/g, " ").replace(/\s+/g, " ").trim();
}

const cache = new Map<RegionCode, Rails>();

export function railsFor(region: RegionCode): Rails {
  const hit = cache.get(region);
  if (hit) return hit;
  const r = REGION_BY_CODE[region];
  const ebay = getEbay();
  const popular = popularIn(region, 400);

  // New Zealand shops on eBay Australia (lib/affiliate.ts ebayShopHost): its rail is Australia's listings, priced in A$.
  const ebayRegion: RegionCode = region === "NZ" ? "AU" : region;
  const ebayTiles: RailTile[] = [];
  for (const f of region === "NZ" ? popularIn("AU", 400) : popular) {
    const pick = ebay[f.ean]?.[ebayRegion];
    if (!pick?.img || pick.p == null) continue;
    ebayTiles.push({ id: f.ean, name: f.name, img: pick.img, price: money(pick.p, ebayRegion), href: ebayAffiliateUrl(pick.u, subId(region, "side-ebay", f.ean)) });
    if (ebayTiles.length >= MAX_TILES) break;
  }
  // Too few live listings (a region the eBay pass has not reached yet, or no keyset yet): the rest of the rail is tagged
  // eBay searches for the region's most-stocked products, by exact name with the store's photo and no price, like Amazon's.
  if (ebayTiles.length < MAX_TILES && ebayShopHost(region)) {
    const have = new Set(ebayTiles.map((t) => t.id));
    for (const f of popular) {
      if (ebayTiles.length >= MAX_TILES) break;
      if (have.has(f.ean) || !f.img) continue;
      const href = ebaySearchUrl(searchQuery(f), region, subId(region, "side-ebay", f.ean));
      if (href) ebayTiles.push({ id: f.ean, name: f.name, img: f.img, price: null, href });
    }
  }

  let amazon: Rails["amazon"] = null;
  if (r.amazonHost) {
    const asins = readAsins(region);
    const seen = new Set(ebayTiles.map((t) => t.id));
    // Products Amazon's own page was found for first (a /dp/ link lands on the exact item), then the rest by name.
    const ranked = popular.filter((f) => f.img).sort((a, b) => Number(!!asins[b.ean]?.[0]) - Number(!!asins[a.ean]?.[0]));
    const tiles: RailTile[] = [];
    for (const f of [...ranked.filter((f) => !seen.has(f.ean)), ...ranked.filter((f) => seen.has(f.ean))]) {
      const sub = subId(region, "side-amazon", f.ean);
      const asin = asins[f.ean]?.[0];
      const href = (asin && amazonItemUrl(asin, region, sub)) || amazonSearchUrl(searchQuery(f), region, sub);
      if (!href) continue;
      tiles.push({ id: f.ean, name: f.name, img: f.img!, price: null, href });
      if (tiles.length >= MAX_TILES) break;
    }
    amazon = { label: r.amazonHost.replace(/^www\./, ""), tiles };
  }

  const host = ebayShopHost(region);
  const rails: Rails = {
    region,
    ebay: { label: host ? host.replace(/^www\./, "") : "eBay", more: ebaySearchUrl("korean skincare", region, subId(region, "side-ebay")), tiles: ebayTiles },
    amazon,
  };
  cache.set(region, rails);
  return rails;
}

export const RAIL_REGIONS = REGIONS.map((r) => r.code);
