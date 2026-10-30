// Product photo paths in /search-index.json's order (lib/browse.ts), a second
// static file so the search box's first load stays small: suggestions show
// text first and photos once this arrives.
import { getProducts } from "@/lib/data";
import { packImage } from "@/lib/browse";

export const dynamic = "force-static";

export function GET() {
  return new Response(JSON.stringify(getProducts().map((f) => packImage(f.img))), {
    headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=3600, s-maxage=86400" },
  });
}
