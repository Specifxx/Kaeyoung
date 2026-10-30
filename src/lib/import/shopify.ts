// Reads a Shopify store through its public products.json: 250 products a
// page, stopping at the first short page. Every variant (a size, a shade, a
// single sheet or a box) is its own listing, matched by its own barcode. The
// barcode comes from the variant's SKU when a store files it there; the list
// API has no barcode field, so otherwise it is looked up in
// /products/<handle>.json (barcodes on 104–120 of 120 sampled products at most
// shops in the 2026-10-30 probe), cached by product in
// data/state/barcodes.json and capped per run. About a request a second:
// Shopify answers 429 to a runner going faster.
import { REGION_BY_CODE } from "@/site";
import type { Store } from "@/content/stores";
import { eanOf } from "../ean";
import { readTitle } from "../title";
import type { Listing, Stock } from "../types";
import { fetchJson, sleep } from "./http";

export interface ShopifyVariant {
  id: number;
  title: string;
  price: string;
  available: boolean;
  sku?: string | null;
  barcode?: string | null;
  featured_image?: { src: string } | null;
}
export interface ShopifyProduct {
  id: number;
  title: string;
  handle: string;
  vendor?: string;
  body_html?: string | null;
  tags: string[] | string;
  product_type?: string;
  images?: { src: string }[];
  variants: ShopifyVariant[];
}

export interface ReadResult {
  listings: Listing[];
  seen: number;
  refused: Record<string, number>;
  noEan: number;
}

/** store:productId → each variant's barcode from the product page (null: none),
 *  and the day we asked. */
export type BarcodeCache = Record<string, { at: string; v: Record<string, string | null> }>;

/** A variant's barcode does not change, so a product with any barcode is kept
 *  for good. A product that had none is asked again after 30 days, in case the
 *  store fills it in. undefined = ask now. */
export function cachedCodes(entry: BarcodeCache[string] | undefined, now = Date.now()): Record<string, string | null> | undefined {
  if (!entry) return undefined;
  if (Object.values(entry.v).some(Boolean)) return entry.v;
  const age = (now - Date.parse(entry.at)) / 86_400_000;
  return age < 30 ? entry.v : undefined;
}

const MAX_PAGES = 80;
/** Barcode lookups per run, across every store (≈ 40 minutes at one a second
 *  per worker). New products wait for the next run once it is spent;
 *  fill-barcodes.yml does the first big fill on 16 runners. */
export const PRODUCT_LOOKUPS_PER_RUN = 2400;
export const PACE_MS = 1000;

/** Brands that mark a product as Korean beauty in a shop that also sells
 *  other things (`mixed` stores): only these are worth a barcode lookup
 *  there. The 880 barcode still decides. From the 2026-10-30 probe. */
export const K_BRANDS =
  /\b(cosrx|beauty of joseon|anua|skin1004|round ?lab|torriden|isntree|laneige|innisfree|etude|missha|some ?by ?mi|klairs|purito|medicube|numbuzin|ma:nyo|manyo|mixsoon|abib|axis-y|haruharu|dr\.? ?jart|sulwhasoo|tirtir|banila|pyunkang|heimish|benton|neogen|illiyoon|aestura|biodance|goodal|d'alba|dalba|apieu|a'pieu|tonymoly|holika|skinfood|wishtrend|iunik|cos de baha|elizavecca|mediheal|nacific|rovectin|aprilskin|celimax|vt cosmetics|ample:n|jumiso|beplain|make p:rem|tocobo|thank you farmer|i'm from|im from|papa recipe|hanyul|belif|hera|peripera|rom&nd|romand|clio|3ce|amuse|fwee|kaine|dr\.? ?g|uiq|zeroid|bringgreen|cnp|daeng gi meo ri|ryo|mise en scene|skin&lab|dr\.? ?ceuracle|hince|espoir|huxley|mary ?& ?may|real barrier|atopalm|needly|ongredients|frudia|secret key|it'?s skin|nature republic|the face shop|hyggee|unleashia|wakemake|then i met you|arencia|house of hur|barulab|lador|masil|k-?beauty|korean)\b/i;

export function stockOf(available: boolean): Stock {
  return available ? "in" : "out";
}

/** Shopify's CDN resizes on request: a 600 px photo, not the 3000 px original. */
export function sizedImage(src: string | undefined | null, width = 600): string | null {
  if (!src) return null;
  try {
    const u = new URL(src.startsWith("//") ? `https:${src}` : src);
    if (u.hostname === "cdn.shopify.com" || u.pathname.startsWith("/cdn/shop/")) u.searchParams.set("width", String(width));
    return u.toString();
  } catch {
    return null;
  }
}

/** The title a variant is read and named by: the product's, plus the variant's
 *  own when it says something ("50ml", "Box of 10"). */
