// Every rule in src/lib/title.ts has a store-style title here.
import { test } from "node:test";
import assert from "node:assert/strict";
import { amountOf, categoryOf, cleanName, listingAmounts, pickName, readTitle, sizeOf, sizesConflict, tidyName } from "@/lib/title";

const refused = (t: string) => {
  const r = readTitle(t);
  return "refused" in r ? r.refused : null;
};

test("single products pass", () => {
  for (const t of [
    "COSRX Advanced Snail 96 Mucin Power Essence 100ml",
    "Beauty of Joseon Relief Sun : Rice + Probiotics SPF50+ PA++++ 50ml",
    "Anua Heartleaf 77% Soothing Toner 250ml",
    "Mediheal Teatree Care Solution Essential Mask EX (10 sheets)",
    "Beauty of Joseon Glow Serum : Propolis + Niacinamide 30ml",
  ])
    assert.equal(refused(t), null, t);
});

test("testers, samples, short-dated and damaged stock are refused", () => {
  assert.equal(refused("[TESTER] COSRX Advanced Snail 92 All In One Cream 100g"), "tester");
  assert.equal(refused("Torriden DIVE-IN Serum Sample 2ml x 10"), "tester");
  assert.equal(refused("Round Lab Birch Juice Sunscreen (Short Expiry 03/2026)"), "short-dated");
  assert.equal(refused("SKIN1004 Centella Ampoule 55ml - EXP: 2026.02"), "short-dated");
  assert.equal(refused("Isntree Hyaluronic Acid Toner 200ml (Box Damaged)"), "damaged");
});

test("store-made bundles are refused; a single box of masks is not", () => {
  assert.equal(refused("Anua Heartleaf Cleansing Oil + Quercetinol Foam Duo Set"), "bundle");
  assert.equal(refused("COSRX Snail Essence + Snail Cream Bundle"), "bundle");
  assert.equal(refused("Beauty of Joseon Relief Sun 50ml x2"), "bundle");
  assert.equal(refused("Buy 2 Get 1 Free Mediheal Masks"), "bundle");
  assert.equal(refused("K-Beauty Mystery Box"), "mystery");
  assert.equal(refused("Gift Card"), "not-beauty");
  assert.equal(refused("Abib Mild Acidic pH Sheet Mask Heartleaf Fit 1 Box (10ea)"), null);
});

test("categories: the specific rule wins", () => {
  const c = (t: string) => categoryOf(t);
  assert.equal(c("Beauty of Joseon Relief Sun : Rice + Probiotics SPF50+"), "sunscreen");
  assert.equal(c("Round Lab 1025 Dokdo Cleanser 150ml"), "cleansers");
  assert.equal(c("heimish All Clean Balm 120ml"), "cleansers");
  assert.equal(c("Anua Heartleaf 77% Soothing Toner"), "toners");
  assert.equal(c("COSRX One Step Original Clear Pad 70 pads"), "toners");
  assert.equal(c("COSRX Advanced Snail 96 Mucin Power Essence"), "serums");
  assert.equal(c("Torriden DIVE-IN Low Molecular Hyaluronic Acid Soothing Cream"), "moisturisers");
  assert.equal(c("LANEIGE Water Sleeping Mask 70ml"), "masks");
  assert.equal(c("LANEIGE Lip Sleeping Mask Berry 20g"), "lip-care");
  assert.equal(c("Beauty of Joseon Revive Eye Serum Ginseng + Retinal"), "eye-care");
  assert.equal(c("TIRTIR Mask Fit Red Cushion 18g"), "makeup");
  assert.equal(c("Isntree Hyaluronic Acid Watery Sun Gel"), "sunscreen");
  assert.equal(c("Illiyoon Ceramide Ato Concentrate Cream Body Lotion"), "body-hair");
  assert.equal(c("Daeng Gi Meo Ri Ki Gold Energizing Shampoo"), "body-hair");
  assert.equal(c("Some By Mi AHA BHA PHA 30 Days Miracle Toner"), "toners");
  assert.equal(c("Nacific Origin Red Salicylic Acid Pimple Patch"), "other");
});

test("pack sizes", () => {
  assert.equal(sizeOf("COSRX Advanced Snail 96 Mucin Power Essence 100ml"), "100ml");
  assert.equal(sizeOf("Mediheal Teatree Mask (10 sheets)"), "10 sheets");
  assert.equal(sizeOf("COSRX Clear Pad 70 Pads"), "70 pads");
  assert.equal(sizeOf("TIRTIR Mask Fit Red Cushion 18G"), "18g");
  assert.equal(sizeOf("Anua Toner"), null);
});

