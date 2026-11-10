import { REGIONS, type RegionCode } from "@/site";
import { bestIn, spreadIn } from "@/lib/data";
import type { Product } from "@/lib/types";
import { reviewsOf } from "@/lib/ratings";
import { Tiles, type TileRow } from "./Tiles";

// A product card grid. With `region` it shows that region's price only (lists already split by region); without,
// every region's, switched by CSS (.rp-XX). The tiles are drawn by the client component Tiles from compact rows, so
// the page's RSC payload carries a few numbers per product instead of a second copy of every tile's markup, and the
// tile markup itself uses short classes (globals.css, .pt-*). Same look, same server HTML text, about a fifth of the
// bytes (DECISIONS.md 2026-11-10, "Hub pages under 300 KB").

/** One product as the client grid needs it: everything precomputed on the server at build. */
export function tileRow(f: Product, codes: RegionCode[]): TileRow {
  const rated = reviewsOf(f);
  return [
    f.slug,
    f.name,
    f.brand || "",
    f.img || "",
    rated && rated.n > 0 ? Math.round(rated.avg * 10) : 0,
    rated?.n ?? 0,
    codes.map((code) => {
      const b = bestIn(f, code);
      const s = spreadIn(f, code);
      // [price in minor units, stores, save %]; price -1 sold out here, -2 not sold here yet.
      return [b ? b.offer.p : f.offers[code]?.length ? -1 : -2, b ? b.stores : 0, s != null && s >= 0.1 ? Math.round(s * 100) : 0];
    }),
  ];
}

/** One tile on its own (a page that places a single product, e.g. a "smells like" page's original). */
export function ProductTile({ f, region }: { f: Product; region?: RegionCode }) {
  const codes = region ? [region] : REGIONS.map((r) => r.code);
  return <Tiles rows={[tileRow(f, codes)]} codes={codes} one={!!region} />;
}

export function TileGrid({ products, region }: { products: Product[]; region?: RegionCode }) {
  const codes = region ? [region] : REGIONS.map((r) => r.code);
  return (
    <div data-reveal="stagger" className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
      <Tiles rows={products.map((f) => tileRow(f, codes))} codes={codes} one={!!region} />
    </div>
  );
}
