import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { SITE, regionForZone } from "@/site";
import { STORES } from "@/content/stores";
import { amazonSearchUrl, ebayAffiliateUrl, ebaySearchUrl, partnerUrl, PARTNERS, storeUrl, subId } from "@/lib/affiliate";
import { judgeFreshness, judgeStores } from "../scripts/ops-monitor";
import { money } from "@/lib/format";
import { searchRows, type IndexRow } from "@/components/SearchBox";

const walk = (d: string): string[] => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(`${d}/${e.name}`) : [`${d}/${e.name}`]));

test("regions from time zones, the specific one wins", () => {
  assert.equal(regionForZone("America/New_York"), "US");
  assert.equal(regionForZone("America/Toronto"), "CA");
  assert.equal(regionForZone("Europe/London"), "UK");
  assert.equal(regionForZone("Europe/Berlin"), "EU");
  assert.equal(regionForZone("Australia/Sydney"), "AU");
  assert.equal(regionForZone("Pacific/Auckland"), "NZ");
  assert.equal(regionForZone("Asia/Seoul"), "US", "no Korea region (DECISIONS.md)");
  assert.equal(regionForZone(undefined), "US");
});

test("affiliate tags name the site, region, placement and product", () => {
  assert.equal(subId("AU", "table_pinned", "8809416470000"), "ky-au-table_pinned-8809416470000");
  const e = new URL(ebayAffiliateUrl("https://www.ebay.com.au/itm/1", "ky-au-x"));
  assert.equal(e.searchParams.get("customid"), "ky-au-x");
  assert.equal(e.searchParams.get("mkrid"), "705-53470-19255-0");
  assert.ok(e.searchParams.get("campid"));
  assert.match(ebaySearchUrl("COSRX Snail Essence", "UK", "t")!, /ebay\.co\.uk.*LH_BIN=1/);
  assert.match(ebaySearchUrl("COSRX Snail Essence", "NZ", "t")!, /ebay\.com\.au.*campid=/, "NZ shops on eBay Australia");
  assert.match(amazonSearchUrl("x", "US", "ky-us-y")!, /amazon\.com\/s\?.*tag=riftcompare-20.*ascsubtag=ky-us-y/);
  assert.match(amazonSearchUrl("x", "AU", "t")!, /amazon\.com\.au\/s\?.*tag=compareempire-22/, "the AU tag on amazon.com.au, never the US one");
  assert.equal(amazonSearchUrl("x", "UK", "t"), null, "no UK tag yet, no Amazon UK row");
  assert.match(storeUrl("nope", "https://shop.example/p?a=1"), /utm_source=kaeyoung\.com&utm_medium=referral/);
});

test("retailer rows appear only once their tracking template is set", () => {
  const ys = PARTNERS.find((p) => p.key === "yesstyle")!;
  assert.equal(partnerUrl(ys, "Anua Toner", "ky-us-t", {}), null);
  assert.equal(partnerUrl(ys, "Anua Toner", "ky-us-t", { AFF_YESSTYLE: "https://www.yesstyle.com/en/list.html?q={q}&rco=ABC" }), "https://www.yesstyle.com/en/list.html?q=Anua%20Toner&rco=ABC");
  const net = partnerUrl(ys, "Anua", "ky-us-t", { AFF_YESSTYLE: "https://network.example/c?u={url}&s={sub}" })!;
  assert.equal(decodeURIComponent(new URL(net).searchParams.get("u")!), "https://www.yesstyle.com/en/list.html?q=Anua");
  assert.equal(new URL(net).searchParams.get("s"), "ky-us-t");
});

test("money stays in its own currency", () => {
  assert.equal(money(2995, "AU"), "A$29.95");
  assert.equal(money(1850, "UK"), "£18.50");
  assert.equal(money(2199, "US"), "US$21.99");
});

test("stores: unique ids and hosts, every region covered", () => {
  assert.equal(new Set(STORES.map((s) => s.id)).size, STORES.length);
  assert.equal(new Set(STORES.map((s) => new URL(s.base).host)).size, STORES.length);
  for (const r of ["US", "UK", "CA", "AU", "NZ", "EU"]) assert.ok(STORES.filter((s) => s.region === r).length >= 2, r);
});

