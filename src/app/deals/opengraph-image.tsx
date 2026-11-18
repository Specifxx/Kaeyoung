import { REGION_BY_CODE } from "@/site";
import { dealsIn, getMeta, getProducts } from "@/lib/data";
import { guideImage, GUIDE_IMAGE_SIZE } from "@/lib/og/guide-image";
import { shareRows } from "@/lib/og/share-rows";

// The deals page's link preview (owner, 2026-11-18: "we need more shareable artefacts"): today's biggest gaps between
// the cheapest and the dearest store for the same barcode, in the US, from the page's own deals (dealsIn).
// Drawn at the day's build like the pages (no params: a static route), the guide card's look (lib/og/guide-image.tsx).
export const alt = "K-beauty deals today: the same product for less at another store";
export const size = GUIDE_IMAGE_SIZE;
export const contentType = "image/png";

export default function Image() {
  const region = "US" as const;
  const r = REGION_BY_CODE[region];
  // The deals list first; on a thin day (fewer than three gaps a card shows) the same rule over every product, two stores up.
  const fromDeals = shareRows(region, dealsIn(region, 60).map((d) => d.f), 5);
  const rows = fromDeals.length >= 3 ? fromDeals : shareRows(region, getProducts(), 5, 2);
  return guideImage({
    region,
    title: "K-beauty deals today",
    kicker: `${r.name} · ${r.currency}`,
    rows,
    asOf: getMeta()?.updatedAt ?? null,
  });
}
