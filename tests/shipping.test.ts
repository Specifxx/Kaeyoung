import { test } from "node:test";
import assert from "node:assert/strict";
import { deliveryFor, deliveryNote, destinationFor, type StoreShipping } from "@/lib/shipping";
import { compareBasket, type BasketData } from "@/lib/basket";
import { partnersFor } from "@/lib/affiliate";
import { money } from "@/lib/format";
import { judgeShipping } from "../scripts/ops-monitor";

const q: StoreShipping = { at: "2026-10-30", to: "Sydney", fee: 995, freeFrom: 7980, paidAt: 7480, maxTested: 7980 };
const aud = (m: number) => money(m, "AU");

test("delivery: charged below what we saw charged, free from what we saw free, unknown in between", () => {
  assert.equal(deliveryFor(q, 2500), 995);
  assert.equal(deliveryFor(q, 7480), 995);
  assert.equal(deliveryFor(q, 7600), null, "the threshold is somewhere between 74.80 and 79.80");
  assert.equal(deliveryFor(q, 7980), 0);
  assert.equal(deliveryFor({ ...q, fee: 0 }, 100), 0, "always free");
  assert.equal(deliveryFor({ ...q, freeFrom: null, paidAt: 25000 }, 30000), 995, "never seen free: the fee");
  assert.equal(deliveryFor(undefined, 100), null);
  const odd = { ...q, freeFrom: 3000, paidAt: 3099 };
  assert.equal(deliveryFor(odd, 2900), 995);
  assert.equal(deliveryFor(odd, 3050), null, "charged above a basket that went free: unknown between them");
  assert.equal(deliveryFor(odd, 3200), 0);
});

test("delivery notes say where to and only what we saw", () => {
  assert.equal(deliveryNote(q, 2500, aud), "+A$9.95 delivery to Sydney (free from A$80)");
  assert.equal(deliveryNote(q, 9000, aud), "Free delivery to Sydney");
  assert.match(deliveryNote(q, 7600, aud)!, /or free/);
  assert.equal(deliveryNote(undefined, 2500, aud), null);
});

test("EU stores are quoted to their own country", () => {
  assert.equal(destinationFor("EU", "https://holyskin.fr").country, "France");
  assert.equal(destinationFor("EU", "https://glowstation.com").country, "Germany");
  assert.equal(destinationFor("AU", "https://kanvasbeauty.com.au").city, "Sydney");
});

test("basket: the store with everything and the lowest total with delivery first", () => {
  const data: BasketData = {
    stores: [
      ["cheapitems", "Cheap Items", { ...q, fee: 1500, freeFrom: null, paidAt: 20000 }],
      ["freeship", "Free Ship", { ...q, fee: 0 }],
      ["unknown", "Unknown", null],
      ["partial", "Partial", q],
    ],
    // rows 0 and 1; "partial" has only row 0
    offers: [
      [0, 1000, 1, 1200, 2, 900, 3, 500],
      [0, 1000, 1, 1100, 2, 900],
    ],
  };
  const r = compareBasket(data, [0, 1]);
  assert.deepEqual(r.map((t) => t.id), ["freeship", "cheapitems", "unknown", "partial"]);
  assert.equal(r[0].total, 2300);
  assert.equal(r[1].total, 3500, "items 20.00 + 15.00 delivery");
  assert.equal(r[2].total, null, "no quote: no total, ranked after known totals");
  assert.deepEqual(r[3].has, [0]);
});

test("YesStyle and Stylevana always show, unpaid until their program accepts us; others only once paid", () => {
  const none = partnersFor("AU", "Anua Toner", "ky-au-t", {});
  assert.deepEqual(none.map((x) => [x.p.key, x.paid]), [["yesstyle", false], ["stylevana", false]]);
  assert.match(none[0].href, /^https:\/\/www\.yesstyle\.com\/en\/list\.html\?q=Anua%20Toner$/);
  const paid = partnersFor("AU", "Anua", "s", { AFF_STYLEVANA: "https://n.example/?u={url}", AFF_IHERB: "https://n.example/?u={url}" });
  assert.deepEqual(paid.map((x) => [x.p.key, x.paid]), [["yesstyle", false], ["stylevana", true], ["iherb", true]]);
});

test("ops monitor watches the weekly delivery quotes", () => {
  const now = Date.parse("2026-11-02T12:00:00Z");
  assert.equal(judgeShipping(null, 100, now).status, "warn");
  const many = Object.fromEntries(Array.from({ length: 80 }, (_, i) => [`s${i}`, { at: "2026-11-01" }]));
  assert.equal(judgeShipping(many, 100, now).status, "ok");
  assert.equal(judgeShipping(many, 100, Date.parse("2026-11-20T00:00:00Z")).status, "warn");
  assert.equal(judgeShipping({ a: { at: "2026-11-01" } }, 100, now).status, "warn");
});
