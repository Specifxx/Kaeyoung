// Ratings and reviews (DECISIONS.md "Ratings and reviews", 2026-10-30).
import { test } from "node:test";
import assert from "node:assert/strict";
import { reviewFlags, summarize, validateReview, SCHEMA_MIN_RATINGS, PAGE_REVIEWS_MAX } from "@/lib/reviews";
import { adminKeyOk, sameSite, visitorLimit } from "@/lib/reviews-http";
import { addReview, decide, loadStore, setStatus, type Store } from "@/lib/reviews-store";
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
  assert.equal(s.reviews[1].n, "KaeYoung shopper");
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
  assert.match(judgeReviews(null, false).detail, /no token/);
  const file = { exportedAt: "2026-10-30T06:30:00Z", held: 2, products: {} };
  assert.equal(judgeReviews(file, true, at(9)).status, "warn");
  assert.equal(judgeReviews(file, true, at(12)).status, "ok");
  assert.equal(judgeReviews({ ...file, held: 0 }, true, at(9)).status, "ok");
  assert.equal(judgeReviews({ ...file, error: "timeout" }, true, at(12)).status, "warn");
  assert.equal(judgeReviews({ ...file, exportedAt: "2026-10-27T06:30:00Z" }, true, at(12)).status, "warn");
  assert.match(judgeReviews(file, true, at(12), { error: "HTTP 401" }).detail, /can't be read/);
  assert.match(judgeReviews(file, true, at(12), { tokenExpires: "2026-11-05 00:00:00 UTC" }).detail, /expires in 5 day/);
  assert.equal(judgeReviews(file, true, at(12), { tokenExpires: "2027-10-30 00:00:00 UTC" }).status, "ok");
});

const clean = (over: Partial<Parameters<typeof decide>[1]> = {}) => ({ ean: EAN, stars: 5 as const, title: null, body: null, name: null, skin: null, ...over });

test("store rules: a site-wide daily cap, copied text is held, nothing about the visitor is stored", () => {
  const now = new Date("2026-10-30T12:00:00Z");
  const store: Store = { reviews: [] };
  const a = decide(store, clean(), now);
  assert.ok(a.ok && a.row.id === 1 && a.row.status === "published");
  if (a.ok) {
    assert.deepEqual(Object.keys(a.row).sort(), ["at", "body", "ean", "flags", "id", "name", "skin", "stars", "status", "title"], "no IP, hash or email");
    store.reviews.push(a.row);
  }
  const body = "Lovely light texture, no sticky finish at all.";
  store.reviews.push({ ...store.reviews[0], id: 7, ean: "8800000000017", body });
  const c = decide(store, clean({ body }), now);
  assert.ok(c.ok && c.row.status === "held" && c.row.flags.includes("copied text") && c.row.id === 8);
  const busy: Store = { reviews: Array.from({ length: 400 }, (_, i) => ({ ...store.reviews[0], id: i + 1, at: "2026-10-30T08:00:00" })) };
  assert.equal((decide(busy, clean(), now) as { code: number }).code, 429);
  busy.reviews.forEach((r) => (r.at = "2026-10-28T08:00:00"));
  assert.ok(decide(busy, clean(), now).ok, "older reviews don't count against today");
});

test("per-visitor limits live in memory only: one rating per product, eight a day", () => {
  const now = new Date("2026-10-30T12:00:00Z");
  assert.equal(visitorLimit("9.9.9.9", EAN, 8, now), "ok");
  assert.equal(visitorLimit("9.9.9.9", EAN, 8, now), "same");
  for (let i = 0; i < 7; i++) assert.equal(visitorLimit("9.9.9.9", `88000000000${i}0`, 8, now), "ok");
  assert.equal(visitorLimit("9.9.9.9", "8800000000999", 8, now), "busy");
  assert.equal(visitorLimit("9.9.9.9", "8800000000999", 8, new Date("2026-10-31T00:00:01Z")), "ok", "a new day starts over");
});

