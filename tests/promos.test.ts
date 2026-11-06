import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { awinOffers, bestPerItem, dealNote, dealTiers, humanLabel, liveDeal, offerNote, readCart, type AwinPromotion, type CartJson, type PromoData } from "@/lib/promos";
import { money } from "@/lib/format";
import { judgePromos } from "../scripts/ops-monitor";

const aud = (m: number) => money(m, "AU");
const line = (variant_id: number, quantity: number, final_line_price: number, extra = {}) => ({ id: variant_id, variant_id, quantity, final_line_price, original_line_price: final_line_price, ...extra });

test("a cart that charges less for two than twice the shelf price is a multi-buy; the same price is not", () => {
  // Stylevana-style "buy 2 cleansers, save 10%", applied as a line discount.
  const two: CartJson = { currency: "AUD", total_price: 3600, items: [line(11, 2, 3600, { original_line_price: 4000, line_level_discount_allocations: [{ discount_application: { title: "Buy 2 Save 10%" } }] })] };
  const r = readCart(two, 11)!;
  assert.deepEqual([r.qty, r.total, r.labels], [2, 3600, ["Buy 2 Save 10%"]]);
  assert.deepEqual(dealTiers(2000, [{ q: 1, total: 2000 }, { q: 2, total: 3600 }, { q: 3, total: 5400 }]), [[2, 3600]], "3 at the same per-item price adds nothing");
  assert.deepEqual(dealTiers(2000, [{ q: 1, total: 2000 }, { q: 2, total: 4000 }, { q: 3, total: 6000 }]), [], "no discount, no deal");
  assert.deepEqual(dealTiers(2000, [{ q: 2, total: 3990 }]), [], "a cent off is rounding");
  assert.deepEqual(dealTiers(2000, [{ q: 2, total: 1000 }]), [], "under 40% of the shelf price is a broken cart, not a deal");
  assert.deepEqual(dealTiers(2000, [{ q: 2, total: 3600 }, { q: 3, total: 4000 }]), [[2, 3600], [3, 4000]], "3 for 2");
});

test("a cart-level discount on our one product counts, and a free line the cart added is a gift", () => {
  const cart: CartJson = {
    currency: "GBP",
    total_price: 2700,
    items: [line(5, 2, 3000), line(99, 1, 0, { original_line_price: 800, product_title: "Mini Rice Toner 30ml" })],
    cart_level_discount_applications: [{ title: "SPRING10" }],
  };
  const r = readCart(cart, 5)!;
  assert.equal(r.total, 2700);
  assert.deepEqual(r.labels, [], "an internal code is never shown");
  assert.deepEqual(r.gifts, ["Mini Rice Toner 30ml"]);
  assert.equal(readCart(cart, 6), null, "our line missing: nothing");
});

test("discount names are shown only when they read like words", () => {
  assert.equal(humanLabel("Buy 2 Save 10%"), "Buy 2 Save 10%");
  assert.equal(humanLabel("BOGO-NOV23"), null);
  assert.equal(humanLabel("AUTO DISCOUNT 15"), null);
  assert.equal(humanLabel("x"), null);
  assert.equal(humanLabel("Visit https://example.com now"), null);
});

test("a deal shows for two days, only while the shelf price is the one the cart saw, and never ranks", () => {
  const data: PromoData = { kanvas: { at: "2026-11-06", tested: 6, deals: { "8809000000001": { u: 2000, t: [[2, 3600]], l: "Buy 2 Save 10%" } } } };
  const now = Date.parse("2026-11-07T12:00:00Z");
  const d = liveDeal(data, "kanvas", "8809000000001", 2000, now)!;
  assert.equal(dealNote(d, aud), "Buy 2: A$36.00 (A$18.00 each)");
  assert.deepEqual(bestPerItem(d), { q: 2, each: 1800 });
  assert.equal(liveDeal(data, "kanvas", "8809000000001", 1900, now), null, "the price changed since: the cart's total no longer holds");
  assert.equal(liveDeal(data, "kanvas", "8809000000001", 2000, Date.parse("2026-11-09T12:00:00Z")), null, "three days old: hidden");
  assert.equal(liveDeal(data, "other", "8809000000001", 2000, now), null);
  assert.match(dealNote({ u: 2000, t: [], g: "Mini Toner" }, aud), /Free gift in cart: Mini Toner/);
  // The rows' order and badge come from the offers alone: nothing that sorts reads the deals.
  const readers = ["src/lib", "src/app", "src/components"].flatMap((d) => fs.readdirSync(d, { recursive: true }).map((f) => path.join(d, String(f)))).filter((f) => /\.tsx?$/.test(f) && /getPromos\(|liveDeal\(/.test(fs.readFileSync(f, "utf8")));
  assert.deepEqual(readers.sort(), ["src/components/PriceTable.tsx", "src/lib/promos.ts"]);
});

test("Awin offers: in the region, started, not within a day of their end, soonest first", () => {
  const now = Date.parse("2026-11-06T00:00:00Z");
  const p = (id: number, over: Partial<AwinPromotion>): AwinPromotion => ({ id, advertiserId: 90791, type: "promotion", title: "15% off K-beauty", description: "", start: "2026-11-01T00:00:00.000Z", end: "2026-11-30T00:00:00.000Z", regions: "all", ...over });
  const all = [p(1, {}), p(2, { end: "2026-11-06T12:00:00.000Z" }), p(3, { start: "2026-11-10T00:00:00.000Z" }), p(4, { regions: ["GB"] }), p(5, { regions: ["FR"], type: "voucher", code: "GLOW15", end: "2026-11-20T00:00:00.000Z" }), p(6, { advertiserId: 1 })];
  assert.deepEqual(awinOffers(all, 90791, "AU", now).map((x) => x.id), [1]);
  assert.deepEqual(awinOffers(all, 90791, "UK", now).map((x) => x.id), [1, 4]);
  assert.deepEqual(awinOffers(all, 90791, "EU", now).map((x) => x.id), [5, 1]);
  assert.deepEqual(awinOffers(all, null, "EU", now), []);
  assert.equal(offerNote(all[4]), "Code GLOW15: 15% off K-beauty (ends 20 Nov)");
});

test("the monitor: amber when the deals check stops, never red", () => {
  const now = Date.parse("2026-11-06T12:00:00Z");
  assert.equal(judgePromos(null, 10, now).status, "warn");
  assert.equal(judgePromos({ a: { at: "2026-11-01", deals: {} } }, 1, now).status, "warn");
  const ok = judgePromos({ a: { at: "2026-11-06", deals: { x: {} } }, b: { at: "2026-11-06", deals: {} } }, 3, now);
  assert.equal(ok.status, "ok");
  assert.match(ok.detail, /1 run multi-buys/);
});
