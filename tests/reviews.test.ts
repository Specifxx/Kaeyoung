// Ratings and reviews (DECISIONS.md "Ratings and reviews", 2026-10-30).
import { test } from "node:test";
import assert from "node:assert/strict";
import { reviewFlags, summarize, validateReview, SCHEMA_MIN_RATINGS, PAGE_REVIEWS_MAX } from "@/lib/reviews";
import { adminKeyOk, sameSite } from "@/lib/reviews-http";
import { buildFile } from "../scripts/reviews-export";
import { judgeReviews } from "../scripts/ops-monitor";
import { applyFilters, imageUrl, norm, packImage, searchRows, NO_FILTERS, type IndexRow } from "@/lib/browse";

const EAN = "8809416470000";

test("a rating needs a Korean barcode and 1–5 stars; words are optional", () => {
  assert.equal(validateReview({ ean: EAN, stars: 5 }).ok, true);
  assert.equal(validateReview({ ean: "4901234567894", stars: 5 }).ok, false);
  assert.equal(validateReview({ ean: EAN, stars: 0 }).ok, false);
  assert.equal(validateReview({ ean: EAN, stars: 4.5 }).ok, false);
  assert.equal(validateReview({ ean: EAN, stars: 4, body: "too short" }).ok, false);
  assert.equal(validateReview({ ean: EAN, stars: 4, title: "Great", body: "" }).ok, false, "a headline needs words under it");
  const v = validateReview({ ean: EAN, stars: 4, body: "  Lovely light texture,​ no sticky finish at all. ", name: "Mina\nKim", skin: "oily" });
  assert.ok(v.ok);
  if (v.ok) {
    assert.equal(v.review.body, "Lovely light texture, no sticky finish at all.");
    assert.equal(v.review.name, "Mina Kim");
    assert.equal(v.review.skin, "oily");
  }
  const bad = validateReview({ ean: EAN, stars: 3, skin: "lizard" });
  assert.ok(bad.ok && bad.review.skin === null);
});

test("links, contact details, shop names and spam wait for the owner; plain reviews and bare ratings publish", () => {
  const f = (body: string, name: string | null = null) => reviewFlags({ title: null, body, name });
  assert.deepEqual(f("Really gentle on my sensitive skin, no stinging and it layers well."), []);
  assert.deepEqual(f("수분감이 좋아요. 끈적임 없이 촉촉하고 순해요. 재구매 의사 있어요!"), [], "Korean text is fine");
  assert.deepEqual(reviewFlags({ title: null, body: null, name: null }), []);
  assert.ok(f("Cheaper at www.cheapkbeauty.shop honestly").includes("link"));
  assert.ok(f("Buy it here https://x.example/p for less").includes("link"));
  assert.ok(f("Message me on whatsapp +1 415 555 0134 for a deal").includes("phone"));
  assert.ok(f("Email me at someone@example.com for samples").includes("email"));
  assert.ok(f("Use code GLOW20 for 20% off at our store").includes("spam words"));
  assert.ok(f("This cured my eczema in two days, amazing product").includes("medical claim"));
  assert.ok(f("THIS IS THE BEST CREAM I HAVE EVER USED IN MY LIFE").includes("shouting"));
  assert.ok(f("Nice cream, works well on dry patches.", "Glow Beauty Shop").includes("name looks like a shop"));
});

test("the summary counts every rating; only written ones are listed, newest first, capped", () => {
  const rows = [
    { id: 1, stars: 5, title: null, body: "Holy grail, I have bought four tubs of it now.", name: null, skin: "dry", created: "2026-10-01T10:00:00" },
    { id: 2, stars: 3, title: null, body: null, name: null, skin: null, created: "2026-10-02T10:00:00" },
    { id: 3, stars: 4, title: "Good", body: "Nice but the jar is small for the price.", name: "Jo", skin: "lizard", created: "2026-10-03T10:00:00" },
  ];
  const s = summarize(rows);
  assert.equal(s.n, 3);
  assert.equal(s.w, 2);
  assert.equal(s.avg, 4);
  assert.deepEqual(s.dist, [0, 0, 1, 1, 1]);
  assert.deepEqual(s.reviews.map((r) => r.id), [3, 1]);
  assert.equal(s.reviews[1].n, "K Young shopper");
  assert.equal(s.reviews[0].k, undefined, "an unknown skin type is dropped");
  const many = Array.from({ length: 50 }, (_, i) => ({ ...rows[0], id: i + 1, created: `2026-10-${String((i % 28) + 1).padStart(2, "0")}T00:00:00` }));
  assert.equal(summarize(many).reviews.length, PAGE_REVIEWS_MAX);
  assert.ok(SCHEMA_MIN_RATINGS >= 3, "review stars in search results only from a real sample");
});

test("the export writes only products the site lists, and nothing private", () => {
  const rows = [
    { id: 1, ean: EAN, stars: 5, title: null, body: "Holy grail, I have bought four tubs of it now.", name: "Mina", skin: null, created: "2026-10-01T10:00:00" },
    { id: 2, ean: "8800000000000", stars: 1, title: null, body: null, name: null, skin: null, created: "2026-10-01T10:00:00" },
  ];
  const file = buildFile(rows, 2, new Set([EAN]), new Date("2026-10-30T06:00:00Z"));
  assert.deepEqual(Object.keys(file.products), [EAN]);
  assert.equal(file.held, 2);
  assert.doesNotMatch(JSON.stringify(file), /ip_key|flags|status|@/);
});

