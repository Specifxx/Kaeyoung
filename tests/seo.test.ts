// SEO audit (2026-11-03): split sitemap, homepage title, breadcrumbs and site schema, alt text, llms.txt.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { PRODUCTS_PER_FILE, allSitemapUrls, sitemapIndexXml, sitemapPart, sitemapParts } from "../src/lib/sitemap";
import { breadcrumbLd } from "../src/lib/seo";
import { SITE } from "../src/site";

const read = (p: string) => readFileSync(p, "utf8");
const walk = (d: string): string[] => readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : [join(d, f)]));

test("the sitemap is an index of parts, none over the chunk size, no URL twice", () => {
  const index = sitemapIndexXml();
  assert.match(index, /<sitemapindex/);
  for (const p of sitemapParts()) {
    assert.ok(index.includes(`${SITE.url}/sitemaps/${p}.xml`), p);
    const n = sitemapPart(p)!.length;
    assert.ok(n > 0 && n <= PRODUCTS_PER_FILE, `${p}: ${n}`);
  }
  const urls = allSitemapUrls().map((x) => x.url);
  assert.equal(new Set(urls).size, urls.length);
  assert.equal(sitemapPart("nope"), null);
});

test("homepage title fits 60 characters, keyword first, brand last", () => {
  const t = read("src/app/page.tsx").match(/absolute: `([^`]+)`/)![1].replace("${SITE.name}", SITE.name);
  assert.ok(t.length <= 60, t);
  assert.ok(t.endsWith(SITE.name));
  assert.match(t, /^Korean skincare/i);
});

test("breadcrumbs start at Home with absolute URLs", () => {
  const b = breadcrumbLd([{ name: "Brands", path: "/brands" }]);
  assert.equal(b.itemListElement[0].item, SITE.url);
  assert.equal(b.itemListElement[1].item, `${SITE.url}/brands`);
});

test("deep pages carry breadcrumbs; the homepage carries Organization, WebSite and FAQPage", () => {
  for (const f of ["src/app/product/[slug]/page.tsx", "src/app/brands/[slug]/page.tsx", "src/components/CatHub.tsx", "src/app/guides/[slug]/page.tsx", "src/app/blog/[slug]/page.tsx"]) {
    assert.match(read(f), /breadcrumbLd|<Crumbs/, f);
  }
  assert.match(read("src/app/page.tsx"), /siteLd\(\)/);
  assert.match(read("src/app/page.tsx"), /faqLd\(FAQ\)/);
});

test("no product photo has empty alt text", () => {
  for (const f of walk("src").filter((f) => f.endsWith(".tsx") && !f.endsWith("QuickView.tsx"))) assert.ok(!/<img[^>]*alt=""/.test(read(f)), f);
});

test("llms.txt is a static route", () => {
  assert.match(read("src/app/llms.txt/route.ts"), /force-static/);
});
