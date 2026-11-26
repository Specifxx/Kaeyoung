import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { cleanCode, decode, endLabel, mergeCodes, order, regionLabel, valueTag, wording, type AwinPromotionIn, type CodesFile } from "../src/lib/codes";
import { CODE_STORES } from "../src/content/code-stores";
import { judgeCodes } from "../scripts/ops-monitor";

const NOW = Date.parse("2026-11-26T09:00:00Z");
const store = { awin: 87957, slug: "hottperfume", name: "HottPerfume" };
const v = (o: Partial<AwinPromotionIn>): AwinPromotionIn => ({ id: 1, advertiserId: 87957, type: "voucher", title: "10% off", start: "2026-11-01T00:00:00Z", end: "2026-12-31T00:00:00Z", regions: "all", code: "SAVE10", ...o });

test("feed wording is decoded, de-duplicated and loses the store's name and the repeated code", () => {
  assert.equal(decode("$50 &amp; Up &#39;now&#39;"), "$50 & Up 'now'");
  assert.deepEqual(wording({ title: "10% OFF At Hottperfume.com | 10% OFF At Hottperfume.com Orders $50 &amp; Up | Limited Time Only", description: "" }, "HottPerfume", "DAD24"), { title: "10% off Orders $50 and Up" });
  assert.deepEqual(wording({ title: "10% off orders of $50+ with code: GIFT26", description: "10% off orders of $50+ with code: GIFT26 at HottPerfume.com" }, "HottPerfume", "GIFT26"), { title: "10% off orders of $50+" });
  assert.equal(wording({ title: "Get upto 60% Off on Perfume Gift Sets- Paco Perfumerias", description: "." }, "Paco Perfumerías").title, "Get up to 60% Off on Perfume Gift Sets");
  assert.equal(wording({ title: "Free Tracked Delivery on All Orders - Fragrance Click UK", description: "-" }, "Fragrance Click").title, "Free Tracked Delivery on All Orders");
});

test("only a code a shopper can type is a code", () => {
  assert.equal(cleanCode("GIFT26"), "GIFT26");
  assert.equal(cleanCode(" sum26 "), "sum26");
  assert.equal(cleanCode("N/A"), null);
  assert.equal(cleanCode("use code at checkout"), null);
  assert.equal(cleanCode(""), null);
});

test("merge keeps the first-seen day, drops ended and not-yet-started offers, and dedupes a code", () => {
  const a = mergeCodes(null, [v({ id: 1 }), v({ id: 2, code: "save10", start: "2026-11-20T00:00:00Z" }), v({ id: 3, start: "2026-12-01T00:00:00Z", code: "LATER" }), v({ id: 4, end: "2026-11-26T12:00:00Z", code: "SOON" }), v({ id: 5, type: "promotion", code: undefined, title: "Free delivery over $50" })], [store], NOW);
  const live = a.stores.hottperfume.live;
  assert.deepEqual(live.map((c) => c.id), ["aw-2", "aw-5"], "the newest of two same codes, then the deal; not started and ending within 12h left out");
  assert.equal(live[0].seen, "2026-11-26");
  const b = mergeCodes(a, [v({ id: 2, code: "save10", start: "2026-11-20T00:00:00Z" })], [store], NOW + 3 * 86_400_000);
  assert.equal(b.stores.hottperfume.live[0].seen, "2026-11-26", "first seen is kept");
  assert.deepEqual(b.stores.hottperfume.ended, [], "a deal that left the feed is simply gone; only codes are listed as ended");
  const c = mergeCodes(b, [], [store], NOW + 4 * 86_400_000);
  assert.equal(c.stores.hottperfume.ended[0].code, "save10");
  assert.equal(c.stores.hottperfume.ended[0].ended, "2026-11-30");
  const d = mergeCodes(c, [], [store], NOW + 60 * 86_400_000);
  assert.deepEqual(d.stores.hottperfume.ended, [], "ended codes drop off after 45 days");
});

