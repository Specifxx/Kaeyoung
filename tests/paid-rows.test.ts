// Owner, 2026-11-12: only eBay and TCGplayer are paid rows at the top; Amazon shows only with a real price, never as a
// search-link row. Source guard.
import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

test("the pinned Amazon row needs a real price: no price, no row", () => {
  const s = readFileSync(new URL("../src/components/PriceTable.tsx", import.meta.url), "utf8");
  assert.match(s, /if \(amazonUrl && live\)/);
  assert.doesNotMatch(s, /Also check on Amazon/);
});

test("Check on Amazon (owner, 2026-11-17): an unpriced ORDINARY LAST row, page and quick view, never pinned", () => {
  const t = readFileSync(new URL("../src/components/PriceTable.tsx", import.meta.url), "utf8");
  assert.match(t, /if \(!live && amazonUrl\) \{/);
  assert.match(t, /stores\.push\(\{\s+name: "Amazon"/);
  assert.match(t, /placement: "check_amazon"/);
  assert.ok(!existsSync(new URL("../src/components/AmazonAlso.tsx", import.meta.url)), "the below-table line is replaced by the row");
});
