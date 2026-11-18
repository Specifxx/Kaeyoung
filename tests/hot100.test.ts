import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { hotChart, hotMove, hotName } from "../src/lib/hot100";
import type { History, Product } from "../src/lib/types";

// The weekly Hot 100 (owner, 2026-11-18): real risers only, two or more stores today, last week's place from the same history.
const D = 20_400;
const p = (slug: string, stores = 2) => ({ slug, ean: slug, name: slug, size: null, offers: { US: Array.from({ length: stores }, () => ({ st: "in", p: 1000 })) } }) as unknown as Product;

test("ranks real risers only, biggest first, and keeps the honest count", () => {
  const history = {
    flat: { US: [[D - 30, 1000]] },
    up10: { US: [[D - 30, 1000], [D - 1, 1100]] },
    up30: { US: [[D - 30, 1000], [D, 1300]] },
    oneStore: { US: [[D - 30, 1000], [D, 1300]] },
    soldOut: { US: [[D - 30, 1000], [D, 2000]] },
    down: { US: [[D - 30, 1000], [D, 900]] },
  } as unknown as History;
  const c = hotChart([p("flat"), p("up10"), p("up30"), p("oneStore", 1), p("soldOut"), p("down")], history, "US")!;
  assert.deepEqual(c.rows.map((r) => r.f.slug), ["up30", "up10"]);
  assert.equal(c.rows[0].pct, 30);
  assert.equal(hotName(c.rows.length), "Hot 2");
});

test("last week's place is worked out the same way seven days earlier", () => {
  const history = {
    a: { US: [[D - 20, 1000], [D - 8, 1300], [D, 1400]] },
    b: { US: [[D - 20, 1000], [D - 9, 1100], [D, 1600]] },
    c: { US: [[D - 20, 1000], [D - 1, 1050]] },
  } as unknown as History;
  const c = hotChart([p("a"), p("b"), p("c")], history, "US")!;
  assert.deepEqual(c.rows.map((r) => [r.f.slug, r.lastRank]), [["b", 2], ["a", 1], ["c", null]]);
  assert.equal(hotMove(c.rows[0], c.lastWeekSize), "▲1");
  assert.equal(hotMove(c.rows[2], c.lastWeekSize), "New");
});

test("the page is static and reads the committed files only", () => {
  const src = fs.readFileSync("src/app/hot-100/page.tsx", "utf8");
  assert.match(src, /hotChart\(products, history, r\.code\)/);
  assert.doesNotMatch(src, /fetch\(|searchParams|revalidate/);
});