test("names: store noise out, brand first, once", () => {
  assert.equal(cleanName("[NEW] COSRX Advanced Snail 96 Mucin Power Essence 100ml (Renewal)"), "COSRX Advanced Snail 96 Mucin Power Essence 100ml");
  assert.equal(tidyName("COSRX - Advanced Snail 96 Mucin Power Essence 100ml", "COSRX"), "COSRX Advanced Snail 96 Mucin Power Essence 100ml");
  assert.equal(tidyName("Advanced Snail 96 Mucin Power Essence 100ml by COSRX", "COSRX"), "COSRX Advanced Snail 96 Mucin Power Essence 100ml");
  assert.equal(tidyName("BEAUTY OF JOSEON RELIEF SUN RICE PROBIOTICS 50ML", "Beauty of Joseon"), "Beauty of Joseon Relief Sun Rice Probiotics 50ml");
  assert.equal(pickName(["COSRX Snail Essence", "COSRX Advanced Snail 96 Mucin Power Essence", "COSRX Advanced Snail 96 Mucin Power Essence"]), "COSRX Advanced Snail 96 Mucin Power Essence");
});

test("the variant's own trailing size wins over the product title's first", () => {
  assert.equal(sizeOf("Round Lab Dokdo Toner 200ml / 500ml (500ml)"), "500ml");
  assert.equal(sizeOf("A'PIEU Juicy Pang Perfume Hand Cream 30ml (Basil)"), "30ml");
});

test("listing sizes: one per dimension, none when the title names two packs", () => {
  assert.deepEqual(listingAmounts("107 Beauty Micro Drizzle Hydro Toner (5.24oz / 155ml)").map((a) => [a.dim, Math.round(a.n)]), [["amount", 155]]);
  assert.deepEqual(listingAmounts("Anua Heartleaf 77% Soothing Sheet Mask 25ml (10 Sheets)").map((a) => [a.dim, a.n]), [["amount", 25], ["count", 10]]);
  assert.deepEqual(listingAmounts("Round Lab Dokdo Toner 200ml / 500ml"), []);
  assert.deepEqual(listingAmounts("Round Lab Dokdo Toner 200ml / 500ml (500ml)").map((a) => a.n), [500]);
  assert.equal(sizesConflict(amountOf("50ml"), amountOf("100ml")), true);
  assert.equal(sizesConflict(amountOf("1.69 fl oz"), amountOf("50ml")), false);
  assert.equal(sizesConflict(amountOf("1 pcs"), amountOf("10 sheets")), true);
  assert.equal(sizesConflict(amountOf("50ml"), amountOf("10 sheets")), false, "different dimensions are not compared");
});

test("store flags and shade counts are not part of a product's name", () => {
  assert.equal(cleanName("AGE20'S NEW* Signature Essence Cover Pact (11 Colors) (13C Porcelain) 14g"), "AGE20'S Signature Essence Cover Pact (13C Porcelain) 14g");
  assert.equal(cleanName("Kaja CLEARANCE* Juicy Glass Lip Oil - 04 Grape Glowtini 4ml"), "Kaja Juicy Glass Lip Oil - 04 Grape Glowtini 4ml");
  assert.equal(cleanName("TIRTIR mini* Mask Fit Red Cushion (40 colors) (51N Fudge) 4.5g"), "TIRTIR Mini Mask Fit Red Cushion (51N Fudge) 4.5g");
  assert.equal(cleanName("3CE Blur Water Tint 0.16 oz 5 Colors (Laydown)"), "3CE Blur Water Tint 0.16 oz (Laydown)");
  assert.equal(cleanName("beplain Chamomile PH-Balanced Toner (190ml) 1 pcs"), "beplain Chamomile PH-Balanced Toner (190ml)");
  assert.equal(cleanName("Haruharu Wonder Black Rice Hyaluronic Toner Fragrance Free 30 ml."), "Haruharu Wonder Black Rice Hyaluronic Toner Fragrance Free 30 ml");
  assert.equal(cleanName("Mediheal Teatree Mask (10 sheets)"), "Mediheal Teatree Mask (10 sheets)", "a real pack count stays");
});

test("promotions written into a title are not part of the name", () => {
  assert.equal(cleanName("Tocobo $1 Deal *renew* Bio Watery Sun Cream SPF50 40ml"), "Tocobo Bio Watery Sun Cream SPF50 40ml");
});
