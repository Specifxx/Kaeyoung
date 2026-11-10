import fs from "node:fs";
import { test } from "node:test";
import assert from "node:assert/strict";
import { EBAY_REGION_DAILY_CAP, ebayPick, ebayQuotaDay, planEbay, regionAllowance, type EbayItem, type EbayPrio } from "@/lib/ebay";
import { dayNumber, priceOn, recordHistory } from "@/lib/history";
import type { Offer, Product } from "@/lib/types";

const offers: Offer[] = [2199, 2399, 2599].map((p, i) => ({ s: `s${i}`, p, st: "in", u: "" }));
const item = (over: Partial<EbayItem>): EbayItem => ({ title: "COSRX Advanced Snail 96 Mucin Power Essence 100ml", itemWebUrl: "https://www.ebay.com/itm/1?x=1", price: { value: "20.00", currency: "USD" }, itemLocation: { country: "US" }, shippingOptions: [{ shippingCost: { value: "0.00", currency: "USD" } }], ...over });
const P = (ean: string, o: Product["offers"]): Product => ({ ean, slug: ean, name: ean, brand: "", b: "", cat: "serums", size: null, img: null, first: "d", offers: o });

test("eBay: cheapest believable new listing", () => {
  const pick = ebayPick([item({}), item({ price: { value: "19.00", currency: "USD" }, itemWebUrl: "https://www.ebay.com/itm/2" })], offers, "US");
  assert.equal(pick?.p, 1900);
  assert.equal(pick?.u, "https://www.ebay.com/itm/2");
});

test("eBay: counterfeit origins, too-cheap, testers and other currencies are out", () => {
  assert.equal(ebayPick([item({ itemLocation: { country: "CN" } })], offers, "US"), null);
  assert.equal(ebayPick([item({ price: { value: "5.99", currency: "USD" } })], offers, "US"), null);
  assert.equal(ebayPick([item({ title: "COSRX Snail Essence sample tester" })], offers, "US"), null);
  assert.equal(ebayPick([item({ price: { value: "20.00", currency: "AUD" } })], offers, "US"), null);
});

test("eBay: local sellers only, postage stated, priced and ranked delivered (visitor feedback 2026-10-31)", () => {
  const ship = (value: string, currency = "USD") => ({ shippingOptions: [{ shippingCost: { value, currency } }] });
  assert.ok(ebayPick([item({ itemLocation: { country: "KR" } })], offers, "US"), "a seller in Korea, the products' home country, stays (priced with postage)");
  assert.equal(ebayPick([item({ itemLocation: { country: "GB" } })], offers, "US"), null, "a UK seller for a US buyer");
  assert.equal(ebayPick([item({ shippingOptions: [{}] })], offers, "US"), null, "calculated postage");
  assert.equal(ebayPick([item({ shippingOptions: undefined })], offers, "US"), null, "no postage at all");
  assert.equal(ebayPick([item(ship("5.00", "KRW"))], offers, "US"), null, "postage in another currency");
  const pick = ebayPick([item({ price: { value: "18.00", currency: "USD" }, ...ship("6.00") }), item({ price: { value: "20.00", currency: "USD" }, ...ship("2.00"), itemWebUrl: "https://www.ebay.com/itm/3" })], offers, "US");
  assert.equal(pick?.u, "https://www.ebay.com/itm/3", "the cheapest delivered, not the cheapest item");
  assert.equal(pick?.p, 2200);
  assert.equal(pick?.sh, 200);
  const eu = (country: string) => item({ price: { value: "20.00", currency: "EUR" }, itemLocation: { country }, ...ship("3.90", "EUR") });
  assert.ok(ebayPick([eu("NL")], offers, "EU"), "a Dutch seller for an EU buyer");
  assert.equal(ebayPick([eu("GB")], offers, "EU"), null, "a UK seller is outside the EU");
});

test("eBay: no store reference, no eBay row", () => {
  assert.equal(ebayPick([item({})], [], "US"), null);
});

test("eBay plan: never-checked first, within budget", () => {
  const plan = planEbay([P("a", { US: offers, AU: offers }), P("b", { US: offers })], { "a:US": "2026-10-27" }, ["US", "AU"], 2);
  assert.deepEqual(plan.map((p) => `${p.f.ean}:${p.region}`), ["b:US", "a:AU"], "never-checked first, the US first among them");
  assert.equal(planEbay([P("a", { US: offers })], {}, ["US"], 0).length, 0, "no cap set, no calls");
});

test("eBay plan: home page first, then popular/new, then the rest; refreshed by tier", () => {
  const products = [P("rest", { US: offers }), P("home", { US: offers }), P("pop", { US: offers })];
  const tiers: Record<string, EbayPrio["tier"]> = { home: 0, pop: 1, rest: 2 };
  const prio = (f: Product): EbayPrio => ({ tier: tiers[f.ean], score: 1 });
  const ids = (p: { f: Product; region: string }[]) => p.map((x) => `${x.f.ean}:${x.region}`);
  assert.deepEqual(ids(planEbay(products, {}, ["US"], 2, prio, "2026-10-31")), ["home:US", "pop:US"]);
  // The home-page product is due again after a day; the others are not yet due,
  // so spare budget goes to them oldest check first.
  const checked = { "home:US": "2026-10-30", "pop:US": "2026-10-30", "rest:US": "2026-10-29" };
  assert.deepEqual(ids(planEbay(products, checked, ["US"], 3, prio, "2026-10-31")), ["home:US", "rest:US", "pop:US"]);
  assert.deepEqual(ids(planEbay(products, checked, ["US"], 1, prio, "2026-10-31")), ["home:US"]);
});

