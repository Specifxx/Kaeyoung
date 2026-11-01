// Every outbound link is tagged here, at build time (there is no /go route:
// a click costs no function). Tag format, as on every sister site:
// `ky-<region>-<placement>-<ean>` in EPN's `customid` and Amazon's
// `ascsubtag`, so the earnings reports split by site, market and placement.
// Store links get utm_source so a store sees what we send it (the start of a
// partner-code conversation).
import { REGION_BY_CODE, SITE, type RegionCode } from "@/site";
import { STORE_BY_ID } from "@/content/stores";

/** One EPN campaign for every site in the family, hard-coded (owner,
 *  2026-10-30); no variable overrides it. The customid tag (`ky-…`) tells the
 *  sites apart in the reports. */
export const EBAY_CAMPAIGN_ID = "5339155912";

/** Amazon Associates: each marketplace is its own program and tag. The
 *  family's US (riftcompare-20) and Australian (compareempire-22) tags are the
 *  defaults; AMAZON_TAG_<REGION> sets KaeYoung's own or another marketplace's.
 *  A region without a tag shows no Amazon row (a US tag earns nothing on
 *  amazon.com.au). */
export function amazonTag(region: RegionCode): string | null {
  const own = process.env[`AMAZON_TAG_${region}`];
  if (own) return own;
  if (region === "US") return "riftcompare-20";
  if (region === "AU") return "compareempire-22";
  return null;
}

const EBAY_ROTATION: Record<string, string> = {
  "ebay.com": "711-53200-19255-0",
  "ebay.co.uk": "710-53481-19255-0",
  "ebay.com.au": "705-53470-19255-0",
  "ebay.ca": "706-53473-19255-0",
  "ebay.de": "707-53477-19255-0",
};

export function subId(...parts: (string | number | null | undefined)[]): string {
  return (
    [SITE.key, ...parts]
      .filter((x) => x != null && x !== "")
      .join("-")
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, "-")
      .slice(0, 60) || SITE.key
  );
}

