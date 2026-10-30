// The guides' share cards (src/lib/og): drawn at build, never per request, and
// only from rows a reader can trust.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { shareRows } from "../src/lib/og/share-rows";
import type { Product } from "../src/lib/types";

const prod = (slug: string, b: string, prices: number[], st: ("in" | "out")[] = []): Product => ({
  ean: "8800000000000",
  slug,
  name: slug,
  brand: b,
  b,
  cat: "serums",
  size: "50ml",
  img: null,
  first: "2026-10-30",
  offers: { US: prices.map((p, i) => ({ s: `s${i}`, p, st: st[i] ?? "in", u: "https://x" })) },
});

test("rows need enough in-stock stores and a believable gap, one per brand", () => {
  const rows = shareRows("US", [
    prod("a1", "a", [1000, 1500, 2000, 2000]),
    prod("a2", "a", [1000, 1500, 2000]), // same brand, fewer stores: left out
    prod("small-gap", "b", [1900, 2000, 2000]),
    prod("too-big", "c", [500, 2000, 2000]), // 75% off: likely a mistake or a flash sale
    prod("out", "d", [1000, 2000, 2000], ["in", "in", "out"]), // only two in stock
    prod("ok", "e", [1500, 2000, 2000]),
  ]);
  assert.deepEqual(rows.map((r) => r.slug), ["a1", "ok"]);
  assert.equal(rows[0].lo, 1000);
  assert.equal(rows[0].hi, 2000);
  assert.equal(rows[0].save, 0.5);
});

test("the guide cards are prerendered at build, never drawn per request", () => {
  const f = fs.readFileSync("src/app/guides/[slug]/opengraph-image.tsx", "utf8");
  assert.match(f, /export const dynamicParams = false/);
  assert.match(f, /export const generateStaticParams/);
  assert.doesNotMatch(f, /force-dynamic|revalidate/);
  // Satori reads TTF/OTF/WOFF, never WOFF2, and the fonts are bundled, not fetched.
  for (const font of fs.readdirSync("src/lib/og/fonts").filter((x) => !x.endsWith(".txt"))) assert.match(font, /\.woff$/);
  assert.doesNotMatch(fs.readFileSync("src/lib/og/guide-image.tsx", "utf8"), /fetch\(/);
});
