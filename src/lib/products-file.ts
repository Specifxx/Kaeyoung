// The on-disk shape of data/public/products.json (DECISIONS.md "products.json
// is written compact"). The site and the scripts work with `Product`; only
// this file knows how it is stored. Lossless: unpack(pack(x)) equals x.
//
// Version 2 keeps each product an object (readable diffs, `ean` where
// reviews-export looks for it) but stores each offer as a tuple and drops
// the parts every row repeats:
//   offer  [store, cents, url]       in stock
//          [store, cents, url, 0]    out of stock
//   url    the part after `<store base>/products/` when the listing is there
//          (all of them today), else the full URL
//   img    the part after `https://cdn.shopify.com/s/files/`, else the full URL
// A file without `v` is the old shape (one object per offer) and is read as is.
import { STORE_BY_ID } from "@/content/stores";
import type { RegionCode } from "@/site";
import type { Offer, Product } from "./types";

const SHOPIFY_FILES = "https://cdn.shopify.com/s/files/";
const FULL = /^https?:\/\//;

export type PackedOffer = [string, number, string] | [string, number, string, 0];
export type PackedProduct = Omit<Product, "offers"> & { offers: Partial<Record<RegionCode, PackedOffer[]>> };
export interface ProductsFileV2 {
  v: 2;
  products: PackedProduct[];
}
type AnyProductsFile = ProductsFileV2 | { v?: undefined; products: Product[] };

const listingBase = (store: string): string | null => {
  const s = STORE_BY_ID[store];
  return s ? `${s.base.replace(/\/+$/, "")}/products/` : null;
};

export function packOffer(o: Offer): PackedOffer {
  const base = listingBase(o.s);
  const u = base && o.u.startsWith(base) && o.u.length > base.length ? o.u.slice(base.length) : o.u;
  return o.st === "out" ? [o.s, o.p, u, 0] : [o.s, o.p, u];
}

/** null when the URL was stored short and its store is no longer listed (nothing to link to). */
export function unpackOffer(t: PackedOffer): Offer | null {
  const [s, p, short] = t;
  let u = short;
  if (!FULL.test(short)) {
    const base = listingBase(s);
    if (!base) return null;
    u = base + short;
  }
  return { s, p, st: t.length > 3 ? "out" : "in", u };
}

export const packImg = (img: string | null): string | null => (img && img.startsWith(SHOPIFY_FILES) ? img.slice(SHOPIFY_FILES.length) : img);
export const unpackImg = (img: string | null): string | null => (img && !FULL.test(img) ? SHOPIFY_FILES + img : img);

export function packProducts(products: Product[]): ProductsFileV2 {
  return {
    v: 2,
    products: products.map((f) => ({
      ...f,
      img: packImg(f.img),
      offers: Object.fromEntries(Object.entries(f.offers).map(([r, os]) => [r, (os ?? []).map(packOffer)])),
    })),
  };
}

export function unpackProducts(file: AnyProductsFile | null | undefined): Product[] {
  if (!file?.products) return [];
  if (file.v !== 2) return file.products as Product[];
  return file.products.map((f) => ({
    ...f,
    img: unpackImg(f.img),
    offers: Object.fromEntries(
      Object.entries(f.offers).map(([r, os]) => [r, (os ?? []).map(unpackOffer).filter((o): o is Offer => !!o)]),
    ) as Product["offers"],
  }));
}
