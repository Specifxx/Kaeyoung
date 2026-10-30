// The basket's data for one region: one static JSON per region and release
// (force-static, the six regions prerendered), so comparing a basket reads a
// file from the CDN and never runs a function. Offers are listed in the same
// order as /search-index.json's rows, so the browser joins the two by position.
import { REGIONS, type RegionCode } from "@/site";
import { basketData } from "@/lib/basket-data";

export const dynamic = "force-static";
export const dynamicParams = false;
export function generateStaticParams() {
  return REGIONS.map((r) => ({ region: r.code.toLowerCase() }));
}

export function GET(_req: Request, { params }: { params: { region: string } }) {
  const r = REGIONS.find((x) => x.code.toLowerCase() === params.region);
  if (!r) return new Response("Not found", { status: 404 });
  return new Response(JSON.stringify(basketData(r.code as RegionCode)), {
    headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=3600, s-maxage=86400" },
  });
}
