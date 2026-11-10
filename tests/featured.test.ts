// Featured products are about US$20 or more (owner, 2026-11-06): the homepage rows, the hero and the eBay plan.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { featureMin, featuredIn, isFeatured } from "../src/lib/featured";
import { planEbay } from "../src/lib/ebay";
import type { Product } from "../src/lib/types";

const prod = (ean: string, region: "US" | "AU", prices: number[], st: ("in" | "out")[] = []): Product => ({
  ean, slug: ean, name: ean, brand: "b", b: "b", cat: "serums", size: "50ml", img: null, first: "2026-10-30",
  offers: { [region]: prices.map((p, i) => ({ s: `s${i}`, p, st: st[i] ?? "in", u: "https://x" })) },
} as Product);

test("about US$20 in every currency, judged on the cheapest in-stock price", () => {
  assert.equal(featureMin("US"), 2000);
  assert.ok(featureMin("AU") > 2000);
  assert.ok(isFeatured(prod("a", "US", [2000, 2500]), "US"));
  assert.ok(!isFeatured(prod("b", "US", [1999, 2500]), "US"));
  assert.ok(isFeatured(prod("c", "US", [900, 2500], ["out", "in"]), "US"), "a sold-out cheap store does not count");
  assert.ok(!isFeatured(prod("d", "AU", [2500, 2600]), "AU"), "A$25 is under US$20");
  assert.ok(!isFeatured(prod("e", "US", [2500]), "AU"));
  assert.deepEqual(featuredIn("US", [prod("x", "US", [1000]), prod("y", "US", [5000])]).map((f) => f.ean), ["y"]);
});

test("eBay calls go only to featured products", () => {
  const list = [prod("cheap", "US", [1000, 1100]), prod("dear", "US", [5000, 5200])];
  const plan = planEbay(list, {}, ["US"], 10, undefined, "2026-11-06", undefined, isFeatured);
  assert.deepEqual(plan.map((p) => p.f.ean), ["dear"]);
  const src = fs.readFileSync("scripts/ebay-import.ts", "utf8");
  assert.match(src, /isFeatured[,)]/);
});

test("the homepage rows read the featured list", () => {
  const src = fs.readFileSync("src/app/page.tsx", "utf8");
  assert.match(src, /featuredIn\(r\.code/);
  assert.match(src, /popularNow\(r\.code, 8, feat\)/);
});
