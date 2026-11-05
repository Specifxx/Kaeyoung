// The two products the hero and the home share card show (src/lib/hero-picks.ts):
// popular, with a photo, compared by enough stores, one per brand.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { heroPicks } from "../src/lib/hero-picks";
import type { Product } from "../src/lib/types";

const prod = (slug: string, b: string, prices: number[], img: string | null = "https://img/x.jpg", st: ("in" | "out")[] = []): Product => ({
  ean: slug,
  slug,
  name: slug,
  brand: b,
  b,
  cat: "serums",
  size: "50ml",
  img,
  first: "2026-10-30",
  offers: { US: prices.map((p, i) => ({ s: `s${i}`, p, st: st[i] ?? "in", u: "https://x" })) },
});

test("the most-stocked products with a photo, 3+ stores in stock, one per brand", () => {
  const picks = heroPicks("US", [
    prod("a-top", "a", [1000, 1500, 2000, 2000, 2000]),
    prod("a-second", "a", [1000, 1500, 2000, 2000]), // same brand: skipped
    prod("no-photo", "b", [1000, 1500, 2000, 2000, 2000, 2000], null),
    prod("two-stores", "c", [1000, 2000, 2000, 2000], "https://img/y.jpg", ["in", "in", "out", "out"]),
    prod("ok", "d", [1200, 1500, 2000, 2000]),
    prod("also-ok", "e", [900, 900, 900]),
  ]);
  assert.deepEqual(picks.map((p) => p.f.slug), ["a-top", "ok"]);
  assert.equal(picks[0].lo, 1000);
  assert.equal(picks[0].loStore, "s0");
  assert.equal(picks[0].stores, 5);
  assert.equal(picks[1].stores, 4);
  assert.equal(picks[0].save, 0.5);
  assert.deepEqual(heroPicks("UK", [prod("a", "a", [1, 2, 3])]), []);
});

test("the home share card is drawn at build from the hero's picks, never per request, and survives a missing photo", () => {
  const route = fs.readFileSync("src/app/opengraph-image.tsx", "utf8");
  assert.match(route, /heroPicks\("US"/);
  assert.doesNotMatch(route, /force-dynamic|revalidate|generateStaticParams|cookies\(|headers\(/);
  assert.ok(!fs.existsSync("src/app/opengraph-image.jpg"), "the static card is gone: the route draws it");
  const card = fs.readFileSync("src/lib/og/home-image.tsx", "utf8");
  assert.match(card, /AbortSignal\.timeout/);
  assert.match(card, /return null;\s*\}\s*\}/, "a photo that cannot be read is null, never a throw");
  // The hero itself: in the server HTML, for every region, no heading added.
  const hero = fs.readFileSync("src/components/HeroPicks.tsx", "utf8");
  assert.doesNotMatch(hero, /"use client"|<h[1-6]/);
  assert.match(hero, /rp rp-\$\{r\.code\}/);
  assert.match(fs.readFileSync("src/app/page.tsx", "utf8"), /<HeroPicks/);
});
