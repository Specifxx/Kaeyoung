// The side rails and the phone dock (DECISIONS.md, 2026-11-06 "Side rails and the phone dock").
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { DOCK_ARM, dockShows, type DockState } from "../src/components/AdDock";
import { dockHref, MIN_WIDTH } from "../src/components/SideRails";
import { MAX_TILES, railsFor } from "../src/lib/side-rails";
import { REGIONS } from "../src/site";

const read = (p: string) => fs.readFileSync(p, "utf8");

test("rails: eBay tiles are live listings, tagged side-ebay; Amazon tiles are tagged links with no price", () => {
  for (const r of REGIONS) {
    const rails = railsFor(r.code);
    assert.ok(rails.ebay.tiles.length <= MAX_TILES);
    for (const t of rails.ebay.tiles) {
      assert.ok(t.img && (t.price || /\/sch\/i\.html\?_nkw=/.test(t.href)), `${r.code}: an eBay tile is a live listing with its delivered price, or an exact-name search`);
      assert.match(t.href, /campid=5339155912/);
      assert.match(t.href, new RegExp(`customid=ky-${r.code.toLowerCase()}-side-ebay-`));
    }
    if (!r.amazonHost) assert.equal(rails.amazon, null, `${r.code}: no Amazon programme, no Amazon rail`);
    for (const t of rails.amazon?.tiles ?? []) {
      assert.equal(t.price, null, "never an Amazon price in a rail (no API price, and none may be stored)");
      assert.match(t.href, /[?&]tag=[a-z0-9-]+-2[0-9]&ascsubtag=ky-[a-z]+-side-amazon-/);
      assert.match(t.href, /\/dp\/[A-Z0-9]{10}\?|\/s\?k=/, "a specific product: its ASIN or its exact name");
    }
  }
});

test("rails: browser only, a static file per region, the columns reserved by CSS", () => {
  const route = read("src/app/rails/[region]/route.ts");
  assert.match(route, /export const dynamic = "force-static"/);
  assert.match(route, /export const dynamicParams = false/);
  const c = read("src/components/SideRails.tsx");
  assert.match(c, /^"use client";/);
  assert.match(c, /fetch\(`\/rails\/\$\{key\}`\)/);
  assert.match(c, />Ad</, "labelled Ad");
  assert.equal(MIN_WIDTH, 1440);
  assert.match(read("src/app/globals.css"), /@media \(min-width: 1440px\) \{\s*\.side-rail-slot/);
  assert.match(read("src/app/layout.tsx"), /<RailSlot side="left" \/>[\s\S]*<main[\s\S]*<RailSlot side="right" \/>/);
});

test("the phone dock: narrow screens only, never on the first screen, beside another unit, the buy bar or a dialog; never Amazon", () => {
  const ok: DockState = { narrow: true, scrolled: 1000, screen: 800, blockers: 0, buybar: false, modal: false, typing: false, dismissed: false };
  assert.ok(dockShows(ok));
  assert.ok(!dockShows({ ...ok, narrow: false }));
  assert.ok(!dockShows({ ...ok, scrolled: 800 * DOCK_ARM - 1 }));
  assert.ok(!dockShows({ ...ok, blockers: 1 }));
  assert.ok(!dockShows({ ...ok, buybar: true }));
  assert.ok(!dockShows({ ...ok, modal: true }));
  assert.ok(!dockShows({ ...ok, typing: true }));
  assert.ok(!dockShows({ ...ok, dismissed: true }));
  assert.equal(dockHref("https://www.ebay.com/itm/1?customid=ky-us-side-ebay-880123&x=1"), "https://www.ebay.com/itm/1?customid=ky-us-dock-ebay-880123&x=1");
  const d = read("src/components/AdDock.tsx");
  assert.match(d, /return armed \? <>\{children\}<\/> : null;/);
  assert.match(d, /translate-y-full/);
  assert.doesNotMatch(d.replace(/^\/\/.*$/gm, ""), /amazon/i);
  const dock = read("src/components/SideRails.tsx").split("export function RailDock")[1];
  assert.doesNotMatch(dock, /amazon/i, "no Amazon link in an overlay (Associates rule)");
  assert.match(read("src/app/product/[slug]/page.tsx"), /<div data-buybar /, "never on a product page");
});
