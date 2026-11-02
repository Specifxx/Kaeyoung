import test from "node:test";
import assert from "node:assert/strict";
import { packProducts, unpackProducts } from "@/lib/products-file";
import { STORES } from "@/content/stores";
import type { Product } from "@/lib/types";

const store = STORES[0];
const sample: Product[] = [
  {
    ean: "8809433340668",
    slug: "a-mask",
    name: "A Mask 25g",
    brand: "107",
    b: "107",
    cat: "masks",
    size: "25g",
    img: "https://cdn.shopify.com/s/files/1/0800/9883/files/a.webp?v=1&width=600",
    first: "2026-10-30",
    offers: {
      [store.region]: [
        { s: store.id, p: 1800, st: "in", u: `${store.base}/products/a-mask?variant=123` },
        { s: store.id, p: 1900, st: "out", u: `${store.base}/products/a-mask-2` },
        { s: "gone-store", p: 2000, st: "in", u: "https://elsewhere.example/p/1" },
      ],
    },
  },
];

test("products.json packs losslessly and short", () => {
  const packed = JSON.parse(JSON.stringify(packProducts(sample)));
  assert.equal(packed.v, 2);
  assert.deepEqual(packed.products[0].offers[store.region][0], [store.id, 1800, "a-mask?variant=123"]);
  assert.deepEqual(packed.products[0].offers[store.region][1], [store.id, 1900, "a-mask-2", 0]);
  assert.equal(packed.products[0].img, "1/0800/9883/files/a.webp?v=1&width=600");
  assert.deepEqual(unpackProducts(packed), sample);
});

test("the old one-object-per-offer file still reads", () => {
  assert.deepEqual(unpackProducts({ products: sample }), sample);
  assert.deepEqual(unpackProducts(null), []);
});
