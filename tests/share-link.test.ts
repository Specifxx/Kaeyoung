import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { priceGap, shareUrl } from "../src/lib/share-link";
import { cheapestOf, decodeShared, encodeShared } from "../src/lib/basket";

// Word of mouth (DECISIONS.md, "Share buttons and shared baskets", 2026-11-02): client-side only, no new function.
const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

test("every shared link carries utm_source=share, keeping a shared basket's list", () => {
  assert.equal(shareUrl("https://kaeyoung.com", "/basket?b=a,b", "basket"), "https://kaeyoung.com/basket?b=a%2Cb&utm_source=share&utm_medium=basket");
});

test("the price gap needs two stores and a real spread", () => {
  assert.equal(priceGap([{ priceCents: 2000, storeName: "A" }, { priceCents: 1500, storeName: "B" }])!.pct, 25);
  assert.equal(priceGap([{ priceCents: 2000, storeName: "A" }]), null);
});

test("a shared basket round-trips its slugs and refuses junk", () => {
  assert.equal(decodeShared(`?b=${encodeShared(["anua-toner", "cosrx-snail"])}&utm_source=share`)!.join(" "), "anua-toner cosrx-snail");
  assert.deepEqual(decodeShared("?b=ok-1,<script>,ok-1,BAD"), ["ok-1"]);
  assert.equal(decodeShared("?x=1"), null);
});

test("each basket item shows its cheapest in-stock store", () => {
  const data = { stores: [["s1", "Store One", null], ["s2", "Store Two", null]] as [string, string, null][], offers: [[0, 1200, 1, 999], 0] as (number[] | 0)[] };
  assert.deepEqual(cheapestOf(data, 0), { name: "Store Two", price: 999 });
  assert.equal(cheapestOf(data, 1), null);
});

test("share buttons on the product page, quick view and basket; robots lets previews fetch shared links", () => {
  assert.match(read("src/app/product/[slug]/page.tsx"), /<ShareButton /);
  assert.match(read("src/components/QuickView.tsx"), /<ShareButton /);
  assert.match(read("src/components/Basket.tsx"), /<ShareButton title="My K-beauty basket"/);
  assert.match(read("src/components/Basket.tsx"), /noindex, follow/);
  assert.match(read("src/app/layout.tsx"), /<ShareArrival \/>/);
  assert.match(read("src/app/robots.ts"), /"\/\*utm_source=share"/);
});
