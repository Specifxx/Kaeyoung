// The in-content ad block (DECISIONS.md, 2026-11-13, in place of the side rails) and the phone dock (2026-11-06).
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { DOCK_ARM, dockShows, type DockState } from "../src/components/AdDock";
import { dockHref, DOCK_MIN_WIDTH } from "../src/components/InlineAds";
import { MAX_TILES, railsFor } from "../src/lib/side-rails";
import { REGIONS } from "../src/site";

const read = (p: string) => fs.readFileSync(p, "utf8");

test("block: eBay tiles are live listings, tagged inline-ebay; Amazon tiles are tagged links with no price", () => {
  for (const r of REGIONS) {
    const rails = railsFor(r.code);
    assert.ok(rails.ebay.tiles.length <= MAX_TILES);
    for (const t of rails.ebay.tiles) {
      assert.ok(t.img && (t.price || /\/sch\/i\.html\?_nkw=/.test(t.href)), `${r.code}: an eBay tile is a live listing with its delivered price, or an exact-name search`);
      assert.match(t.href, /campid=5339155912/);
      assert.match(t.href, new RegExp(`customid=ky-${r.code.toLowerCase()}-inline-ebay-`));
    }
    if (!r.amazonHost) assert.equal(rails.amazon, null, `${r.code}: no Amazon programme, no Amazon rail`);
    for (const t of rails.amazon?.tiles ?? []) {
      assert.equal(t.price, null, "never an Amazon price in the block (no API price, and none may be stored)");
      assert.match(t.href, /[?&]tag=[a-z0-9-]+-2[0-9]&ascsubtag=ky-[a-z]+-inline-amazon-/);
      assert.match(t.href, /\/dp\/[A-Z0-9]{10}\?|\/s\?k=/, "a specific product: its ASIN or its exact name");
    }
  }
});

test("block: browser only, one per page, native tokens, no rail left behind", () => {
  const route = read("src/app/rails/[region]/route.ts");
  assert.match(route, /export const dynamic = "force-static"/);
  assert.match(route, /export const dynamicParams = false/);
  const c = read("src/components/InlineAds.tsx");
  assert.match(c, /^"use client";/);
  assert.match(c, /fetch\(`\/rails\/\$\{key\}`\)/);
  assert.match(c, />Ad</, "labelled Ad");
  assert.match(c, /paid/, "links are rel sponsored through OutLink paid");
  assert.ok(c.indexOf('brand: "ebay"') < c.indexOf('brand: "amazon"'), "eBay first, Amazon second");
  const code = c.replace(/^\s*\/\/.*$/gm, "");
  assert.doesNotMatch(code, /className="[^"]*\b(fixed|sticky)\b/, "nothing floats");
  assert.doesNotMatch(code, /cookies\(|headers\(|localStorage/);
  assert.doesNotMatch(read("src/app/layout.tsx"), /RailSlot|side-rail/);
  assert.doesNotMatch(read("src/app/globals.css"), /\.side-rail|\.rail-scroll/);
  assert.match(read("src/app/globals.css"), /\.inline-ad-empty \{\s*min-height/, "height reserved: CLS 0");
  assert.equal(fs.existsSync("src/components/SideRails.tsx"), false);
  // exactly one block per page, placed after the main content
  const pages: Record<string, string> = {
    "src/app/page.tsx": "home",
    "src/app/product/[slug]/page.tsx": "product",
    "src/components/CatHub.tsx": "list",
    "src/app/popular/page.tsx": "popular",
    "src/app/deals/page.tsx": "deals",
    "src/app/new/page.tsx": "new",
    "src/app/brands/[slug]/page.tsx": "brand",
  };
  for (const [file, page] of Object.entries(pages)) {
    const src = read(file);
    assert.equal((src.match(/<InlineAds /g) ?? []).length, 1, `${file}: one block`);
    assert.match(src, new RegExp(`<InlineAds page="${page}"`));
  }
  const product = read("src/app/product/[slug]/page.tsx");
  assert.ok(product.indexOf("<PriceTable") < product.indexOf("<InlineAds"), "below the price table");
  const home = read("src/app/page.tsx");
  assert.ok(home.indexOf("<HeroPicks") < home.indexOf("<InlineAds"), "not in the hero");
});

test("the phone dock: phones only, never on the first screen, beside another unit, the buy bar or a dialog; never Amazon", () => {
  const ok: DockState = { narrow: true, scrolled: 1000, screen: 800, blockers: 0, buybar: false, modal: false, typing: false, dismissed: false };
  assert.ok(dockShows(ok));
  assert.ok(!dockShows({ ...ok, narrow: false }));
  assert.ok(!dockShows({ ...ok, scrolled: 800 * DOCK_ARM - 1 }));
  assert.ok(!dockShows({ ...ok, blockers: 1 }));
  assert.ok(!dockShows({ ...ok, buybar: true }));
  assert.ok(!dockShows({ ...ok, modal: true }));
  assert.ok(!dockShows({ ...ok, typing: true }));
  assert.ok(!dockShows({ ...ok, dismissed: true }));
  assert.equal(dockHref("https://www.ebay.com/itm/1?customid=ky-us-inline-ebay-880123&x=1"), "https://www.ebay.com/itm/1?customid=ky-us-dock-ebay-880123&x=1");
  assert.equal(DOCK_MIN_WIDTH, 768);
  const d = read("src/components/AdDock.tsx");
  assert.match(d, /return armed \? <>\{children\}<\/> : null;/);
  assert.match(d, /translate-y-full/);
  assert.doesNotMatch(d.replace(/^\/\/.*$/gm, ""), /amazon/i);
  const dock = read("src/components/InlineAds.tsx").split("export function RailDock")[1];
  assert.doesNotMatch(dock, /amazon/i, "no Amazon link in an overlay (Associates rule)");
  assert.match(read("src/app/product/[slug]/page.tsx"), /<div data-buybar /, "never on a product page");
});
