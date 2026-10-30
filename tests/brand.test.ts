import { test } from "node:test";
import assert from "node:assert/strict";
import { brandFromTitle, brandName, canonicalKey, listingBrand } from "@/lib/brand";

test("one brand, however a store spells it", () => {
  assert.equal(canonicalKey("COSRX"), canonicalKey("Cosrx"));
  assert.equal(canonicalKey("Dr. Jart+"), canonicalKey("Dr.Jart+"));
  assert.equal(canonicalKey("Manyo Factory"), canonicalKey("ma:nyo"));
  assert.equal(canonicalKey("Dear, Klairs"), canonicalKey("Klairs"));
  assert.equal(brandName(canonicalKey("cosrx"), ["cosrx", "Cosrx"]), "COSRX");
  assert.equal(brandName("newbrand", ["NewBrand", "NewBrand", "NEWBRAND"]), "NewBrand");
});

test("a vendor that is the store itself falls back to the title", () => {
  assert.equal(listingBrand("Nudie Glow", "COSRX Advanced Snail 96 Mucin Power Essence", "Nudie Glow"), "COSRX");
  assert.equal(listingBrand("", "Beauty of Joseon Relief Sun", "Shop"), "Beauty of Joseon");
  assert.equal(listingBrand("Anua", "Heartleaf 77% Toner", "Shop"), "Anua");
  assert.equal(brandFromTitle("[NEW] SKIN1004 Madagascar Centella Ampoule"), "SKIN1004");
  assert.equal(brandFromTitle("Some Unknown Toner"), null);
});
