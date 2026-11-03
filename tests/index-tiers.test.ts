import { test } from "node:test";
import assert from "node:assert/strict";
import { inSitemap, isIndexable } from "@/lib/index-tiers";
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
