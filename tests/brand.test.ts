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

// Real listing, 2026-11-06: a store files Purederm's under-eye patches under the vendor "Face Mask".
test("a vendor that is a category is not a brand", () => {
  assert.equal(listingBrand("Face Mask", "COSRX Advanced Snail Mask Sheet", "Shop"), "COSRX");
  assert.equal(listingBrand("Face Mask", "Face Mask Purederm Vegan Under Eye Mask Collagen 30 Sheets", "Shop"), null);
  assert.equal(listingBrand("Mediheal", "Mediheal Teatree Mask", "Shop"), "Mediheal");
});

test("a category-named brand page redirects to its category, never a 404 (2026-11-10)", async () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const cfg = require("../next.config.js");
  const { CATEGORIES } = await import("@/site");
  const cats = new Set(CATEGORIES.map((c: { key: string }) => c.key));
  const list: { source: string; destination: string; permanent: boolean }[] = await cfg.redirects();
  const face = list.find((r) => r.source === "/brands/face-mask");
  assert.equal(face?.destination, "/masks");
  for (const r of list) {
    assert.equal(r.permanent, true);
    const to = r.destination.slice(1);
    assert.ok(to === "" || cats.has(to as never), r.destination);
    assert.ok(listingBrand(r.source.replace("/brands/", "").replace(/-/g, " "), "", "Shop") === null, r.source);
  }
});
