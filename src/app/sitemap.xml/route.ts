import { sitemapIndexXml } from "@/lib/sitemap";

// The sitemap index (src/lib/sitemap.ts), a static file built at the release.
export const dynamic = "force-static";

export function GET() {
  return new Response(sitemapIndexXml(), { headers: { "Content-Type": "application/xml; charset=utf-8" } });
}
