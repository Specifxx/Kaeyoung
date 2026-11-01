import { test } from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { readFileSync } from "node:fs";
import { CHRISTMAS_FROM, CHRISTMAS_TO, isChristmas, SEASON_BOOT_SCRIPT } from "../src/lib/season";

// The holiday look (owner, 2026-11-01): 1 November to Boxing Day by the visitor's own date, quiet and professional.

const run = (d: Date, search = "") => {
  const attrs: Record<string, string> = {};
  const RealDate = Date;
  class FixedDate extends RealDate {
    constructor() {
      super(d.getTime());
    }
  }
  vm.runInNewContext(SEASON_BOOT_SCRIPT, { Date: FixedDate, location: { search }, document: { documentElement: { setAttribute: (k: string, v: string) => (attrs[k] = v) } } });
  return attrs["data-season"] ?? null;
};

test("the holiday look runs 1 November to Boxing Day every year", () => {
  assert.equal(CHRISTMAS_FROM, 1101);
  assert.equal(CHRISTMAS_TO, 1226);
  assert.equal(isChristmas(new Date(2026, 9, 31, 23, 59)), false);
  assert.equal(isChristmas(new Date(2026, 10, 1, 0, 0)), true);
  assert.equal(isChristmas(new Date(2026, 11, 26, 23, 59)), true);
  assert.equal(isChristmas(new Date(2026, 11, 27, 0, 0)), false);
  assert.equal(isChristmas(new Date(2027, 10, 20)), true);
});

test("the boot script agrees with isChristmas(), takes ?season=, and never throws", () => {
  for (const d of [new Date(2026, 9, 31), new Date(2026, 10, 1), new Date(2026, 11, 26), new Date(2026, 11, 27)]) assert.equal(run(d) === "christmas", isChristmas(d));
  assert.equal(run(new Date(2027, 2, 3), "?season=christmas"), "christmas");
  assert.equal(run(new Date(2026, 10, 20), "?season=off"), null);
  assert.doesNotThrow(() => vm.runInNewContext(SEASON_BOOT_SCRIPT, { Date }));
});

test("the layout stamps the season before paint, and the holiday pieces are quiet decoration", () => {
  const layout = readFileSync("src/app/layout.tsx", "utf8");
  assert.match(layout, /__html: SEASON_BOOT_SCRIPT/);
  const css = readFileSync("src/app/globals.css", "utf8");
  assert.match(css, /\.ky-holiday,\s*\.ky-snow,\s*\.ky-flakes \{\s*display: none;/);
  assert.match(css, /\.ky-snow \{[^}]*pointer-events: none;/);
  assert.match(css, /prefers-reduced-motion: reduce\) \{\s*\.ky-stocking,\s*\.ky-snow::before/);
  const home = readFileSync("src/app/page.tsx", "utf8");
  assert.match(home, /<span className="ky-snow" aria-hidden="true" \/>/);
  // Professional, not gamified (owner): no Santa hats or light strands, and none of the sister sites' cartoon art; the
  // tree, cane and stockings (owner, 2026-11-01: "a little more festive") are KaeYoung's own pastel drawings.
  assert.doesNotMatch(css + home, /santa-hat|xmas-lights|xmas-tree|candy-cane\.svg|xmas-hat/);
  for (const f of ["ky-tree", "ky-cane", "ky-stocking"]) assert.match(css, new RegExp(`/xmas/${f}\\.svg`), f);
});
