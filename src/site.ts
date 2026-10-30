// K Young's one config file: name, host, regions, product categories and the
// sister sites. Store lists live in src/content/stores.ts.

export const SITE = {
  key: "ky",
  name: "K Young",
  domain: "kyoung.com",
  url: (process.env.NEXT_PUBLIC_SITE_URL || "https://kyoung.com").replace(/\/$/, ""),
  slogan: "Stay young.",
  tagline: "Compare Korean skincare prices across real K-beauty stores",
  description:
    "Compare Korean skincare and K-beauty prices across real K-beauty stores in the US, UK, Canada, Australia, New Zealand and Europe. Matched by the barcode on the box, updated daily.",
  /** Every contact address on the site (owner, 2026-10-30: the family inbox). */
  email: "compareempire@gmail.com",
  /** A product gets a page only when this many stores in one region sell it
   *  (comparing one shop is pointless, and it keeps data/ small). */
  minStoresPerRegion: 2,
} as const;

export type RegionCode = "US" | "UK" | "CA" | "AU" | "NZ" | "EU";

export interface Region {
  code: RegionCode;
  name: string;
  /** "in Australia" */
  phrase: string;
  currency: string;
  /** Shopify Markets country asked for on every request (prices follow the
   *  visitor's country, and GitHub's runners are in the US). */
  shopifyCountry: string;
  flag: string;
  ebayHost: string | null;
  amazonHost: string | null;
  /** IANA time zone prefixes that pick this region for a first-time visitor. */
  zones: string[];
}

// No Korea region (2026-10-30): shoppers in Korea pay domestic prices at
// Olive Young and Coupang, which publish no readable feed, and every shop we
// read sells abroad in foreign currencies. Korean-based shops that sell in
// US dollars are in the US region. See DECISIONS.md.
export const REGIONS: Region[] = [
  { code: "US", name: "United States", phrase: "in the US", currency: "USD", shopifyCountry: "US", flag: "🇺🇸", ebayHost: "www.ebay.com", amazonHost: "www.amazon.com", zones: ["America/"] },
  { code: "UK", name: "United Kingdom", phrase: "in the UK", currency: "GBP", shopifyCountry: "GB", flag: "🇬🇧", ebayHost: "www.ebay.co.uk", amazonHost: "www.amazon.co.uk", zones: ["Europe/London", "Europe/Belfast", "Europe/Dublin"] },
  { code: "CA", name: "Canada", phrase: "in Canada", currency: "CAD", shopifyCountry: "CA", flag: "🇨🇦", ebayHost: "www.ebay.ca", amazonHost: "www.amazon.ca", zones: ["America/Toronto", "America/Vancouver", "America/Edmonton", "America/Winnipeg", "America/Halifax", "America/St_Johns", "America/Regina", "America/Montreal"] },
  { code: "AU", name: "Australia", phrase: "in Australia", currency: "AUD", shopifyCountry: "AU", flag: "🇦🇺", ebayHost: "www.ebay.com.au", amazonHost: "www.amazon.com.au", zones: ["Australia/"] },
  { code: "NZ", name: "New Zealand", phrase: "in New Zealand", currency: "NZD", shopifyCountry: "NZ", flag: "🇳🇿", ebayHost: null, amazonHost: null, zones: ["Pacific/Auckland", "Pacific/Chatham"] },
  { code: "EU", name: "Europe", phrase: "in Europe", currency: "EUR", shopifyCountry: "DE", flag: "🇪🇺", ebayHost: "www.ebay.de", amazonHost: "www.amazon.de", zones: ["Europe/"] },
];

export const REGION_BY_CODE = Object.fromEntries(REGIONS.map((r) => [r.code, r])) as Record<RegionCode, Region>;

/** Pick a region from the browser's time zone; the more specific match wins
 *  (America/Toronto is Canada, not the US). */
export function regionForZone(zone: string | undefined | null): RegionCode {
  if (!zone) return "US";
  let best: { code: RegionCode; len: number } = { code: "US", len: 0 };
  for (const r of REGIONS) {
    for (const z of r.zones) {
      if (zone.startsWith(z) && z.length > best.len) best = { code: r.code, len: z.length };
    }
  }
  return best.code;
}