// A tiny GitHub contents API: one file, sha-checked writes, and one forced race.
function fakeGitHub(opts: { race?: boolean } = {}) {
  let file: { sha: string; text: string } | null = { sha: "s0", text: '{"reviews":[]}' };
  let n = 0;
  let race = opts.race ?? false;
  const calls: string[] = [];
  const f = (async (url: string, init?: RequestInit) => {
    const u = String(url);
    calls.push(`${init?.method ?? "GET"} ${u.replace("https://api.github.com/repos/", "")}`);
    assert.match(String((init?.headers as Record<string, string>).Authorization), /^Bearer test-token$/);
    const headers = { "github-authentication-token-expiration": "2027-10-30 00:00:00 UTC" };
    if (u.endsWith("/contents/reviews.json") && init?.method === "PUT") {
      const b = JSON.parse(String(init.body)) as { sha?: string; content: string; message: string };
      assert.doesNotMatch(b.message, /@|\[deploy\]|\[preview\]/i, "commit messages carry no content and never deploy");
      if (race) {
        race = false;
        file = { sha: `s${++n}`, text: JSON.stringify({ reviews: [{ id: 1, at: "2026-10-30T11:00:00", ean: "8800000000017", stars: 4, title: null, body: null, name: null, skin: null, status: "published", flags: "" }] }) };
      }
      assert.equal((b as { branch?: string }).branch, "reviews", "writes go to the reviews branch, never main");
      if (file?.sha !== b.sha) return new Response("{}", { status: 409 });
      file = { sha: `s${++n}`, text: Buffer.from(b.content, "base64").toString("utf8") };
      return new Response("{}", { status: 200 });
    }
    if (u.endsWith("/contents/reviews.json?ref=reviews")) {
      if (!file) return new Response("{}", { status: 404, headers });
      return Response.json({ sha: file.sha, encoding: "base64", content: Buffer.from(file.text).toString("base64") }, { headers });
    }
    return new Response("{}", { status: 404 });
  }) as unknown as typeof fetch;
  return { f, calls, file: () => file };
}

test("the GitHub store: a review is appended, a write race re-reads, moderation flips status", async () => {
  process.env.REVIEWS_GITHUB_TOKEN = "test-token";
  delete process.env.REVIEWS_REPO;
  try {
    const gh = fakeGitHub({ race: true });
    const r = await addReview(clean({ body: "Use code GLOW20 for 20% off at our store please" }), gh.f);
    assert.deepEqual(r, { ok: true, status: "held" });
    const { store, tokenExpires } = await loadStore(gh.f);
    assert.equal(tokenExpires, "2027-10-30 00:00:00 UTC");
    assert.deepEqual(store.reviews.map((x) => [x.id, x.status]), [[1, "published"], [2, "held"]], "the racing write is kept, ours appended after it");
    assert.doesNotMatch(gh.file()!.text, /"ip"/, "nothing about the visitor is stored");
    assert.equal(await setStatus(2, "published", gh.f), true);
    assert.equal(await setStatus(99, "hidden", gh.f), false);
    assert.equal((await loadStore(gh.f)).store.reviews[1].status, "published");
    assert.ok(gh.calls.every((c) => c.startsWith("GET Specifxx/Kaeyoung/") || c.startsWith("PUT Specifxx/Kaeyoung/")));
  } finally {
    delete process.env.REVIEWS_GITHUB_TOKEN;
  }
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

test("Korean words find English names; a brand's Hangul name finds the brand", () => {
  const rows = [
    row("a", "Relief Sun Rice + Probiotics SPF50 50ml", "sunscreen", "Beauty of Joseon", 1800, 0, 0, 12, "2026-10-01"),
    row("b", "Heartleaf 77% Soothing Toner 250ml", "toners", "Anua", 1900, 0, 0, 3, "2026-10-01"),
  ];
  rows[0][11] = "조선미녀";
  rows[1][11] = "아누아";
  assert.deepEqual(searchRows(rows, "조선미녀").map((r) => r[0]), ["a"]);
  assert.deepEqual(searchRows(rows, "선크림").map((r) => r[0]), ["a"]);
  assert.deepEqual(searchRows(rows, "어성초 토너").map((r) => r[0]), ["b"]);
});