export function variantTitle(p: ShopifyProduct, v: ShopifyVariant): string {
  const vt = (v.title || "").trim();
  if (!vt || /^default(\s*title)?$/i.test(vt) || p.title.toLowerCase().includes(vt.toLowerCase())) return p.title;
  return `${p.title} ${/^[([]/.test(vt) ? vt : `(${vt})`}`;
}

/** Does a product need its page read for barcodes? (No barcode in any SKU yet.) */
export function needsLookup(store: Store, p: ShopifyProduct): boolean {
  if ("refused" in readTitle(p.title)) return false;
  if (!p.variants.some((v) => Number(v.price) > 0)) return false;
  if (p.variants.some((v) => eanOf({ sku: v.sku, barcode: v.barcode }))) return false;
  return !store.mixed || K_BRANDS.test(`${p.vendor ?? ""} ${p.title}`);
}

/** One store product → its listings (one per variant with a Korean barcode). */
export function listingsFromProduct(
  store: Store,
  p: ShopifyProduct,
  codes?: Record<string, string | null>,
): { listings: Listing[]; refused: string[]; noEan: number } {
  const res = { listings: [] as Listing[], refused: [] as string[], noEan: 0 };
  const tags = Array.isArray(p.tags) ? p.tags : String(p.tags || "").split(",");
  const kind = `${p.product_type ?? ""} ${tags.join(" ")}`;
  const variants = p.variants.filter((v) => Number(v.price) > 0);
  if (!variants.length) {
    res.refused.push("no-price");
    return res;
  }
  const text = variants.length === 1 ? `${p.body_html ?? ""}` : null;
  for (const v of variants) {
    const title = variantTitle(p, v);
    const info = readTitle(title, kind);
    if ("refused" in info) {
      res.refused.push(info.refused);
      continue;
    }
    const ean = eanOf({ barcode: v.barcode, sku: v.sku, text }) ?? eanOf({ barcode: codes?.[String(v.id)] ?? null });
    if (!ean) {
      res.noEan++;
      continue;
    }
    res.listings.push({
      store: store.id,
      region: store.region,
      title,
      vendor: p.vendor ?? "",
      kind,
      ean,
      cents: Math.round(Number(v.price) * 100),
      st: stockOf(v.available),
      url: `${store.base}/products/${p.handle}${variants.length > 1 ? `?variant=${v.id}` : ""}`,
      img: sizedImage(v.featured_image?.src ?? p.images?.[0]?.src),
    });
  }
  return res;
}

/** The shop's own currency (/meta.json). products.json is priced in it
 *  whatever country is asked for, so a shop whose own currency is not the
 *  region's is skipped even when its checkout would charge the region's. */
export async function shopifyOwnCurrency(store: Store): Promise<string | null> {
  try {
    const d = await fetchJson<{ currency?: string }>(`${store.base}/meta.json`, {}, 1);
    return d.currency ?? null;
  } catch {
    return null;
  }
}

export async function readShopify(store: Store, cache: BarcodeCache, budget: { lookups: number }): Promise<ReadResult> {
  const country = REGION_BY_CODE[store.region].shopifyCountry;
  const res: ReadResult = { listings: [], seen: 0, refused: {}, noEan: 0 };
  const seen = new Set<number>();
  for (let page = 1; page <= MAX_PAGES; page++) {
    const data = await fetchJson<{ products: ShopifyProduct[] }>(`${store.base}/products.json?limit=250&page=${page}&country=${country}`);
    for (const p of data.products) {
      if (seen.has(p.id)) continue;
      seen.add(p.id);
      res.seen++;
      const key = `${store.id}:${p.id}`;
      let codes = cachedCodes(cache[key]);
      if (codes === undefined && budget.lookups > 0 && needsLookup(store, p)) {
        budget.lookups--;
        const found = await productBarcodes(store, p).catch(() => undefined);
        // A failed lookup is not cached: it is tried again next run.
        if (found) {
          cache[key] = { at: new Date().toISOString().slice(0, 10), v: found };
          codes = found;
        }
        await sleep(PACE_MS);
      }
      const r = listingsFromProduct(store, p, codes);
      for (const x of r.refused) res.refused[x] = (res.refused[x] ?? 0) + 1;
      res.noEan += r.noEan;
      res.listings.push(...r.listings);
    }
    if (data.products.length < 250) break;
    await sleep(PACE_MS);
  }
  return res;
}

async function productBarcodes(store: Store, p: ShopifyProduct): Promise<Record<string, string | null>> {
  const d = await fetchJson<{ product: ShopifyProduct }>(`${store.base}/products/${p.handle}.json`, {}, 2);
  const out: Record<string, string | null> = {};
  for (const v of d.product.variants) out[String(v.id)] = eanOf({ barcode: v.barcode, sku: v.sku });
  return out;
}
