import { CAT_BY_KEY, REGION_BY_CODE } from "@/site";
import { getMeta, getProducts, productsOfCat } from "@/lib/data";
import { GUIDES, GUIDE_BY_SLUG, countryName } from "@/lib/guides";
import { guideImage, GUIDE_IMAGE_SIZE } from "@/lib/og/guide-image";
import { shareRows } from "@/lib/og/share-rows";

// One card per guide, drawn at the day's build like the pages (never per
// request): the guide's region (the US for a category guide) and the products
// whose price differs most between stores. src/lib/og/guide-image.tsx.
export const dynamicParams = false;
export const generateStaticParams = () => GUIDES.map((g) => ({ slug: g.slug }));
export const alt = "The same Korean skincare product at different K-beauty stores: cheapest and dearest price";
export const size = GUIDE_IMAGE_SIZE;
export const contentType = "image/png";

export default function Image({ params }: { params: { slug: string } }) {
  const g = GUIDE_BY_SLUG[params.slug];
  const asOf = getMeta()?.updatedAt ?? null;
  if (!g || g.kind === "cat") {
    const c = g ? CAT_BY_KEY[g.cat] : null;
    return guideImage({
      region: "US",
      title: c ? `${c.plural.replace(/^./, (x) => x.toUpperCase())}: one product, many prices` : "Same barcode, different price",
      kicker: "United States · USD",
      rows: shareRows("US", c ? productsOfCat(c.key) : getProducts(), 5),
      asOf,
    });
  }
  const r = REGION_BY_CODE[g.region];
  const n = g.region === "NZ" ? 2 : 3;
  return guideImage({
    region: g.region,
    title: `Same K-beauty, different price in ${countryName(g.region)}`,
    kicker: `${r.name} · ${r.currency}`,
    rows: shareRows(g.region, getProducts(), 5, n),
    asOf,
  });
}
