import { test } from "node:test";
import assert from "node:assert/strict";
import { inSitemap, isIndexable, prebuiltProducts, PREBUILT_PRODUCTS } from "@/lib/index-tiers";
import type { Offer, Product } from "@/lib/types";

const o = (s: string, st: "in" | "out" = "in"): Offer => ({ s, p: 1000, st, u: "/x" });
const prod = (offers: Product["offers"]) => ({ offers }) as unknown as Product;

test("the sitemap's first tier: 3+ stores in a region, or 2+ in two regions", () => {
  const two = prod({ US: [o("a"), o("b")] });
  assert.equal(isIndexable(two), true);
  assert.equal(inSitemap(two), false, "two stores in one region: indexable, not in the sitemap");
  assert.equal(inSitemap(prod({ US: [o("a"), o("b"), o("c")] })), true);
  assert.equal(inSitemap(prod({ US: [o("a"), o("b")], UK: [o("c"), o("d")] })), true);
  assert.equal(inSitemap(prod({ US: [o("a", "out"), o("b", "out"), o("c", "out")] })), false, "sold out everywhere");
});

test("the build prerenders only the most widely stocked sitemap products", () => {
  const p = (slug: string, n: number) => ({ slug, offers: { US: Array.from({ length: n }, (_, i) => o(`s${i}`)) } }) as unknown as Product;
  const many = Array.from({ length: PREBUILT_PRODUCTS + 50 }, (_, i) => p(`p${i}`, 3 + (i % 7)));
  const picked = prebuiltProducts([p("thin", 2), ...many]);
  assert.equal(picked.length, PREBUILT_PRODUCTS);
  assert.ok(!picked.some((f) => f.slug === "thin"), "outside the sitemap tier: rendered on first visit");
  assert.ok(picked.every((f) => (f.offers.US?.length ?? 0) >= picked[picked.length - 1].offers.US!.length));
});
