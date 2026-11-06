import { test } from "node:test";
import assert from "node:assert/strict";
import { awinTemplate, partnerProductUrl, partnerUrl, PARTNERS } from "@/lib/affiliate";
import { feedHeader, keepRow, partnerPriceIn, productLink, splitCells, type PartnerPricesFile } from "@/lib/partner-feed";
import { judgePartnerFeeds } from "../scripts/ops-monitor";

const sv = PARTNERS.find((p) => p.key === "stylevana")!;
// A valid Korean barcode (COSRX Advanced Snail 96 Mucin Power Essence 100 ml).
const EAN = "8809416470009";

test("Stylevana earns through Awin with no env var: merchant 90791, our publisher id, the sub as click reference", () => {
  assert.equal(sv.template, awinTemplate("90791"));
  const u = new URL(partnerUrl(sv, "Anua Toner", "ky-us-table_pinned-1", {})!);
  assert.equal(u.host, "www.awin1.com");
  assert.equal(u.searchParams.get("awinmid"), "90791");
  assert.equal(u.searchParams.get("awinaffid"), "3144410");
  assert.equal(u.searchParams.get("clickref"), "ky-us-table_pinned-1");
  assert.equal(u.searchParams.get("ued"), "https://www.stylevana.com/en_US/catalogsearch/result/?q=Anua%20Toner");
  // The env var still overrides the hard-coded template.
  assert.equal(partnerUrl(sv, "x", "s", { AFF_STYLEVANA: "https://n.example/?q={q}" }), "https://n.example/?q=x");
});

test("a feed row's product link is tracked through the same template", () => {
  const u = new URL(partnerProductUrl(sv, "https://www.stylevana.com/en_US/cosrx-essence.html", "ky-au-t", {})!);
  assert.equal(u.searchParams.get("ued"), "https://www.stylevana.com/en_US/cosrx-essence.html");
  // A search-only template cannot carry a product URL.
  assert.equal(partnerProductUrl(sv, "https://x.example/p", "s", { AFF_STYLEVANA: "https://n.example/?q={q}" }), null);
});

test("Awin CSV header and quoted cells", () => {
  const h = feedHeader(splitCells('aw_deep_link,product_name,search_price,currency,ean,in_stock,merchant_deep_link', ",").cells);
  assert.deepEqual([...h.values()], ["awLink", "price", "currency", "ean", "stock", "link"]);
  assert.deepEqual(splitCells('"a, b","c ""d""",e', ",").cells, ["a, b", 'c "d"', "e"]);
  assert.equal(splitCells('"open', ",").open, true);
  assert.equal(productLink({ awLink: "https://www.awin1.com/pclick.php?p=1&a=3144410&m=90791&ued=https%3A%2F%2Fwww.stylevana.com%2Fen_US%2Fx.html" }), "https://www.stylevana.com/en_US/x.html");
});

test("keepRow: barcode only, own currency's region, in stock, 60–160% of the store median", () => {
  const stores = (r: string, e: string) => (r === "US" && e === EAN ? [2000, 2200, 2400] : []);
  const row = { ean: EAN, price: "19.50", currency: "USD", stock: "1", link: "https://www.stylevana.com/en_US/x.html" };
  assert.deepEqual(keepRow(row, stores), { region: "US", ean: EAN, p: 1950, u: "https://www.stylevana.com/en_US/x.html" });
  assert.equal(keepRow({ ...row, stock: "0" }, stores), null, "out of stock");
  assert.equal(keepRow({ ...row, currency: "GBP" }, stores), null, "no UK store reference");
  assert.equal(keepRow({ ...row, price: "9.99" }, stores), null, "under 60%: another size");
  assert.equal(keepRow({ ...row, price: "45.00" }, stores), null, "over 160%: a bundle");
  assert.equal(keepRow({ ...row, ean: "0012345678905" }, stores), null, "not a Korean barcode");
  assert.equal(keepRow({ ...row, currency: "JPY" }, stores), null, "no region charges it");
});

test("a feed price shows for three days after its last good read", () => {
  const file: PartnerPricesFile = { v: 1, feeds: { stylevana: { at: "2026-11-06T06:30:00Z", rows: 10, kept: 1 } }, prices: { stylevana: { US: { [EAN]: [1950, "https://www.stylevana.com/en_US/x.html"] } } } };
  assert.equal(partnerPriceIn(file, "stylevana", "US", EAN, Date.parse("2026-11-07T00:00:00Z"))?.p, 1950);
  assert.equal(partnerPriceIn(file, "stylevana", "UK", EAN, Date.parse("2026-11-07T00:00:00Z")), null);
  assert.equal(partnerPriceIn(file, "stylevana", "US", EAN, Date.parse("2026-11-10T00:00:00Z")), null);
  assert.equal(partnerPriceIn(null, "stylevana", "US", EAN), null);
});

test("ops monitor: quiet until a feed exists, amber on an error or a stale read", () => {
  const now = Date.parse("2026-11-06T12:00:00Z");
  assert.equal(judgePartnerFeeds(null, now).status, "ok");
  assert.equal(judgePartnerFeeds({ v: 1, feeds: { stylevana: { at: "2026-11-06T06:30:00Z", rows: 900, kept: 120 } }, prices: {} }, now).status, "ok");
  assert.equal(judgePartnerFeeds({ v: 1, feeds: { stylevana: { at: "2026-11-06T06:30:00Z", error: "feed answered HTTP 401" } }, prices: {} }, now).status, "warn");
  assert.equal(judgePartnerFeeds({ v: 1, feeds: { stylevana: { at: "2026-11-03T06:30:00Z", rows: 1, kept: 1 } }, prices: {} }, now).status, "warn");
});
