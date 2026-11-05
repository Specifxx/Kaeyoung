import { SITE } from "@/site";
import { getMeta, getProducts } from "@/lib/data";
import { heroPicks } from "@/lib/hero-picks";
import { homeImage, HOME_IMAGE_SIZE, photoDataUri } from "@/lib/og/home-image";

// The homepage's link preview, and every page's without one of its own: the
// brand line beside the two products the hero shows, with their photos,
// cheapest US price and store count (owner, 2026-11-05). Drawn at the day's
// build, never per request (no params: a static route). src/lib/og/home-image.tsx.
export const alt = "KaeYoung: Korean skincare prices compared across K-beauty stores, matched by barcode";
export const size = HOME_IMAGE_SIZE;
export const contentType = "image/png";

export default async function Image() {
  const picks = heroPicks("US", getProducts(), 2);
  const photos = await Promise.all(picks.map((p) => photoDataUri(p.f.img)));
  return homeImage({
    region: "US",
    picks: picks.map((pick, i) => ({ pick, photo: photos[i] })),
    asOf: getMeta()?.updatedAt ?? null,
    brand: SITE.name,
    line1: "Stay young.",
    line2: "Pay less.",
    blurb: "Korean skincare prices from real K-beauty stores, side by side. Matched by the barcode on the box.",
    domain: "kaeyoung.com",
  });
}
