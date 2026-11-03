import { sitemapPart, sitemapParts, urlsetXml } from "@/lib/sitemap";

// One part of the sitemap (src/lib/sitemap.ts): /sitemaps/pages.xml, /sitemaps/products-1.xml … static, built at the release.
export const dynamic = "force-static";
export const dynamicParams = false;
export const generateStaticParams = () => sitemapParts().map((p) => ({ file: `${p}.xml` }));

export function GET(_req: Request, { params }: { params: { file: string } }) {
  const urls = sitemapPart(params.file.replace(/\.xml$/, ""));
  if (!urls) return new Response("Not found", { status: 404 });
  return new Response(urlsetXml(urls), { headers: { "Content-Type": "application/xml; charset=utf-8" } });
}
