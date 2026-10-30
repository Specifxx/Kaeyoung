import type { Metadata } from "next";
import Link from "next/link";
import { GUIDES } from "@/lib/guides";
import { PageHead } from "@/components/Section";

export const metadata: Metadata = {
  title: "K-beauty price guides",
  description: "Price guides for Korean skincare, rebuilt every day from real store prices: the cheapest places to buy each kind of product, and where to buy K-beauty in your country.",
  alternates: { canonical: "/guides" },
};

export default function Guides() {
  const cats = GUIDES.filter((g) => g.kind === "cat");
  const regions = GUIDES.filter((g) => g.kind === "region");
  return (
    <div className="mx-auto max-w-6xl px-4">
      <PageHead eyebrow="Save" title="Price guides" sub="Rebuilt every day from the prices we check, so every number is a real store price." />
      <h2 className="h-display mb-4 text-xl">By country</h2>
      <div className="mb-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {regions.map((g) => (
          <Link key={g.slug} prefetch={false} href={`/guides/${g.slug}`} className="card tile-hover p-5">
            <p className="font-display text-lg font-medium leading-snug">{g.title}</p>
            <p className="mt-1.5 text-sm text-soft">{g.description}</p>
          </Link>
        ))}
      </div>
      <h2 className="h-display mb-4 text-xl">By product</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cats.map((g) => (
          <Link key={g.slug} prefetch={false} href={`/guides/${g.slug}`} className="card tile-hover p-5">
            <p className="font-display text-lg font-medium leading-snug">{g.title}</p>
            <p className="mt-1.5 text-sm text-soft">{g.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
