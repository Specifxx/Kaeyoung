// The on-disk shape of data/public/products.json (DECISIONS.md "products.json
// is written compact"). The site and the scripts work with `Product`; only
// this file knows how it is stored. Lossless: unpack(pack(x)) equals x.
//
// Version 2 keeps each product an object (readable diffs, `ean` where
// reviews-export looks for it) but stores each offer as a tuple and drops
// the parts every row repeats:
//   offer  [store, cents, url]       in stock
//          [store, cents, url, 0]    out of stock
//          [store, cents, url, 1, v] in stock, with its Shopify variant id `v`
//                                    in base 36 (2026-11-06: the buy button
//                                    opens the store's checkout with it). Left
//                                    out when the url already ends in
//                                    ?variant=<id> (read back from there), and
//                                    for an out-of-stock offer (no checkout).
//   url    the part after `<store base>/products/` when the listing is there
//          (all of them today), else the full URL
//   img    the part after `https://cdn.shopify.com/s/files/`, else the full URL
// A file without `v` is the old shape (one object per offer) and is read as is.
import { STORE_BY_ID } from "@/content/stores";
import type { RegionCode } from "@/site";
import type { Offer, Product } from "./types";

const SHOPIFY_FILES = "https://cdn.shopify.com/s/files/";
const FULL = /^https?:\/\//;

export type PackedOffer = [string, number, string] | [string, number, string, 0] | [string, number, string, 1, string];
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

const VARIANT_IN_URL = /[?&]variant=(\d{1,20})(?:&|$)/;
const isVariant = (v: string | undefined): v is string => !!v && /^\d{1,20}$/.test(v);

export function packOffer(o: Offer): PackedOffer {
  const base = listingBase(o.s);
  const u = base && o.u.startsWith(base) && o.u.length > base.length ? o.u.slice(base.length) : o.u;
  if (o.st === "out") return [o.s, o.p, u, 0];
  if (isVariant(o.v) && VARIANT_IN_URL.exec(o.u)?.[1] !== o.v) return [o.s, o.p, u, 1, BigInt(o.v).toString(36)];
  return [o.s, o.p, u];
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
  const st = t.length === 4 ? "out" : "in";
  let v: string | undefined;
  if (st === "in") {
    if (t.length === 5 && /^[0-9a-z]{1,14}$/.test(t[4])) v = [...t[4]].reduce((n, c) => n * 36n + BigInt(parseInt(c, 36)), 0n).toString();
    else v = VARIANT_IN_URL.exec(u)?.[1];
  }
  return v ? { s, p, st, u, v } : { s, p, st, u };
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
