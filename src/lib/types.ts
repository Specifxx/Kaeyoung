import type { CatKey, RegionCode } from "@/site";

export type Stock = "in" | "out";

/** One store's listing of one product, as committed in data/public/products.json. */
export interface Offer {
  /** store id (src/content/stores.ts) */
  s: string;
  /** price in the region currency's minor unit (cents) */
  p: number;
  st: Stock;
  /** the listing's own URL (untagged; links are tagged at render) */
  u: string;
}

export interface Product {
  /** EAN-13 barcode, Korean prefix 880 */
  ean: string;
  slug: string;
  name: string;
  brand: string;
  /** brand slug, for /brands/<slug> */
  b: string;
  cat: CatKey;
  /** "50ml", "120g", "10 sheets" when the titles say it */
  size: string | null;
  /** a store's own product photo, hotlinked */
  img: string | null;
  /** date (YYYY-MM-DD) the importer first saw this barcode */
  first: string;
  offers: Partial<Record<RegionCode, Offer[]>>;
}

export interface StoreRun {
  ok: boolean;
  error?: string;
  listings: number;
  matched: number;
  refused: Record<string, number>;
  noEan: number;
  ms: number;
  /** Set when this store's stock is another store's (dropMirrors): not counted. */
  mirrorOf?: string;
}

export interface Meta {
  updatedAt: string;
  products: number;
  stores: Record<string, StoreRun>;
  ebay?: { at: string; day: string; calls: number; budget: number; listings: number; skipped?: string };
}

/** The importer's raw reading of one store listing (one variant). */
export interface Listing {
  store: string;
  region: RegionCode;
  /** product title, with the variant's own title appended when it names a size or shade */
  title: string;
  /** the store's vendor field (the brand), when it has one */
  vendor: string;
  /** the store's product type and tags, for the category */
  kind: string;
  ean: string;
  cents: number;
  st: Stock;
  url: string;
  img: string | null;
}

/** Cheapest real eBay Buy It Now listing for a product (data/public/ebay.json). */
export interface EbayPick {
  /** price in the region currency's minor unit */
  p: number;
  u: string;
  t: string;
  img: string | null;
}
export type EbayData = Record<string, Partial<Record<RegionCode, EbayPick>>>;

/** Lowest orderable price per region, recorded only when it changes:
 *  [daysSinceEpoch, minorUnits] pairs (data/public/history.json). */
export type History = Record<string, Partial<Record<RegionCode, [number, number][]>>>;