test("a voucher with no usable code is neither a code nor a deal, and votes never order", () => {
  const f = mergeCodes(null, [v({ code: "" })], [store], NOW);
  assert.equal(f.stores.hottperfume.live.length, 0);
  const x = { id: "aw-1", title: "a", start: "2026-11-01", end: "2027-01-01", regions: "all" as const, seen: "2026-11-26" };
  const list = [{ ...x, id: "aw-2" }, { ...x, id: "aw-3", code: "OLD", start: "2026-10-01" }, { ...x, id: "aw-4", code: "NEW", start: "2026-11-20" }].sort(order);
  assert.deepEqual(list.map((c) => c.id), ["aw-4", "aw-3", "aw-2"]);
});

test("labels read like a person wrote them", () => {
  assert.equal(regionLabel("all"), "All regions");
  assert.equal(regionLabel(["GB"]), "UK only");
  assert.equal(endLabel({ end: "2026-11-30T23:59:00Z" }, NOW), "Ends 30 Nov");
  assert.equal(endLabel({ end: "2027-01-31T23:59:00Z" }, NOW), "Ends 31 Jan 2027");
  assert.equal(endLabel({ end: "2050-12-31T00:00:00Z" }, NOW), null, "the network's far-future date is no end date");
  assert.deepEqual(valueTag("10% off orders of $50+"), { big: "10%", small: "off" });
  assert.deepEqual(valueTag("$15 off Orders $100+"), { big: "$15", small: "off" });
  assert.deepEqual(valueTag("Free Tracked Delivery on All Orders"), { big: "Free", small: "delivery" });
  assert.deepEqual(valueTag("Up to 70% Off Perfume"), { pre: "up to", big: "70%", small: "off" });
});

test("code store slugs are unique and kept; the pages are static and votes go to RiftCompare", () => {
  const slugs = CODE_STORES.map((s) => s.slug);
  assert.equal(new Set(slugs).size, slugs.length);
  assert.equal(new Set(CODE_STORES.map((s) => s.awin)).size, CODE_STORES.length);
  for (const s of slugs) assert.match(s, /^[a-z0-9-]+$/);
  const page = readFileSync(new URL("../src/app/codes/[store]/page.tsx", import.meta.url), "utf8");
  assert.match(page, /dynamicParams = false/);
  assert.doesNotMatch(page, /cookies\(|headers\(|searchParams/);
  const list = readFileSync(new URL("../src/components/codes/CodeList.tsx", import.meta.url), "utf8");
  assert.match(list, /https:\/\/riftcompare\.com\/api\/code-votes/);
  assert.doesNotMatch(list, /window\.open/, "copying never opens anything");
});

test("the ops check flags a stale or empty codes file", () => {
  assert.equal(judgeCodes(new Date(NOW - 3_600_000).toISOString(), 12, NOW).status, "ok");
  assert.equal(judgeCodes(new Date(NOW - 60 * 3_600_000).toISOString(), 12, NOW).status, "warn");
  assert.equal(judgeCodes(new Date(NOW).toISOString(), 0, NOW).status, "warn");
});

test("the committed file, when present, has the shape the pages read", () => {
  let f: CodesFile | null = null;
  try {
    f = JSON.parse(readFileSync(new URL("../data/public/codes.json", import.meta.url), "utf8")) as CodesFile;
  } catch {}
  if (!f) return;
  for (const [slug, s] of Object.entries(f.stores)) {
    assert.ok(CODE_STORES.some((c) => c.slug === slug), slug);
    for (const c of s.live) assert.match(c.id, /^aw-\d+$/);
  }
});

test("a site can refuse an offer it would never list", () => {
  const f = mergeCodes(null, [v({ id: 9, type: "promotion", code: undefined, title: "Armani Diamonds 75ml Tester" })], [store], NOW, (t) => /\btesters?\b/i.test(t));
  assert.equal(f.stores.hottperfume.live.length, 0);
});