function host(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

export function ebayAffiliateUrl(url: string, sub: string): string {
  try {
    const u = new URL(url);
    const rot = EBAY_ROTATION[host(url)];
    if (!rot) return url;
    u.searchParams.set("mkevt", "1");
    u.searchParams.set("mkcid", "1");
    u.searchParams.set("mkrid", rot);
    u.searchParams.set("campid", EBAY_CAMPAIGN_ID);
    u.searchParams.set("toolid", "10001");
    u.searchParams.set("customid", sub);
    return u.toString();
  } catch {
    return url;
  }
}

export function storeUrl(storeId: string, url: string): string {
  try {
    const u = new URL(url);
    const store = STORE_BY_ID[storeId];
    const aff = store?.affiliate && process.env[store.affiliate.envVar];
    if (store?.affiliate && aff) u.searchParams.set(store.affiliate.param, aff);
    if (!u.searchParams.has("utm_source")) {
      u.searchParams.set("utm_source", SITE.domain);
      u.searchParams.set("utm_medium", "referral");
    }
    return u.toString();
  } catch {
    return url;
  }
}

/** True when a click on this store's links can earn (shown as "Paid link"). */
export function storePays(storeId: string): boolean {
  const store = STORE_BY_ID[storeId];
  return !!(store?.affiliate && process.env[store.affiliate.envVar]);
}

/** The eBay a region's visitors shop on: its own, or eBay Australia for New
 *  Zealand (no eBay NZ in the Partner Network; Australian sellers ship there). */
export function ebayShopHost(region: RegionCode): string | null {
  return REGION_BY_CODE[region].ebayHost ?? (region === "NZ" ? "www.ebay.com.au" : null);
}

/** eBay search, Buy It Now, new, cheapest first, in the region's eBay. */
export function ebaySearchUrl(query: string, region: RegionCode, sub: string): string | null {
  const h = ebayShopHost(region);
  if (!h) return null;
  const u = `https://${h}/sch/i.html?_nkw=${encodeURIComponent(query)}&LH_BIN=1&LH_ItemCondition=1000&_sop=15`;
  return ebayAffiliateUrl(u, sub);
}

export function amazonSearchUrl(query: string, region: RegionCode, sub: string): string | null {
  const tag = amazonTag(region);
  const h = REGION_BY_CODE[region].amazonHost;
  if (!tag || !h) return null;
  return `https://${h}/s?k=${encodeURIComponent(query)}&tag=${encodeURIComponent(tag)}&ascsubtag=${encodeURIComponent(sub)}`;
}

/**
 * Beauty retailers that sell the same products and pay through their own
 * programs or a network (YesStyle, Stylevana, Olive Young Global, iHerb,
 * LOOKFANTASTIC, Cult Beauty). None has a price feed we can read, so each is
 * a labelled search link pinned above the stores, shown ONLY once its env var
 * holds our tracking link template, set after the program accepts us (see
 * the Chrome setup prompt). The template carries {url} (the encoded search
 * URL, for network deep links) or {q} (the encoded query, for programs that
 * take a search URL plus a code):
 *   AFF_YESSTYLE="https://www.yesstyle.com/en/list.html?q={q}&rco=OURCODE"
 *   AFF_OLIVEYOUNG="https://invol.co/aff_m?offer_id=…&aff_id=…&url={url}"
 */
export interface Partner {
  key: string;
  name: string;
  envVar: string;
  regions: RegionCode[];
  search: (q: string) => string;
  note: string;
  /** Shown in every region it ships to even before its program accepts us,
   *  as a plain unpaid search link (a visitor's request, 2026-10-30: YesStyle
   *  and Stylevana are where K-beauty buyers check first). */
  always?: boolean;
}

export const PARTNERS: Partner[] = [
  { key: "yesstyle", name: "YesStyle", envVar: "AFF_YESSTYLE", regions: ["US", "UK", "CA", "AU", "NZ", "EU"], search: (q) => `https://www.yesstyle.com/en/list.html?q=${q}`, note: "ships from Hong Kong", always: true },
  { key: "stylevana", name: "Stylevana", envVar: "AFF_STYLEVANA", regions: ["US", "UK", "CA", "AU", "NZ", "EU"], search: (q) => `https://www.stylevana.com/en_US/catalogsearch/result/?q=${q}`, note: "ships worldwide", always: true },
  { key: "oliveyoung", name: "Olive Young Global", envVar: "AFF_OLIVEYOUNG", regions: ["US", "UK", "CA", "AU", "NZ", "EU"], search: (q) => `https://global.oliveyoung.com/display/search?query=${q}`, note: "ships from Korea" },
  { key: "iherb", name: "iHerb", envVar: "AFF_IHERB", regions: ["US", "UK", "CA", "AU", "NZ", "EU"], search: (q) => `https://www.iherb.com/search?kw=${q}`, note: "ships worldwide" },
  { key: "lookfantastic", name: "LOOKFANTASTIC", envVar: "AFF_LOOKFANTASTIC", regions: ["UK"], search: (q) => `https://www.lookfantastic.com/search?q=${q}`, note: "UK retailer" },
  { key: "cultbeauty", name: "Cult Beauty", envVar: "AFF_CULTBEAUTY", regions: ["UK"], search: (q) => `https://www.cultbeauty.co.uk/search?q=${q}`, note: "UK retailer" },
];

/** A partner's tracked search link for a query, or null while its template is unset. */
export function partnerUrl(p: Partner, query: string, sub: string, env: Record<string, string | undefined> = process.env): string | null {
  const tpl = env[p.envVar];
  if (!tpl) return null;
  const q = encodeURIComponent(query);
  return tpl
    .replace("{url}", encodeURIComponent(p.search(q)))
    .replace("{q}", q)
    .replace("{sub}", encodeURIComponent(sub));
}

/** The retailer rows a region shows today: those whose tracking template is
 *  set (paid), plus the `always` ones as plain search links (unpaid). */
export function partnersFor(region: RegionCode, query: string, sub: string, env: Record<string, string | undefined> = process.env): { p: Partner; href: string; paid: boolean }[] {
  return PARTNERS.filter((p) => p.regions.includes(region)).flatMap((p): { p: Partner; href: string; paid: boolean }[] => {
    const href = partnerUrl(p, query, sub, env);
    if (href) return [{ p, href, paid: true }];
    return p.always ? [{ p, href: p.search(encodeURIComponent(query)), paid: false }] : [];
  });
}
