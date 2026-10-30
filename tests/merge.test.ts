import { test } from "node:test";
import assert from "node:assert/strict";
import { dropMirrors, mergeListings, saneOffers, type MergeState } from "@/lib/merge";
import type { Listing } from "@/lib/types";
import { ean } from "./helpers";

const SNAIL = ean("880941647000");
const L = (store: string, region: Listing["region"], cents: number, extra: Partial<Listing> = {}): Listing => ({
  store,
  region,
  title: "COSRX Advanced Snail 96 Mucin Power Essence 100ml",
  vendor: "COSRX",
  kind: "Essence",
  ean: SNAIL,
  cents,
  st: "in",
  url: `https://${store}.example/p`,
  img: null,
  ...extra,
});
const fresh = (): MergeState => ({ slugs: {}, first: {} });

test("one product per barcode, kept when 2+ stores in one region sell it", () => {
  const out = mergeListings([L("a", "US", 2199), L("b", "US", 2499), L("c", "AU", 3295)], fresh(), "2026-10-30");
  assert.equal(out.length, 1);
  assert.equal(out[0].offers.US!.length, 2);
  assert.equal(out[0].offers.AU!.length, 1, "a single offer elsewhere is still shown");
  assert.equal(out[0].brand, "COSRX");
  assert.equal(out[0].cat, "serums");
  assert.equal(out[0].size, "100ml");
  assert.equal(out[0].name, "COSRX Advanced Snail 96 Mucin Power Essence 100ml");
  assert.equal(out[0].slug, "cosrx-advanced-snail-96-mucin-power-essence-100ml");
});

test("one store in each region is not a comparison", () => {
  assert.equal(mergeListings([L("a", "US", 2199), L("c", "AU", 3295)], fresh(), "2026-10-30").length, 0);
});

test("a store listing a barcode twice counts once, its orderable cheapest copy", () => {
  const out = mergeListings([L("a", "US", 1999, { st: "out" }), L("a", "US", 2599), L("b", "US", 2499)], fresh(), "2026-10-30");
  assert.deepEqual(out[0].offers.US!.map((o) => [o.s, o.p]), [["b", 2499], ["a", 2599]]);
});

test("orderable first, then cheapest", () => {
  const out = mergeListings([L("a", "US", 1999, { st: "out" }), L("b", "US", 2499), L("c", "US", 2299)], fresh(), "2026-10-30");
  assert.deepEqual(out[0].offers.US!.map((o) => o.s), ["c", "b", "a"]);
});

test("refused titles never count toward the two stores", () => {
  const out = mergeListings([L("a", "US", 2199), L("b", "US", 900, { title: "[TESTER] COSRX Snail Essence" })], fresh(), "2026-10-30");
  assert.equal(out.length, 0);
});

test("a price far from the others is dropped (a single sheet under the box's barcode)", () => {
  const kept = saneOffers([2000, 2100, 2200, 300].map((p, i) => ({ s: `s${i}`, p, st: "in" as const, u: "" })));
  assert.deepEqual(kept.map((o) => o.p), [2000, 2100, 2200]);
});

test("slugs are kept forever", () => {
  const state = fresh();
  mergeListings([L("a", "US", 2199), L("b", "US", 2499)], state, "2026-10-30");
  const again = mergeListings([L("a", "US", 2199, { title: "COSRX Snail Mucin Essence 100ml" }), L("b", "US", 2499, { title: "COSRX Snail Mucin Essence 100ml" })], state, "2026-11-01");
  assert.equal(again[0].slug, "cosrx-advanced-snail-96-mucin-power-essence-100ml");
  assert.equal(again[0].first, "2026-10-30");
});

test("mirrors (one stock under two names) count once", () => {
  const many = (store: string) => Array.from({ length: 6 }, (_, i) => L(store, "AU", 2000 + i, { ean: ean(`88094164700${i}`) }));
  const { mirrors, listings } = dropMirrors([...many("a"), ...many("b"), L("c", "AU", 2000)], ["a", "b", "c"]);
  assert.deepEqual(mirrors, { b: "a" });
  assert.ok(!listings.some((l) => l.store === "b"));
});

test("two prices more than 3x apart in a region: neither is shown there", () => {
  const two = (a: number, b: number) => saneOffers([a, b].map((p, i) => ({ s: `s${i}`, p, st: "in" as const, u: "" })));
  assert.equal(two(399, 3299).length, 0, "Abib: one sheet at 3.99 against the box of ten at 32.99");
  assert.equal(two(1999, 2999).length, 2);
});

test("listings naming a different pack under one barcode: the size most stores name wins", () => {
  const out = mergeListings(
    [L("a", "US", 2199), L("b", "US", 2299), L("c", "US", 1200, { title: "COSRX Advanced Snail 96 Mucin Power Essence 50ml" })],
    fresh(),
    "2026-10-30",
  );
  assert.deepEqual(out[0].offers.US!.map((o) => o.s), ["a", "b"]);
});

test("one store says one sheet, the other a box of ten: the barcode is left out", () => {
  const mask = (store: string, cents: number, title: string) => L(store, "CA", cents, { title, kind: "Mask" });
  const out = mergeListings([mask("a", 399, "Abib Mild Acidic pH Sheet Mask Aqua Fit (1 pcs)"), mask("b", 1299, "Abib Mild Acidic pH Sheet Mask Aqua Fit (10 Sheets)")], fresh(), "2026-10-30");
  assert.equal(out.length, 0);
});

test("one brand spelling across the catalogue", () => {
  const nine = ean("880000000001");
  const out = mergeListings(
    [
      L("a", "US", 2199, { vendor: "9WISHES" }),
      L("b", "US", 2299, { vendor: "9WISHES" }),
      L("a", "US", 1500, { vendor: "9wishes", ean: nine, title: "9wishes Hydra Skin Ampule Serum 25ml" }),
      L("b", "US", 1600, { vendor: "9wishes", ean: nine, title: "9wishes Hydra Skin Ampule Serum 25ml" }),
      L("c", "US", 1600, { vendor: "9WISHES", ean: nine, title: "9wishes Hydra Skin Ampule Serum 25ml" }),
    ],
    fresh(),
    "2026-10-30",
  );
  assert.deepEqual([...new Set(out.map((p) => p.brand))], ["9WISHES"]);
});
