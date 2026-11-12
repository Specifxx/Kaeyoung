import { test } from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { existsSync, readFileSync } from "node:fs";
import { CHRISTMAS_FESTIVE_LAYER, CHRISTMAS_FROM, CHRISTMAS_TO, isChristmas, SEASON_BOOT_SCRIPT } from "../src/lib/season";

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

test("the layout stamps the season before paint, and the holiday is one quiet line (owner, 2026-11-08)", () => {
  const layout = readFileSync("src/app/layout.tsx", "utf8");
  assert.match(layout, /__html: SEASON_BOOT_SCRIPT/);
  const css = readFileSync("src/app/globals.css", "utf8");
  assert.match(css, /\.ky-holiday \{\s*display: none;/);
  assert.match(css, /html\[data-season="christmas"\] \.ky-holiday \{\s*display: flex;/);
  const home = readFileSync("src/app/page.tsx", "utf8");
  assert.match(home, /className="ky-holiday-pill"/);
  // "The theme must match the domain": no snow, glints, snowflakes, tree, cane, stockings or hats, in CSS or markup.
  assert.doesNotMatch(css + home, /ky-snow|ky-flake|ky-deco|ky-tree|ky-stocking|HeroSnow|mo-snow|\/xmas\/|santa-hat|xmas-lights/);
  assert.ok(!existsSync("src/components/HeroSnow.tsx"));
});

test("the festive layer (owner, 2026-11-12): tasteful accents behind one switch, still no snow, stripes or motion", () => {
  assert.equal(CHRISTMAS_FESTIVE_LAYER, true);
  // One switch gates the banner markup and the data attribute the CSS keys on.
  const festive = (d: Date) => {
    const attrs: Record<string, string> = {};
    vm.runInNewContext(SEASON_BOOT_SCRIPT, { Date, location: { search: "?season=christmas" }, document: { documentElement: { setAttribute: (k: string, v: string) => (attrs[k] = v) } } });
    return attrs["data-festive"] ?? null;
  };
  assert.equal(festive(new Date()), "1");
  assert.equal(run(new Date(2026, 10, 20), "?season=off"), null);
  const home = readFileSync("src/app/page.tsx", "utf8");
  assert.match(home, /CHRISTMAS_FESTIVE_LAYER \? \(/);
  assert.match(home, /className="ky-holiday-pill ky-gift-banner"/);
  assert.match(home, /<b>Christmas gift guide<\/b>/);
  assert.doesNotMatch(home, /<h[1-6][^>]*>\s*Christmas gift guide/);
  const css = readFileSync("src/app/globals.css", "utf8");
  const layer = css.slice(css.indexOf("/* The festive layer (owner, 2026-11-12"), css.indexOf("The beta forum")).replace(/\/\*[\s\S]*?\*\//g, "");
  assert.ok(layer.length > 200 && layer.startsWith("\n:root"));
  // A 3px two-tone hairline, from the attribute alone, and the two colours as tokens on the pill, banner and strip.
  assert.match(layer, /html\[data-festive\] body::before \{[^}]*height: 3px;[^}]*linear-gradient\(90deg, rgb\(var\(--xmas-red\)\) 0 50%, rgb\(var\(--xmas-green\)\) 50% 100%\)/);
  assert.match(layer, /html\[data-festive\] \.ky-holiday-pill \{/);
  assert.match(layer, /html\[data-festive\] \[data-holiday-strip\] \{/);
  assert.match(layer, /\[data-theme="night"\] \{\s*--xmas-red/);
  // Still gone: motion, flakes, canvas, candy stripes, palette swaps.
  assert.doesNotMatch(layer, /@keyframes|animation|transition|snow|flake|canvas|candy|repeating-|url\(|--accent:|--bg:|--card:/i);
  assert.doesNotMatch(home, /canvas|snow|flake|candy/i);
});
