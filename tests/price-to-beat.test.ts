import { test } from "node:test";
import assert from "node:assert/strict";
import { beatRow, beatRows, beatSummary } from "../src/lib/price-to-beat";
import type { Product } from "../src/lib/types";

const p = (slug: string, us: [string, number, "in" | "out"][]): Product =>
  ({ ean: "8800000000000", slug, name: slug, brand: "B", b: "b", cat: "serums", size: null, img: null, first: "2026-11-01",
     offers: { US: us.map(([s, price, st]) => ({ s, p: price, st, u: "" })) } }) as unknown as Product;

test("needs four in-stock stores; out-of-stock offers never count", () => {
  assert.equal(beatRow(p("a", [["x", 1000, "in"], ["y", 1200, "in"], ["z", 1400, "in"], ["w", 500, "out"]]), "US"), null);
  const r = beatRow(p("b", [["x", 1000, "in"], ["y", 1200, "in"], ["z", 1400, "in"], ["w", 2000, "in"], ["v", 100, "out"]]), "US")!;
  assert.equal(r.low, 1000);
  assert.equal(r.lowStore, "x");
  assert.equal(r.typical, 1300);
  assert.ok(Math.abs(r.gap - 300 / 1300) < 1e-9);
});

test("rows sort by stores, summary reads the median gap", () => {
  const four = p("four", [["a", 800, "in"], ["b", 1000, "in"], ["c", 1000, "in"], ["d", 1000, "in"]]);
  const five = p("five", [["a", 1000, "in"], ["b", 1000, "in"], ["c", 1000, "in"], ["d", 1000, "in"], ["e", 1000, "in"]]);
  const rows = beatRows([four, five], "US");
  assert.deepEqual(rows.map((r) => r.f.slug), ["five", "four"]);
  const s = beatSummary(rows)!;
  assert.equal(s.products, 2);
  assert.equal(s.over20, 0.5);
  assert.equal(beatSummary([]), null);
});