test("K Young stands alone: no sister-site links (owner, 2026-10-30)", () => {
  const src = ["src/site.ts", "src/components/Footer.tsx"].map((f) => fs.readFileSync(f, "utf8")).join("\n");
  for (const s of ["riftcompare", "dexcompare", "figurecompare", "wargamecompare", "Sister sites"]) assert.ok(!src.toLowerCase().includes(s.toLowerCase()), s);
});

test("search: every word must match; a barcode finds its product", () => {
  const rows: IndexRow[] = [
    ["a", "COSRX Advanced Snail 96 Mucin Power Essence 100ml", "serums", "8809416470000", {}],
    ["b", "Anua Heartleaf 77% Soothing Toner 250ml", "toners", "8809640730010", {}],
    ["c", "COSRX Advanced Snail 92 All in One Cream 100g", "moisturisers", "8809416470017", {}],
  ];
  assert.deepEqual(searchRows(rows, "snail").map((r) => r[0]).sort(), ["a", "c"]);
  assert.deepEqual(searchRows(rows, "cosrx cream").map((r) => r[0]), ["c"]);
  assert.deepEqual(searchRows(rows, "8809640730010").map((r) => r[0]), ["b"]);
});

test("ops monitor judgements", () => {
  const now = Date.parse("2026-10-30T12:00:00Z");
  assert.equal(judgeFreshness("2026-10-30T05:00:00Z", now).status, "ok");
  assert.equal(judgeFreshness("2026-10-29T00:00:00Z", now).status, "warn");
  assert.equal(judgeFreshness("2026-10-27T00:00:00Z", now).status, "fail");
  const run = (ok: boolean, listings = 10) => ({ ok, matched: 5, listings, refused: {}, noEan: 0, ms: 1, error: ok ? undefined : "HTTP 429" });
  assert.equal(judgeStores({ updatedAt: "", products: 1, stores: { a: run(true), b: run(true) } }, 2).status, "ok");
  assert.equal(judgeStores({ updatedAt: "", products: 1, stores: { a: run(false), b: run(true), c: run(true), d: run(true) } }, 4).status, "warn");
  assert.equal(judgeStores({ updatedAt: "", products: 1, stores: { a: run(false), b: run(false), c: run(true) } }, 3).status, "fail");
  assert.equal(judgeStores({ updatedAt: "", products: 1, stores: { a: run(true, 0), b: run(true) } }, 2).status, "warn");
});

test("one contact address everywhere", () => {
  assert.equal(SITE.email, "compareempire@gmail.com");
  for (const f of walk("src").filter((f) => /\.(tsx?|md)$/.test(f))) {
    const other = (fs.readFileSync(f, "utf8").match(/[\w.+-]+@[\w-]+\.[\w.]+/g) ?? []).filter((a) => a !== SITE.email && !a.startsWith("@"));
    assert.deepEqual(other, [], `${f} has another address`);
  }
});

test("no banner ads (owner, 2026-10-30): paid links live in the price table only", () => {
  assert.ok(!fs.existsSync("src/components/EbayStrip.tsx"));
  for (const f of walk("src").filter((f) => f.endsWith(".tsx"))) assert.doesNotMatch(fs.readFileSync(f, "utf8"), /EbayStrip|EbayNavBox|AdSlot|adsbygoogle/, f);
  const table = fs.readFileSync("src/components/PriceTable.tsx", "utf8");
  const at = (x: string) => table.indexOf(x);
  assert.ok(at('source: "ebay"') < at('source: "amazon"') && at('source: "amazon"') < at("offers.map"), "eBay first, Amazon second, then the stores");
  for (const row of table.match(/pinned\.push\([\s\S]*?\}\);?\n/g)!) assert.match(row, /paid: true/, "every marketplace row is a labelled paid link");
  // The quick view draws the same rows (from /q/<slug>), never its own order.
  assert.match(fs.readFileSync("src/app/q/[slug]/route.ts", "utf8"), /priceRows\(/);
  assert.match(fs.readFileSync("src/components/QuickView.tsx", "utf8"), /<PriceRows /);
});

test("no Compare branding on K Young (owner, 2026-10-30)", () => {
  for (const f of ["src/components/Header.tsx", "src/components/Logo.tsx", "src/app/layout.tsx", "src/app/page.tsx"]) assert.doesNotMatch(fs.readFileSync(f, "utf8"), /Compare/, f);
  assert.equal(SITE.name, "K Young");
});
