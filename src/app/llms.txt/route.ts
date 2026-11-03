import { CATEGORIES, REGIONS, SITE } from "@/site";
import { getBrands, getProducts } from "@/lib/data";
import { GUIDES } from "@/lib/guides";
import { LIVE_POSTS } from "@/content/blog";

// /llms.txt (llmstxt.org): a plain map of the site for AI answer engines (SEO audit, 2026-11-03), built at the release
// from the same data as the pages.
export const dynamic = "force-static";

export function GET() {
  const md = [
    `# ${SITE.name}`,
    "",
    `> ${SITE.description} ${getProducts().length.toLocaleString("en-US")} products compared. Prices are each store's own, in its own currency, never converted. Only specialist K-beauty stores, never open marketplaces.`,
    "",
    "## Main pages",
    `- [Popular K-beauty](${SITE.url}/popular): stocked by the most stores`,
    `- [Deals](${SITE.url}/deals): same barcode, at least 10% cheaper at one store`,
    `- [Brands](${SITE.url}/brands)`,
    `- [Stores compared](${SITE.url}/stores)`,
    `- [How we pick stores](${SITE.url}/how-we-pick-stores)`,
    "",
    "## Shop by step",
    ...CATEGORIES.map((c) => `- [${c.name}](${SITE.url}/${c.key}): ${c.about}`),
    "",
    "## Price guides",
    ...GUIDES.map((g) => `- [${g.title}](${SITE.url}/guides/${g.slug}): ${g.description}`),
    "",
    "## Top brands",
    ...getBrands().slice(0, 40).map((b) => `- [${b.name} prices](${SITE.url}/brands/${b.slug})`),
    "",
    "## Blog",
    ...LIVE_POSTS.map((p) => `- [${p.title}](${SITE.url}/blog/${p.slug}): ${p.description}`),
    "",
    `Regions: ${REGIONS.map((r) => r.name).join(", ")}.`,
    "",
  ].join("\n");
  return new Response(md, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