test("ops monitor: reviews off is a setup step; held reviews warn once a day", () => {
  const at = (h: number) => Date.parse(`2026-10-30T${String(h).padStart(2, "0")}:50:00Z`);
  assert.match(judgeReviews(null, false).detail, /not set/);
  const file = { exportedAt: "2026-10-30T06:30:00Z", held: 2, products: {} };
  assert.equal(judgeReviews(file, true, at(9)).status, "warn");
  assert.equal(judgeReviews(file, true, at(12)).status, "ok");
  assert.equal(judgeReviews({ ...file, held: 0 }, true, at(9)).status, "ok");
  assert.equal(judgeReviews({ ...file, error: "timeout" }, true, at(12)).status, "warn");
  assert.equal(judgeReviews({ ...file, exportedAt: "2026-10-27T06:30:00Z" }, true, at(12)).status, "warn");
});

test("the review form only takes posts from our own pages; the admin key is long and exact", () => {
  const req = (origin: string | null) => new Request("https://kaeyoung.com/api/reviews", { method: "POST", headers: origin ? { origin, host: "kaeyoung.com" } : { host: "kaeyoung.com" } });
  assert.equal(sameSite(req("https://kaeyoung.com"), "https://kaeyoung.com"), true);
  assert.equal(sameSite(req("https://evil.example"), "https://kaeyoung.com"), false);
  assert.equal(sameSite(req(null), "https://kaeyoung.com"), false);
  const key = "k".repeat(30);
  assert.equal(adminKeyOk(key, key), true);
  assert.equal(adminKeyOk("k".repeat(29), key), false);
  assert.equal(adminKeyOk("short", "short"), false, "a key under 24 characters is never accepted");
  assert.equal(adminKeyOk(key, undefined), false);
});

const row = (slug: string, name: string, cat: string, brand: string, us: number | undefined, rating: number, n: number, pop: number, first: string): IndexRow => [
  slug, name, cat, "8800000000000", us == null ? {} : { US: us }, brand, brand.toLowerCase(), rating, n, pop, first,
];

test("search keeps Hangul, matches the brand and synonyms, popular first among equals", () => {
  assert.equal(norm("조선미녀 맑은쌀 선크림"), "조선미녀 맑은쌀 선크림");
  assert.equal(norm("Crème Légère"), "creme legere");
  const rows = [
    row("a", "Relief Sun Rice + Probiotics SPF50 50ml", "sunscreen", "Beauty of Joseon", 1800, 0, 0, 12, "2026-10-01"),
    row("b", "Relief Sun Aqua-fresh SPF50 50ml", "sunscreen", "Beauty of Joseon", 1900, 0, 0, 3, "2026-10-01"),
    row("c", "Centella Ampoule 100ml", "serums", "SKIN1004", 2000, 0, 0, 8, "2026-10-01"),
  ];
  assert.deepEqual(searchRows(rows, "joseon relief").map((r) => r[0]), ["a", "b"], "brand words count");
  assert.deepEqual(searchRows(rows, "relief sun").map((r) => r[0]), ["a", "b"], "the popular one first");
  assert.deepEqual(searchRows(rows, "sunscreen").map((r) => r[0]).sort(), ["a", "b"], "sunscreen finds Sun");
  assert.deepEqual(searchRows(rows, "cica").map((r) => r[0]), ["c"]);
});

test("filters and sorts", () => {
  const rows = [
    row("a", "Alpha Cream", "moisturisers", "COSRX", 2000, 46, 12, 9, "2026-10-01"),
    row("b", "Beta Toner", "toners", "Anua", 1500, 38, 4, 12, "2026-10-20"),
    row("c", "Gamma Cream", "moisturisers", "COSRX", undefined, 0, 0, 4, "2026-10-25"),
  ];
  const ids = (f: Partial<typeof NO_FILTERS>) => applyFilters(rows, { ...NO_FILTERS, ...f }, "US").map((r) => r[0]);
  assert.deepEqual(ids({}), ["b", "a", "c"], "most popular first");
  assert.deepEqual(ids({ sort: "rating" }), ["a", "b", "c"]);
  assert.deepEqual(ids({ sort: "price-asc" }), ["b", "a", "c"], "no price in the region sorts last");
  assert.deepEqual(ids({ sort: "price-desc" }), ["a", "b", "c"]);
  assert.deepEqual(ids({ sort: "name" }), ["a", "b", "c"]);
  assert.deepEqual(ids({ sort: "new" }), ["c", "b", "a"]);
  assert.deepEqual(ids({ cat: "moisturisers" }), ["a", "c"]);
  assert.deepEqual(ids({ brand: "COSRX", inStock: true }), ["a"]);
  assert.deepEqual(ids({ minStars: 4 }), ["a"]);
  assert.deepEqual(ids({ q: "cream", sort: "new" }), ["c", "a"]);
});

test("photos pack small and come back at the width asked for", () => {
  const p = packImage("https://cdn.shopify.com/s/files/1/2110/4651/files/toner.jpg?v=1699585166&width=600");
  assert.equal(p, "1/2110/4651/files/toner.jpg");
  assert.equal(imageUrl(p, 120), "https://cdn.shopify.com/s/files/1/2110/4651/files/toner.jpg?width=120");
  assert.equal(imageUrl(packImage("https://shop.example/a.jpg"), 120), "https://shop.example/a.jpg");
  assert.equal(imageUrl("", 120), null);
});
