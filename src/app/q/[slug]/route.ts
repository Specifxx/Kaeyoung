// The quick view's data: one small static JSON per product, written at build
// (force-static, every slug prerendered), so opening a quick view reads a file
// from the CDN, never a function. Rows come from priceRows(), the same rows the
// product page draws: eBay first, Amazon second, then the stores by price.
import { REGIONS } from "@/site";
import { getEbay, getProduct, getProducts, regionsOf } from "@/lib/data";
import { priceRows } from "@/components/PriceTable";
import { shareTexts } from "@/lib/share-texts";

export const dynamic = "force-static";
export const dynamicParams = false;
export function generateStaticParams() {
  return getProducts().map((f) => ({ slug: f.slug }));
}

export function GET(_req: Request, { params }: { params: { slug: string } }) {
  const f = getProduct(params.slug);
  if (!f) return new Response("Not found", { status: 404 });
  const ebay = getEbay()[f.ean] ?? {};
  const sold = new Set(regionsOf(f));
  const rows = Object.fromEntries(REGIONS.map((r) => [r.code, sold.has(r.code) ? priceRows(f, r.code, ebay[r.code], "quickview") : null]));
  // The share messages per region (lib/share-texts.ts), written here at build like the rest.
  return Response.json({ slug: f.slug, size: f.size, ean: f.ean, rows, share: shareTexts(f) });
}
