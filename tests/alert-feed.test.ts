// The alert feed and the account layer (owner, 2026-11-19: accounts, Premium and alerts on every site; DECISIONS.md).
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { buildAlertFeed, lowestInStock } from "../src/lib/alert-feed";
import type { Product } from "../src/lib/types";

const prod = (over: Partial<Product>): Product =>
  ({ ean: "3348901250153", slug: "sauvage-100ml", name: "Sauvage EDT", brand: "Dior", b: "dior", cat: "men", size: "100ml", img: null, first: "2026-11-01", offers: {}, ...over }) as Product;

test("the feed's price is the lowest IN-STOCK store price per region, in that region's cents; sold out keeps the item with no price", () => {
  assert.equal(lowestInStock([{ s: "a", p: 9000, st: "in", u: "" }, { s: "b", p: 8000, st: "out", u: "" }, { s: "c", p: 8500, st: "in", u: "" }]), 8500);
  const f = buildAlertFeed(new Date("2026-11-19T00:00:00Z"), [
    prod({ offers: { US: [{ s: "a", p: 9900, st: "in", u: "" }, { s: "b", p: 9500, st: "in", u: "" }], UK: [{ s: "c", p: 7000, st: "out", u: "" }] } }),
    prod({ ean: "1", slug: "none", offers: {} }),
  ]);
  assert.equal(f.v, 1);
  assert.equal(f.site, "kaeyoung");
  assert.deepEqual(Object.keys(f.items), ["3348901250153"]);
  assert.deepEqual(f.items["3348901250153"], { n: "Dior Sauvage EDT 100ml", u: "/product/sauvage-100ml", p: { US: 9500 } });
  assert.equal(f.deals.length, 0, "a 4% gap is not a deal");
});

test("the feed route is a static file, and the page never names RiftCompare or links the other side", () => {
  assert.match(fs.readFileSync("src/app/alert-feed.json/route.ts", "utf8"), /export const dynamic = "force-static"/);
  for (const f of ["src/components/premium/WatchPrice.tsx", "src/components/premium/SignIn.tsx", "src/components/premium/PremiumPanel.tsx", "src/components/premium/WatchesView.tsx", "src/app/premium/page.tsx", "src/app/privacy/page.tsx"]) {
    const s = fs.readFileSync(f, "utf8").replace(/^\s*\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "");
    assert.doesNotMatch(s, /RiftCompare|DexCompare|MTG Compare|TCG Prices|card sites/, f);
  }
});

test("members see no banner ads: the boot script, the sync and the CSS are all in place; price tables are untouched", () => {
  const layout = fs.readFileSync("src/app/layout.tsx", "utf8");
  assert.match(layout, /ADFREE_BOOT_SCRIPT/);
  assert.match(layout, /<AdFreeSync \/>/);
  const css = fs.readFileSync("src/app/globals.css", "utf8");
  assert.match(css, /html\[data-adfree\] \[data-ad="inline"\]/);
  assert.doesNotMatch(css, /html\[data-adfree\][^{]*(PriceTable|price-table|\.pr-)/);
});
