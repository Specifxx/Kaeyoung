// The browser's product index (lib/browse.ts): one static JSON file per
// release (built at build time, served by the CDN), so search suggestions,
// the search page and the filter bars never run a function.
import { indexRows } from "@/lib/search-index";

export const dynamic = "force-static";

export function GET() {
  return new Response(JSON.stringify(indexRows()), {
    headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=3600, s-maxage=86400" },
  });
}
