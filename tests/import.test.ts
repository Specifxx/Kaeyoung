import { test } from "node:test";
import assert from "node:assert/strict";
import { cachedCodes, listingsFromProduct, needsLookup, sizedImage, variantTitle, type ShopifyProduct } from "@/lib/import/shopify";
import type { Store } from "@/content/stores";
import { ean } from "./helpers";

const A = ean("880941647000");
const B = ean("880941647001");
const shop: Store = { id: "s", name: "Shop", region: "AU", base: "https://shop.example", platform: "shopify" };
const product = (over: Partial<ShopifyProduct> = {}): ShopifyProduct => ({
  id: 1,
  title: "COSRX Advanced Snail 96 Mucin Power Essence",
  handle: "cosrx-snail-essence",
  vendor: "COSRX",
  tags: [],
  product_type: "Essence",
  variants: [{ id: 9, title: "Default Title", price: "29.95", available: true, sku: A }],
  images: [{ src: "https://cdn.shopify.com/s/files/1/x.jpg?v=1" }],
  ...over,
});

test("a variant with a Korean barcode in its SKU becomes a listing", () => {
  const r = listingsFromProduct(shop, product());
  assert.equal(r.listings.length, 1);
  const l = r.listings[0];
  assert.equal(l.ean, A);
  assert.equal(l.cents, 2995);
  assert.equal(l.st, "in");
  assert.equal(l.vendor, "COSRX");
  assert.equal(l.url, "https://shop.example/products/cosrx-snail-essence");
  assert.match(l.img!, /width=600/);
});

test("each size is its own listing, by its own barcode", () => {
  const r = listingsFromProduct(
    shop,
    product({
      variants: [
        { id: 1, title: "100ml", price: "29.95", available: true, sku: A },
        { id: 2, title: "30ml", price: "14.95", available: false, sku: B },
      ],
    }),
  );
  assert.deepEqual(r.listings.map((l) => [l.ean, l.title, l.st]), [
    [A, "COSRX Advanced Snail 96 Mucin Power Essence (100ml)", "in"],
    [B, "COSRX Advanced Snail 96 Mucin Power Essence (30ml)", "out"],
  ]);
  assert.match(r.listings[1].url, /\?variant=2$/);
});

test("no barcode, no listing; a cached product-page barcode is used", () => {
  const p = product({ variants: [{ id: 9, title: "Default Title", price: "29.95", available: true, sku: "COSRX-SNAIL" }] });
  assert.equal(listingsFromProduct(shop, p).noEan, 1);
  assert.equal(listingsFromProduct(shop, p, { "9": A }).listings[0].ean, A);
  assert.ok(needsLookup(shop, p));
  assert.ok(!needsLookup(shop, product()), "a SKU barcode needs no lookup");
});

test("mixed stores look up only Korean brands", () => {
  const mixed = { ...shop, mixed: true };
  const p = (vendor: string, title: string) => product({ vendor, title, variants: [{ id: 9, title: "Default Title", price: "29.95", available: true, sku: "X" }] });
  assert.ok(needsLookup(mixed, p("Anua", "Heartleaf 77% Soothing Toner")));
  assert.ok(!needsLookup(mixed, p("L'Oreal", "Revitalift Serum")));
});

test("a tester variant is refused, the full size kept", () => {
  const r = listingsFromProduct(
    shop,
    product({ variants: [{ id: 1, title: "100ml", price: "29.95", available: true, sku: A }, { id: 2, title: "Sample 1ml", price: "1.00", available: true, sku: B }] }),
  );
  assert.equal(r.listings.length, 1);
  assert.deepEqual(r.refused, ["tester"]);
});

test("barcode cache: found codes kept, empty ones re-asked after 30 days", () => {
  const now = Date.parse("2026-10-30");
  assert.deepEqual(cachedCodes({ at: "2025-01-01", v: { "1": A } }, now), { "1": A });
  assert.deepEqual(cachedCodes({ at: "2026-10-20", v: { "1": null } }, now), { "1": null });
  assert.equal(cachedCodes({ at: "2026-09-01", v: { "1": null } }, now), undefined);
  assert.equal(cachedCodes(undefined, now), undefined);
});

test("variant titles and photos", () => {
  assert.equal(variantTitle(product(), { id: 1, title: "Default Title", price: "1", available: true }), "COSRX Advanced Snail 96 Mucin Power Essence");
  assert.equal(sizedImage("//cdn.shopify.com/a.jpg"), "https://cdn.shopify.com/a.jpg?width=600");
});
