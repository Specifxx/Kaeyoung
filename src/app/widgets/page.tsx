import type { Metadata } from "next";
import Link from "next/link";
import { CATEGORIES, SITE } from "@/site";
import { popular } from "@/lib/data";
import { linkBadge } from "@/lib/link-badges";
import { PageHead } from "@/components/Section";

// Free link badges (DECISIONS.md, "Free link badges", 2026-11-02): what outreach offers instead of asking for a link.
// Plain HTML only, prerendered at the daily build like every page.
export const metadata: Metadata = {
  title: "Free K-beauty price links for blogs and stores",
  description: "Free plain-HTML badges that send your readers to a Korean skincare price comparison across real K-beauty stores in their region. No script, no signup.",
  alternates: { canonical: "/widgets" },
};

function Snippet({ html }: { html: string }) {
  return (
    <div className="card mt-3 p-4">
      <div dangerouslySetInnerHTML={{ __html: html }} />
      <pre className="mt-3 overflow-x-auto rounded-lg bg-black/5 p-3 text-xs"><code>{html}</code></pre>
    </div>
  );
}

export default function Widgets() {
  const p = popular(1)[0];
  const cats = CATEGORIES.filter((c) => ["cleansers", "moisturisers", "sunscreen"].includes(c.key));
  return (
    <div className="mx-auto max-w-3xl px-4 pb-16">
      <PageHead
        eyebrow="Free for your site"
        title="Free K-beauty price links"
        sub={<>For skincare blogs, routine guides, reviews and stores: one line of HTML that sends readers to today&apos;s prices across real K-beauty stores in their region. No script, no image, no tracking, free.</>}
      />
      <section>
        <h2 className="text-xl font-semibold">A product you review</h2>
        <p className="mt-1 text-sm text-soft">Change the address to any product page on {SITE.name} (the part after <code>/product/</code>) and the text to its name.</p>
        <Snippet html={linkBadge(`${SITE.url}/product/${p?.slug ?? "PRODUCT-SLUG"}`, `${p?.name ?? "Product name"} prices compared on ${SITE.name}`)} />
      </section>
      <section className="mt-8">
        <h2 className="text-xl font-semibold">A whole category</h2>
        {(cats.length ? cats : CATEGORIES.slice(0, 3)).map((c) => <Snippet key={c.key} html={linkBadge(`${SITE.url}/${c.key}`, `${c.plural} prices compared on ${SITE.name}`)} />)}
      </section>
      <section className="mt-8">
        <h2 className="text-xl font-semibold">For stores we compare</h2>
        <p className="mt-1 text-sm text-soft">Tell customers your prices are compared openly. <Link prefetch={false} href="/stores" className="underline">Stores we read</Link>.</p>
        <Snippet html={linkBadge(`${SITE.url}/stores`, `Our K-beauty prices are compared on ${SITE.name}`)} />
      </section>
    </div>
  );
}
