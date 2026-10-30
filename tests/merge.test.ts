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
