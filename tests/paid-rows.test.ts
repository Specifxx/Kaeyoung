// Owner, 2026-11-12: only eBay and TCGplayer are paid rows at the top; Amazon shows only with a real price, never as a
// search-link row. Source guard.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("the pinned Amazon row needs a real price: no price, no row", () => {
  const s = readFileSync(new URL("../src/components/PriceTable.tsx", import.meta.url), "utf8");
  assert.match(s, /if \(amazonUrl && live\)/);
  assert.doesNotMatch(s, /Also check on Amazon/);
});

test("Amazon also-line: unpriced, product page only, only for a barcode-matched ASIN, never the quick view", () => {
  const c = readFileSync(new URL("../src/components/AmazonAlso.tsx", import.meta.url), "utf8");
  assert.match(c, /if \(!asin \|\| amazonLive\(f\.ean, region\)\) return null;/);
  const t = readFileSync(new URL("../src/components/PriceTable.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(t, /also_amazon/);
  const q = readFileSync(new URL("../src/components/QuickView.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(q, /AmazonAlso/);
});
