import { test } from "node:test";
import assert from "node:assert/strict";
import { ebayPick, planEbay, type EbayItem } from "@/lib/ebay";
import { dayNumber, priceOn, recordHistory } from "@/lib/history";
import type { Offer, Product } from "@/lib/types";

const offers: Offer[] = [2199, 2399, 2599].map((p, i) => ({ s: `s${i}`, p, st: "in", u: "" }));
const item = (over: Partial<EbayItem>): EbayItem => ({ title: "COSRX Advanced Snail 96 Mucin Power Essence 100ml", itemWebUrl: "https://www.ebay.com/itm/1?x=1", price: { value: "20.00", currency: "USD" }, itemLocation: { country: "KR" }, ...over });
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

test("eBay: no store reference, no eBay row", () => {
  assert.equal(ebayPick([item({})], [], "US"), null);
});

test("eBay plan: never-checked first, within budget", () => {
  const plan = planEbay([P("a", { US: offers, AU: offers }), P("b", { US: offers })], { "a:US": "2026-10-27" }, ["US", "AU"], 2);
  assert.deepEqual(plan.map((p) => `${p.f.ean}:${p.region}`), ["a:AU", "b:US"]);
  assert.equal(planEbay([P("a", { US: offers })], {}, ["US"], 0).length, 0, "no cap set, no calls");
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
