import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CATEGORIES } from "@/site";
import { brandKo, getBrand, getBrands, storeCount } from "@/lib/data";
import { TileGrid } from "@/components/ProductTile";
import { PageHead } from "@/components/Section";
import { Browse } from "@/components/Browse";

export const dynamicParams = false;
export function generateStaticParams() {
  return getBrands().map((b) => ({ slug: b.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const b = getBrand(params.slug);
  if (!b) return {};
  const stores = new Set(b.products.flatMap((f) => Object.values(f.offers).flatMap((o) => (o ?? []).map((x) => x.s)))).size;
  return {
    title: `${b.name} prices: compare ${b.products.length} products across ${stores} stores`,
    description: `Compare ${b.name} prices across ${stores} K-beauty stores in the US, UK, Canada, Australia, New Zealand and Europe. ${b.products.length} products, matched by barcode, updated daily.`,
    alternates: { canonical: `/brands/${b.slug}` },
  };
}

export default function BrandPage({ params }: { params: { slug: string } }) {
  const b = getBrand(params.slug);
  if (!b) notFound();
  const list = b.products.slice().sort((x, y) => storeCount(y) - storeCount(x) || x.name.localeCompare(y.name));
  const cats = CATEGORIES.filter((c) => list.some((f) => f.cat === c.key));
  return (
    <div className="mx-auto max-w-6xl px-4">
      <nav aria-label="Breadcrumb" className="mt-5 text-sm text-soft">
        <Link prefetch={false} href="/brands" className="hover:text-ink">Brands</Link>
        <span className="mx-1.5">/</span>
        <span className="text-ink">{b.name}</span>
      </nav>
      <PageHead
        eyebrow="Brand"
        title={`${b.name} prices`}
        sub={`${brandKo(b.name) ? `${b.name} (${brandKo(b.name)} in Korean): ` : ""}${list.length} ${b.name} products compared across K-beauty stores, matched by barcode, size by size. Most widely stocked first; prices show for your region.`}
      />
      <Browse brand={b.slug}>
      {cats.map((c) => {
        const inCat = list.filter((f) => f.cat === c.key);
        return (
          <section key={c.key} className="mb-10">
            <h2 className="h-display mb-4 text-xl">
              {c.name} <span className="text-base text-soft">({inCat.length})</span>
            </h2>
            <TileGrid products={inCat} />
          </section>
        );
      })}
      </Browse>
    </div>
  );
}
