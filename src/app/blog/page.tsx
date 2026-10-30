import type { Metadata } from "next";
import Link from "next/link";
import { ALL_POSTS } from "@/content/blog";
import { CAT_TINT, CatIcon } from "@/components/Art";
import { PageHead } from "@/components/Section";
import { niceDate } from "@/lib/format";

export const metadata: Metadata = {
  title: "K-beauty price blog",
  description: "Korean skincare prices, read closely: brand stores against K-beauty shops, routines priced, sunscreen, and the biggest price gaps, from today's store prices.",
  alternates: { canonical: "/blog" },
};

export default function Blog() {
  return (
    <div className="mx-auto max-w-6xl px-4">
      <PageHead
        eyebrow="Blog"
        title="The K-beauty price blog"
        sub="Questions the prices answer: are brands' own stores cheaper, what a routine really costs, where sunscreen is cheapest. Every number comes from today's store prices."
      />
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ALL_POSTS.slice().sort((a, b) => b.date.localeCompare(a.date)).map((p) => (
          <li key={p.slug}>
            <Link prefetch={false} href={`/blog/${p.slug}`} className="card tile-hover group flex h-full flex-col overflow-hidden">
              <div className={`grid h-40 place-items-center ${CAT_TINT[p.art]}`}>
                <CatIcon cat={p.art} size={96} />
              </div>
              <div className="flex flex-1 flex-col p-5">
                <p className="eyebrow">{niceDate(p.date)}</p>
                <h2 className="h-display mt-1.5 text-xl leading-snug group-hover:text-accent-deep">{p.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-soft">{p.description}</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
