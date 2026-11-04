import { CATEGORIES, SITE } from "@/site";
import { getBrands, getMeta, getProducts, productsOfCat } from "@/lib/data";
import { inSitemap } from "@/lib/index-tiers";
import { GUIDES } from "@/lib/guides";
import { LIVE_POSTS } from "@/content/blog";

// Only pages worth landing on (src/lib/index-tiers.ts): hubs, brands, guides,
// and products someone can order with 2+ stores compared, stocked widely
// (inSitemap). Sold-out products stay reachable but noindex, and out of here.
// Split into an index of parts (SEO audit 2026-11-03: one 10,405-URL file): `pages`, then products in chunks of
// PRODUCTS_PER_FILE, widely stocked first. Served by the static routes /sitemap.xml and /sitemaps/<part>.xml.
export interface SitemapUrl {
  url: string;
  lastModified: string;
  priority: number;
}
export const PRODUCTS_PER_FILE = 5000;
/** Products on one category hub page (CatHub's PER_PAGE). */
export const HUB_PER_PAGE = 48;
const pageCount = (cat: (typeof CATEGORIES)[number]["key"]) => Math.max(1, Math.ceil(productsOfCat(cat).length / HUB_PER_PAGE));

const updated = () => getMeta()?.updatedAt ?? new Date().toISOString();
const u = (p: string, priority: number): SitemapUrl => ({ url: `${SITE.url}${p}`, lastModified: updated(), priority });

const productUrls = () => getProducts().filter(inSitemap).map((f) => u(`/product/${f.slug}`, 0.7));

export function sitemapParts(): string[] {
  const n = Math.max(1, Math.ceil(productUrls().length / PRODUCTS_PER_FILE));
  return ["pages", ...Array.from({ length: n }, (_, i) => `products-${i + 1}`)];
}

export function sitemapPart(part: string): SitemapUrl[] | null {
  if (part === "pages") return pageUrls();
  const m = /^products-(\d+)$/.exec(part);
  if (!m) return null;
  const i = Number(m[1]) - 1;
  const chunk = productUrls().slice(i * PRODUCTS_PER_FILE, (i + 1) * PRODUCTS_PER_FILE);
  return chunk.length ? chunk : null;
}

/** Every URL, in index order (IndexNow, tests). */
export const allSitemapUrls = () => sitemapParts().flatMap((p) => sitemapPart(p) ?? []);

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function urlsetXml(urls: SitemapUrl[]): string {
  const rows = urls.map((x) => `<url><loc>${esc(x.url)}</loc><lastmod>${esc(x.lastModified)}</lastmod><priority>${x.priority}</priority></url>`);
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${rows.join("\n")}\n</urlset>\n`;
}

export function sitemapIndexXml(): string {
  const rows = sitemapParts().map((p) => `<sitemap><loc>${SITE.url}/sitemaps/${p}.xml</loc><lastmod>${esc(updated())}</lastmod></sitemap>`);
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${rows.join("\n")}\n</sitemapindex>\n`;
}

function pageUrls(): SitemapUrl[] {
  return [
    u("/", 1),
    ...CATEGORIES.map((c) => u(`/${c.key}`, 0.9)),
    ...CATEGORIES.flatMap((c) => Array.from({ length: pageCount(c.key) - 1 }, (_, i) => u(`/${c.key}/page/${i + 2}`, 0.4))),
    u("/popular", 0.8),
    u("/deals", 0.8),
    u("/black-friday", 0.8),
    ...["/boxing-day", "/january-sales", "/lunar-new-year", "/valentines-day"].map((p) => u(p, 0.7)),
    u("/basket", 0.5),
    u("/new", 0.7),
    u("/brands", 0.8),
    ...getBrands().map((b) => u(`/brands/${b.slug}`, 0.8)),
    u("/guides", 0.7),
    ...GUIDES.map((g) => u(`/guides/${g.slug}`, 0.8)),
    u("/blog", 0.6),
    ...LIVE_POSTS.map((p) => u(`/blog/${p.slug}`, 0.7)),
    u("/stores", 0.6),
    u("/widgets", 0.4),
    u("/price-report", 0.6),
    u("/about", 0.3),
    u("/creators", 0.4),
    u("/contact", 0.2),
    u("/how-we-pick-stores", 0.3),
    u("/list-your-store", 0.3),
  ];
}