test("eBay plan: coverage first, empty searches wait, the US first among equals (owner, 2026-11-01)", () => {
  const ids = (p: { f: Product; region: string }[]) => p.map((x) => `${x.f.ean}:${x.region}`);
  const products = [P("found", { US: offers }), P("empty", { US: offers }), P("never", { US: offers, AU: offers })];
  const checked = { "found:US": "2026-10-24", "empty:US": "2026-10-24" };
  const hasRow = (ean: string) => ean === "found";
  // A week old: the product with a listing is due again, the empty search is not (21 days for tier 2).
  assert.deepEqual(ids(planEbay(products, checked, ["US", "AU"], 3, undefined, "2026-10-31", hasRow)), ["never:US", "never:AU", "found:US"]);
  assert.deepEqual(ids(planEbay(products, { ...checked, "empty:US": "2026-10-10" }, ["US"], 4, undefined, "2026-10-31", hasRow)), ["never:US", "empty:US", "found:US"]);
  // Never searched, same tier: the US goes first.
  assert.deepEqual(ids(planEbay([P("a", { AU: offers, US: offers })], {}, ["AU", "US"], 1)), ["a:US"]);
});

test("eBay and Amazon rows are drawn like store rows (owner, 2026-11-01)", () => {
  const rows = fs.readFileSync("src/components/PriceRows.tsx", "utf8");
  assert.doesNotMatch(rows + fs.readFileSync("src/app/globals.css", "utf8"), /btn-ebay|btn-amazon/);
});

test("eBay quota day is the Pacific date", () => {
  assert.equal(ebayQuotaDay(new Date("2026-10-31T06:30:00Z")), "2026-10-30");
  assert.equal(ebayQuotaDay(new Date("2026-10-31T07:30:00Z")), "2026-10-31");
});

test("history records only changes and reads back by day", () => {
  const p = P("j", { US: offers });
  let h = recordHistory({}, [p], "2026-10-01");
  h = recordHistory(h, [p], "2026-10-02");
  assert.equal(h.j.US!.length, 1);
  h = recordHistory(h, [{ ...p, offers: { US: [{ ...offers[0], p: 1999 }] } }], "2026-10-05");
  assert.deepEqual(h.j.US, [[dayNumber("2026-10-01"), 2199], [dayNumber("2026-10-05"), 1999]]);
  assert.equal(priceOn(h.j.US, dayNumber("2026-10-03")), 2199);
});

test("sold-out everywhere records nothing", () => {
  assert.deepEqual(recordHistory({}, [P("k", { US: [{ ...offers[0], st: "out" }] })], "2026-10-01"), { k: {} });
});

test("eBay plan: a region at its daily ceiling gives its calls to the next pairs, the US first (owner, 2026-11-10)", () => {
  const ps = ["a", "b", "c", "d"].map((e) => P(e, { US: offers, EU: offers, AU: offers }));
  const plan = planEbay(ps, {}, ["US", "EU", "AU"], 8, undefined, "2026-11-10", undefined, undefined, { EU: 1 });
  const by = (r: string) => plan.filter((p) => p.region === r).length;
  assert.equal(plan.length, 8, "no call of the budget is lost");
  assert.equal(by("EU"), 1, "EU held to its ceiling");
  assert.equal(by("US"), 4, "every US pair searched");
  assert.equal(by("AU"), 3);
  const spare = planEbay(ps, {}, ["US", "EU"], 6, undefined, "2026-11-10", undefined, undefined, { EU: 1 });
  assert.deepEqual(spare.map((p) => p.region), ["US", "US", "US", "US", "EU", "EU"], "calls no other region can use still go to the capped region, last");
});

test("eBay plan: the region ceilings move EU's calls to the US and Australia and keep the site total", () => {
  assert.equal(EBAY_REGION_DAILY_CAP.US, undefined, "the US is never capped below the site cap");
  assert.equal(EBAY_REGION_DAILY_CAP.AU, undefined);
  assert.deepEqual(EBAY_REGION_DAILY_CAP, { UK: 480, CA: 320, EU: 160 });
  assert.deepEqual(regionAllowance({ EU: 100, UK: 600 }), { UK: 0, CA: 320, EU: 60 }, "a second run on the quota day gets only what is left");
});

test("eBay plan: an EU pair whose search found nothing waits three times longer", () => {
  const p = [P("e", { US: offers, EU: offers })];
  const checked = { "e:US": "2026-10-20", "e:EU": "2026-10-20" };
  // Tier 2, found nothing, 21 days ago: due in the US (21), not yet in the EU (63); spare budget still reaches EU.
  assert.deepEqual(planEbay(p, checked, ["US", "EU"], 1, undefined, "2026-11-10", () => false).map((x) => `${x.f.ean}:${x.region}`), ["e:US"]);
});
