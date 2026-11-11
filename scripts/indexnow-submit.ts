// Pings IndexNow (Bing, Yandex, Seznam…) after each import with the hubs and
// every product first seen in the last 7 days. At most 1,000 URLs a day; Bing
// Webmaster Tools also reads the sitemap.
import { CATEGORIES, SITE } from "@/site";
import { getBrands, getProducts, needHubs } from "@/lib/data";
import { needIndexable, needPath } from "@/lib/needs";
import { GUIDES } from "@/lib/guides";
import { isIndexable } from "@/lib/index-tiers";
import { LIVE_POSTS } from "@/content/blog";

async function main() {
  const key = process.env.INDEXNOW_KEY;
  if (!key) return console.log("[indexnow] INDEXNOW_KEY not set: skipped");
  const site = SITE.url;
  const week = new Date(Date.now() - 7 * 86_400_000).toISOString().slice(0, 10);
  const hubs = ["", "/deals", "/black-friday", "/cyber-monday", "/boxing-day", "/january-sales", "/lunar-new-year", "/valentines-day", "/new", "/brands", "/guides", ...CATEGORIES.map((c) => `/${c.key}`)].map((p) => `${site}${p}`);
  const fresh = getProducts().filter((f) => f.first >= week && isIndexable(f)).map((f) => `${site}/product/${f.slug}`);
  const posts = ["/blog", ...LIVE_POSTS.map((p) => `/blog/${p.slug}`)].map((p) => `${site}${p}`);
  // The shop-by-need hubs, guides and the most stocked brands (Bing showed 0 pages for the site, 2026-11-11).
  const needs = ["/ingredients", "/skin-concerns", "/popular", ...needHubs().filter((h) => needIndexable(h.count)).map((h) => needPath(h.need)), ...GUIDES.map((g) => `/guides/${g.slug}`)].map((p) => `${site}${p}`);
  const brands = getBrands().slice().sort((a, b) => b.products.length - a.products.length).slice(0, 100).map((b) => `${site}/brands/${b.slug}`);
  const urls = [...new Set([...hubs, ...needs, ...posts, ...brands, ...fresh])].slice(0, 1000);
  const res = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ host: new URL(site).host, key, keyLocation: `${site}/indexnow-key.txt`, urlList: urls }),
  });
  console.log(`[indexnow] ${res.status} for ${urls.length} URLs`);
}
main();
