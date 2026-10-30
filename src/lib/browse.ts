// The browser-side catalogue: search suggestions, the search results page and
// the filter/sort bars all read the same two static files, built with each
// release and served by the CDN (a keystroke or a filter never reaches a
// function):
//   /search-index.json   one IndexRow per product
//   /search-images.json  the products' photo paths, in the same order
// Client-safe: no node imports.
import type { RegionCode } from "@/site";
import { SEARCH_SYNONYMS } from "@/content/brands-ko";

export type IndexRow = [
  slug: string,
  name: string,
  cat: string,
  ean: string,
  /** lowest orderable price per region, minor units */
  prices: Partial<Record<RegionCode, number>>,
  brand: string,
  /** the brand's page slug, "" when it has none */
  brandPage: string,
  /** average stars × 10 (0: not rated) */
  rating: number,
  /** how many ratings */
  ratings: number,
  /** lib/ratings.ts popularity(), one decimal */
  pop: number,
  /** first seen, YYYY-MM-DD */
  first: string,
  /** search-only words (the brand in Hangul), may be "" */
  extra?: string,
];

let index: Promise<IndexRow[]> | null = null;
let images: Promise<string[]> | null = null;
export const loadIndex = () => (index ??= fetch("/search-index.json").then((r) => (r.ok ? r.json() : [])).catch(() => []));
export const loadImages = () => (images ??= fetch("/search-images.json").then((r) => (r.ok ? r.json() : [])).catch(() => []));

const SHOPIFY = "https://cdn.shopify.com/s/files/";
/** Shrink a store photo URL for the images file (most are Shopify's CDN). */
export function packImage(url: string | null): string {
  if (!url) return "";
  const u = url.replace(/([?&])width=\d+&?/, "$1").replace(/[?&]$/, "");
  return u.startsWith(SHOPIFY) ? u.slice(SHOPIFY.length).replace(/\?v=\d+$/, "") : u;
}
/** A photo URL at the width asked for (Shopify resizes on its CDN). */
export function imageUrl(packed: string | undefined, width: number): string | null {
  if (!packed) return null;
  const full = /^https?:\/\//.test(packed) ? packed : SHOPIFY + packed;
  return full.startsWith(SHOPIFY) ? `${full}${full.includes("?") ? "&" : "?"}width=${width}` : full;
}

/** Lower case, accents off, Hangul kept as whole syllables (NFKD splits a
 *  syllable into jamo, so it is put back together with NFC). */
export function norm(s: string) {
  return s
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .normalize("NFC")
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]+/g, " ")
    .trim();
}

/** Words a shopper types that mean a word our product names use: the
 *  Korean and ingredient pairs (content/brands-ko.ts) and a few of our own. */
export const SYNONYMS: Record<string, string[]> = {
  ...SEARCH_SYNONYMS,
  spf: ["sun"],
  moisturiser: [...(SEARCH_SYNONYMS.moisturiser ?? []), "cream"],
  cleanser: ["cleans"],
  facewash: ["cleans"],
  sheet: ["mask"],
};

/** Every query word must appear in the name, brand or extra words; names
 *  starting with the query rank first, then the popular ones. */
export function searchRows(rows: IndexRow[], q: string, limit = 8): IndexRow[] {
  const nq = norm(q);
  if (!nq) return [];
  if (/^\d{13}$/.test(nq)) return rows.filter((r) => r[3] === nq).slice(0, limit);
  const words = nq.split(" ");
  const hits: { r: IndexRow; score: number }[] = [];
  for (const r of rows) {
    const n = norm(r[1]);
    const hay = r[5] || r[11] ? `${n} ${norm(r[5] ?? "")} ${norm(r[11] ?? "")}` : n;
    if (!words.every((w) => hay.includes(w) || SYNONYMS[w]?.some((s) => hay.includes(s)))) continue;
    const score = (n.startsWith(nq) ? 0 : 10) + (n.split(" ").some((t) => t === words[words.length - 1]) ? 0 : 3) + n.length / 100 - Math.min(r[9] ?? 0, 20) * 0.15;
    hits.push({ r, score });
  }
  return hits.sort((a, b) => a.score - b.score).slice(0, limit).map((h) => h.r);
}

// ---------------------------------------------------------------- filters and sorts

export const SORTS = [
  { key: "popular", label: "Most popular" },
  { key: "rating", label: "Top rated" },
  { key: "price-asc", label: "Price: low to high" },
  { key: "price-desc", label: "Price: high to low" },
  { key: "name", label: "Name: A to Z" },
  { key: "new", label: "Newest" },
] as const;
export type SortKey = (typeof SORTS)[number]["key"];

export interface Filters {
  q: string;
  cat: string;
  brand: string;
  /** minimum stars, 0 for any */
  minStars: number;
  /** only what the region can buy today */
  inStock: boolean;
  /** price cap in the region's minor units, 0 for none */
  maxPrice: number;
  sort: SortKey;
}
export const NO_FILTERS: Filters = { q: "", cat: "", brand: "", minStars: 0, inStock: false, maxPrice: 0, sort: "popular" };

export function applyFilters(rows: IndexRow[], f: Filters, region: RegionCode): IndexRow[] {
  const nq = norm(f.q);
  let list = nq ? searchRows(rows, f.q, rows.length) : rows.slice();
  list = list.filter((r) => {
    if (f.cat && r[2] !== f.cat) return false;
    if (f.brand && r[5] !== f.brand) return false;
    if (f.minStars && (r[7] ?? 0) < f.minStars * 10) return false;
    const p = r[4][region];
    if (f.inStock && p == null) return false;
    if (f.maxPrice && (p == null || p > f.maxPrice)) return false;
    return true;
  });
  const price = (r: IndexRow) => r[4][region] ?? Infinity;
  const byName = (a: IndexRow, b: IndexRow) => a[1].localeCompare(b[1]);
  // With a query and the default sort, keep the search's own relevance order.
  if (nq && f.sort === "popular") return list;
  const cmp: Record<SortKey, (a: IndexRow, b: IndexRow) => number> = {
    popular: (a, b) => (b[9] ?? 0) - (a[9] ?? 0) || byName(a, b),
    rating: (a, b) => (b[7] ?? 0) - (a[7] ?? 0) || (b[8] ?? 0) - (a[8] ?? 0) || (b[9] ?? 0) - (a[9] ?? 0) || byName(a, b),
    "price-asc": (a, b) => price(a) - price(b) || byName(a, b),
    "price-desc": (a, b) => {
      const pa = a[4][region] ?? -1;
      const pb = b[4][region] ?? -1;
      return pb - pa || byName(a, b);
    },
    name: byName,
    new: (a, b) => (b[10] ?? "").localeCompare(a[10] ?? "") || (b[9] ?? 0) - (a[9] ?? 0) || byName(a, b),
  };
  return list.sort(cmp[f.sort]);
}
