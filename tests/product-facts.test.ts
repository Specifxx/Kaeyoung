// The product page's words about its own prices (2026-11-14): every number comes from the offers and the recorded
// history, a price per unit is refused rather than guessed, and the Product block carries one offer in one currency.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { factsQa, gtinProps, regionFacts, schemaRegion, sizeRows, summarySentences, unitMinor, unitOf } from "@/lib/product-facts";
import { dayNumber } from "@/lib/history";
import type { Offer, Product } from "@/lib/types";

const o = (s: string, p: number, st: "in" | "out" = "in"): Offer => ({ s, p, st, u: "/x" });
const prod = (name: string, size: string | null, offers: Product["offers"], ean = "8801234567893"): Product =>
  ({ ean, slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"), name, brand: "Acme", b: "acme", cat: "other", size, img: null, first: "2026-11-01", offers }) as unknown as Product;

test("a price per unit only for one item of a size we can read", () => {
  assert.deepEqual(unitOf(prod("Acme Toner 150ml", "150ml", {})), { n: 150, per: "per 100 ml", mult: 100 });
  assert.equal(unitOf(prod("Acme Cream 50g", "50g", {}))!.per, "per 100 g");
  assert.equal(unitOf(prod("Acme Eau de Parfum 3.4 oz", "3.4 oz", {}))!.per, "per oz");
  assert.equal(unitMinor(1299, unitOf(prod("Acme Toner 150ml", "150ml", {}))!), 866);
  // Refused: no size, a set, a multi-pack, a refill, two amounts, several bottles, a count.
  for (const [name, size] of [
    ["Acme Toner", null],
    ["Acme Toner 150ml Gift Set", "150ml"],
    ["Acme Toner 150ml 2-pack", "150ml"],
    ["Acme Toner 150ml + Refill 150ml", "150ml"],
    ["Acme Eau de Parfum 100ml + 10ml", "100ml"],
    ["Acme Toner 30ml 50ml", "30ml"],
    ["Acme Toner 150ml 2ea", "150ml"],
    ["Acme Toner 150ml x 2", "150ml"],
    ["Acme Mask 30 sheets", "30 sheets"],
  ] as const) {
    assert.equal(unitOf(prod(name, size, {})), null, name);
  }
  // Real names that must still work: an SPF's plus signs, the same size written two ways, "Refillable".
  assert.ok(unitOf(prod("Acme Sun Cream SPF50+ PA++++ 50ml", "50ml", {})));
  assert.ok(unitOf(prod("Acme Eau De Toilette Spray (Unisex Refillable) 50ml/1.7oz", "50ml", {})));
});

const f = prod("Acme Toner 150ml", "150ml", {
  US: [o("a", 1299), o("b", 1500), o("c", 1100, "out")],
  UK: [o("d", 1063)],
  NZ: [o("e", 2000, "out")],
});
const d0 = dayNumber("2026-10-30");
const history = { US: [[d0, 1400], [d0 + 5, 1299]] as [number, number][], UK: [[d0, 1063]] as [number, number][] };

test("region facts read the in-stock offers and the recorded history", () => {
  const facts = regionFacts(f, history);
  assert.deepEqual(facts.map((x) => x.region), ["US", "UK", "NZ"]);
  const us = facts[0];
  assert.equal(us.listed, 3);
  assert.equal(us.inStock, 2);
  assert.equal(us.low!.p, 1299, "a sold-out store is never the lowest");
  assert.equal(us.high!.p, 1500);
  assert.equal(us.gap, 201);
  assert.equal(us.unit, 866);
  assert.deepEqual(us.hist, { since: d0, lo: 1299, hi: 1400, change: { from: 1400, to: 1299, day: d0 + 5 } });
  assert.equal(facts[1].gapShare, null, "one store in stock: no spread");
  assert.equal(facts[1].hist!.change, null);
  assert.equal(facts[2].low, null);
  // A history that disagrees with today's offers is left out.
  assert.equal(regionFacts(f, { US: [[d0, 999]] })[0].hist, null);
});

test("the summary states only what the data holds", () => {
  const text = summarySentences(f, regionFacts(f, history), "2026-11-13T07:00:00Z", "test stores").join(" ");
  assert.match(text, /^Acme Toner 150ml is listed by 5 of the test stores we check: 3 in the US, 1 in the UK and 1 in New Zealand\./);
  assert.match(text, /At our last daily check \(13 November 2026\), the lowest in-stock price was US\$12\.99 at a in the US and £10\.63 at d in the UK\./);
  assert.match(text, /Every store that lists it in New Zealand was sold out\./);
  assert.match(text, /US\$8\.66 per 100 ml in the US and £7\.09 per 100 ml in the UK/);
  assert.match(text, /b asks US\$15\.00, so the cheapest store with it in stock is US\$2\.01 \(13%\) lower/);
  assert.match(text, /moved between US\$12\.99 and US\$14\.00; today's US\$12\.99 is the lowest we have seen/);
  assert.deepEqual(summarySentences(prod("X", null, {}), [], undefined, "stores"), []);
  // A 100 ml bottle's price per 100 ml is its price: not repeated.
  const hundred = prod("Acme Eau de Parfum 100ml", "100ml", { US: [o("a", 5000), o("b", 5100)] });
  assert.doesNotMatch(summarySentences(hundred, regionFacts(hundred, undefined), undefined, "stores").join(" "), /per 100 ml/);
});

test("sizes: two or more different sizes in one unit, the cheapest per unit marked only when it stands alone", () => {
  const small = prod("Acme Gel 55ml", "55ml", { EU: [o("a", 390)] }, "8801234567001");
  const big = prod("Acme Gel (250ml)", "250ml", { EU: [o("b", 697), o("c", 650, "out")] }, "8801234567002");
  const shade = prod("Acme Gel (250ml) #2", "250ml", { EU: [o("d", 900)] }, "8801234567003");
  const set = prod("Acme Gel 55ml Gift Set", "55ml", { EU: [o("e", 100)] }, "8801234567004");
  const rows = sizeRows(small, [big, shade, set], "EU");
  assert.deepEqual(rows.map((r) => [r.size, r.low.p, r.unit, r.best]), [["55ml", 390, 709, false], ["250ml", 697, 279, true]]);
  assert.deepEqual(sizeRows(small, [big], "US"), [], "nothing in stock there");
  assert.deepEqual(sizeRows(big, [shade], "EU"), [], "one size in two shades is not a size comparison");
  const qa = factsQa(small, regionFacts(small, undefined), { region: "EU", rows });
  const best = qa.find(([q]) => q === "Which size is the best value?")!;
  assert.match(best[1], /the 250ml is the cheapest per 100 ml: €2\.79 \(€6\.97 at b\)\. The other is the 55ml at €7\.09\./);
});

test("computed questions appear only when the data answers them", () => {
  const qa = factsQa(f, regionFacts(f, history), null);
  assert.deepEqual(qa.map(([q]) => q), ["How much do stores' prices for Acme Toner 150ml differ?", "How much is Acme Toner 150ml per 100 ml?", "Has the price of Acme Toner 150ml changed lately?"]);
  assert.match(qa[0][1], /^In the US it runs from US\$12\.99 \(a\) to US\$15\.00 \(b\) across the 2 stores with it in stock, a gap of US\$2\.01 or 13%\.$/);
  assert.match(qa[2][1], /^In the US the lowest price went from US\$14\.00 to US\$12\.99 on 4 November 2026\./);
  const one = prod("Acme Mask 30 sheets", "30 sheets", { UK: [o("d", 1063)] });
  assert.deepEqual(factsQa(one, regionFacts(one, undefined), null), [], "one store, no unit, no history: no computed question");
});

test("the Product block: one offer in one currency, the barcode under its right name", () => {
  const facts = regionFacts(f, history);
  assert.equal(schemaRegion(facts)!.region, "US");
  const ukOnly = prod("Acme Toner 150ml", "150ml", { US: [o("a", 1, "out")], UK: [o("d", 1063)] });
  assert.equal(schemaRegion(regionFacts(ukOnly, undefined))!.region, "UK", "the first region that can sell it");
  assert.equal(schemaRegion(regionFacts(prod("X", null, { US: [o("a", 1, "out")] }), undefined)), null);
  assert.deepEqual(gtinProps("8801234567893"), { gtin13: "8801234567893" });
  assert.deepEqual(gtinProps("0008080124753"), { gtin12: "008080124753" });
  const page = readFileSync("src/app/product/[slug]/page.tsx", "utf8");
  assert.match(page, /offers: offerIn\s*\?\s*\{\s*"@type": "AggregateOffer"/, "a single AggregateOffer, not one per region");
  assert.doesNotMatch(page, /JSON\.stringify\(/, "structured data goes through JsonLd, which escapes <");
  assert.match(page, /<ProductFacts /);
  assert.match(page, /factsQa\(/);
  // Ratings in the block only from the site's own reviews, and only from a real sample.
  assert.match(page, /aggregateRating: showSchema \?/);
});

test("the summary is server HTML: no client component, no fetch, no ad", () => {
  for (const file of ["src/components/ProductFacts.tsx", "src/lib/product-facts.ts"]) {
    const s = readFileSync(file, "utf8");
    assert.doesNotMatch(s, /"use client"|fetch\(|useEffect|sponsored|affiliate/, file);
  }
});
