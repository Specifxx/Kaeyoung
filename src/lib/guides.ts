// The price guides: pages written from the day's data, never by hand, so
// every number on them is a real store price (the Compare Empire AU guide
// playbook). Two kinds: per category ("Korean sunscreen prices compared") and
// per region ("Where to buy Korean skincare in Australia").
import { CATEGORIES, REGIONS, type CatKey, type RegionCode } from "@/site";

export type Guide =
  | { slug: string; kind: "cat"; cat: CatKey; title: string; description: string }
  | { slug: string; kind: "region"; region: RegionCode; title: string; description: string };

const COUNTRY: Record<RegionCode, string> = { US: "the US", UK: "the UK", CA: "Canada", AU: "Australia", NZ: "New Zealand", EU: "Europe" };

export const GUIDES: Guide[] = [
  ...CATEGORIES.filter((c) => c.key !== "other").map(
    (c): Guide => ({
      slug: `cheapest-${c.key}`,
      kind: "cat",
      cat: c.key,
      title: `Cheapest ${c.plural} today: the most-stocked, compared`,
      description: `The ${c.plural} most K-beauty stores carry, with the lowest price, the cheapest store and the saving in your region. From today's prices.`,
    }),
  ),
  ...REGIONS.map(
    (r): Guide => ({
      slug: `buy-korean-skincare-${COUNTRY[r.code].replace(/^the /, "").toLowerCase().replace(/\s+/g, "-")}`,
      kind: "region",
      region: r.code,
      title: `Where to buy Korean skincare in ${COUNTRY[r.code]}`,
      description: `The K-beauty stores that sell in ${COUNTRY[r.code]} in ${r.currency}, which one is cheapest for the best-known products, and today's biggest savings.`,
    }),
  ),
];

export const GUIDE_BY_SLUG = Object.fromEntries(GUIDES.map((g) => [g.slug, g])) as Record<string, Guide>;
export const countryName = (r: RegionCode) => COUNTRY[r];
