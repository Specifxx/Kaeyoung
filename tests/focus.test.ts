// The low-traction cull (lib/focus.ts, owner 2026-11-07): which products are listed, and where a culled URL goes.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { demandSlugs, focusCatalog, widelyStocked } from "../src/lib/focus";
import type { Offer, Product } from "../src/lib/types";

const o = (s: string, st: Offer["st"] = "in"): Offer => ({ s, p: 1000, st, u: "https://x" });
const P = (slug: string, offers: Product["offers"]) => ({ ean: slug, slug, name: slug, brand: "B", b: "b", cat: "serums", size: null, img: null, first: "2026-11-01", offers }) as unknown as Product;

test("widely stocked: three stores selling today in one region, or two in two regions", () => {
  assert.equal(widelyStocked({ offers: { US: [o("a"), o("b"), o("c")] } }), true);
  assert.equal(widelyStocked({ offers: { US: [o("a"), o("b")], UK: [o("c"), o("d")] } }), true);
  assert.equal(widelyStocked({ offers: { US: [o("a"), o("b")], UK: [o("c")] } }), false);
  assert.equal(widelyStocked({ offers: { US: [o("a"), o("b"), o("c", "out")] } }), false, "a sold-out store does not count");
});

test("search demand keeps a page; the rest is culled to its category", () => {
  const { listed, culled } = focusCatalog([P("wide", { US: [o("a"), o("b"), o("c")] }), P("thin", { US: [o("a"), o("b")] }), P("searched", { US: [o("a")] })], new Set(["searched"]));
  assert.deepEqual(listed.map((p) => p.slug), ["wide", "searched"]);
  assert.deepEqual(culled, { thin: "serums" });
  assert.deepEqual([...demandSlugs({ "/product/a": [1, 1, 3], "/product/b": [0, 10, 5], "/product/c": [0, 9, 5], "/serums": [9, 99, 1] })].sort(), ["a", "b"]);
});

test("the import applies it, the half-size guard reads the merged count, and a culled page 301s", () => {
  const imp = fs.readFileSync("scripts/import.ts", "utf8");
  assert.match(imp, /focusCatalog\(merged, readDemand\(\)\)/);
  assert.match(imp, /prevMeta\?\.merged \?\? prevProducts\.length/);
  assert.match(imp, /\}\), merged, today\);/);
  assert.match(fs.readFileSync("src/app/product/[slug]/page.tsx", "utf8"), /culledTarget\(params\.slug\)/);
});
