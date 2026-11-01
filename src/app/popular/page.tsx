import type { Metadata } from "next";
import Link from "next/link";
import { CATEGORIES, REGIONS } from "@/site";
import { catCounts } from "@/lib/data";
import { popularNow, topRated } from "@/lib/ratings";
import { TileGrid } from "@/components/ProductTile";
import { PageHead, Section } from "@/components/Section";

export const metadata: Metadata = {
  title: "Popular Korean skincare: the most-loved K-beauty, compared",
  description: "The K-beauty products the most stores stock and shoppers rate highest, with every store's price side by side in the US, UK, Canada, Australia, New Zealand and Europe.",
  alternates: { canonical: "/popular" },
};

export default function Popular() {
  const best = topRated(null, 12);
  const counts = catCounts();
  return (
    <div className="mx-auto max-w-6xl px-4">
      <PageHead
        eyebrow="Popular"
        title="Popular Korean skincare"
        sub="The products the most K-beauty shops keep in stock, lifted by what KaeYoung shoppers rate them. Prices show for your region; change it at the top."
      />
      {REGIONS.map((r) => {
        const list = popularNow(r.code, 24);
        return (
          <div key={r.code} className={`rp rp-${r.code}`}>
            {list.length ? (
              <Section title={`Most popular ${r.phrase}`}>
                <TileGrid products={list} region={r.code} />
              </Section>
            ) : (
              <p className="card p-6 text-center text-soft">No store {r.phrase} has products in stock right now. Try another region.</p>
            )}
          </div>
        );
      })}
      {best.length >= 4 && (
        <Section title="Top rated by shoppers" sub="Three or more ratings, highest average first.">
          <TileGrid products={best} />
        </Section>
      )}
      <Section title="Popular by step">
        <ul className="flex flex-wrap gap-2">
          {CATEGORIES.filter((c) => counts[c.key] > 0).map((c) => (
            <li key={c.key}>
              <Link prefetch={false} href={`/${c.key}`} className="inline-flex items-center gap-2 rounded-full border border-line bg-card px-4 py-2 text-sm font-medium transition hover:border-soft">
                Popular {c.name.toLowerCase()} <span className="text-xs text-soft">{counts[c.key].toLocaleString("en-US")}</span>
              </Link>
            </li>
          ))}
        </ul>
      </Section>
    </div>
  );
}