export type CatKey =
  | "sunscreen"
  | "cleansers"
  | "toners"
  | "serums"
  | "moisturisers"
  | "masks"
  | "eye-care"
  | "lip-care"
  | "makeup"
  | "body-hair"
  | "other";

export interface Category {
  key: CatKey;
  name: string;
  /** "Korean sunscreen" — what people search for */
  plural: string;
  /** One sentence for hub pages; facts only. */
  about: string;
}

/** In the order a routine runs; "other" is last and has no hub of its own in the nav. */
export const CATEGORIES: Category[] = [
  { key: "cleansers", name: "Cleansers", plural: "Korean cleansers", about: "Oil cleansers, cleansing balms and foams: the first and second step of a Korean double cleanse." },
  { key: "toners", name: "Toners & pads", plural: "Korean toners", about: "Hydrating and exfoliating toners, toner pads and mists, used after cleansing." },
  { key: "serums", name: "Serums & essences", plural: "Korean serums and essences", about: "Serums, essences and ampoules: concentrated treatments for hydration, brightening, acne and repair." },
  { key: "moisturisers", name: "Moisturisers", plural: "Korean moisturisers", about: "Creams, gel creams, lotions and emulsions that seal in the steps before them." },
  { key: "sunscreen", name: "Sunscreen", plural: "Korean sunscreen", about: "Korean sun creams, sticks and sun serums, known for light textures and no white cast." },
  { key: "masks", name: "Masks", plural: "Korean face masks", about: "Sheet masks, sleeping masks, wash-off and collagen masks." },
  { key: "eye-care", name: "Eye care", plural: "Korean eye creams", about: "Eye creams, eye serums and hydrogel eye patches." },
  { key: "lip-care", name: "Lip care", plural: "Korean lip care", about: "Lip balms, lip masks and lip oils." },
  { key: "makeup", name: "Makeup", plural: "Korean makeup", about: "Cushion compacts, tints, BB creams, primers and other Korean makeup." },
  { key: "body-hair", name: "Body & hair", plural: "Korean body and hair care", about: "Body washes, lotions, shampoos, hair treatments and hand creams." },
  { key: "other", name: "More K-beauty", plural: "more Korean beauty", about: "Sets, tools and everything else K-beauty stores sell under one barcode." },
];

export const CAT_BY_KEY = Object.fromEntries(CATEGORIES.map((c) => [c.key, c])) as Record<CatKey, Category>;

/** The rest of Compare Empire, linked from every footer (family-links rule:
 *  descriptive anchors, plain followed links, footer only). K Young carries
 *  no Compare branding (owner, 2026-10-30), so the list is headed "Sister sites". */
export const SISTER_SITES: { name: string; url: string; anchor: string }[] = [
  { name: "RiftCompare", url: "https://riftcompare.com", anchor: "Riftbound card prices" },
  { name: "OP Compare", url: "https://opcompare.app", anchor: "One Piece card prices" },
  { name: "DexCompare", url: "https://dexcompare.app", anchor: "Pokémon sealed prices" },
  { name: "MTG Compare", url: "https://mtgcompare.app", anchor: "Magic: The Gathering sealed prices" },
  { name: "Gundam Compare", url: "https://gundamcompare.com", anchor: "Gundam card prices" },
  { name: "Lorcana Compare", url: "https://lorcanacompare.com", anchor: "Lorcana card prices" },
  { name: "YGO Compare", url: "https://ygocompare.com", anchor: "Yu-Gi-Oh! card prices" },
  { name: "WargameCompare", url: "https://wargamecompare.com", anchor: "Miniature wargame prices" },
  { name: "FigureCompare", url: "https://figurecompare.com", anchor: "Anime figure prices" },
  { name: "CamCompare", url: "https://www.camcompare.app", anchor: "Camera and lens prices" },
  { name: "Compare Empire", url: "https://compareempire.com", anchor: "Australian tech prices" },
];
