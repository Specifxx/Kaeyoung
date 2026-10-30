import type { Metadata } from "next";
import Link from "next/link";
import { getBrands } from "@/lib/data";
import { PageHead } from "@/components/Section";

export const metadata: Metadata = {
  title: "Korean skincare brands: compare prices by brand",
  description: "Every Korean skincare and K-beauty brand K Young compares, A to Z, with how many of its products are priced across stores today.",
  alternates: { canonical: "/brands" },
};

export default function Brands() {
  const brands = getBrands();
  const byLetter = new Map<string, typeof brands>();
  for (const b of brands.slice().sort((a, b) => a.name.localeCompare(b.name, "en", { sensitivity: "base" }))) {
    const l = /^[a-z]/i.test(b.name) ? b.name[0].toUpperCase() : "#";
    byLetter.set(l, [...(byLetter.get(l) ?? []), b]);
  }
  return (
    <div className="mx-auto max-w-6xl px-4">
      <PageHead eyebrow="Brands" title="Korean skincare brands" sub={`${brands.length} brands with three or more products compared across stores. The most stocked first, then A to Z.`} />
      <section className="mb-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {brands.slice(0, 12).map((b) => (
          <Link key={b.slug} prefetch={false} href={`/brands/${b.slug}`} className="card tile-hover p-4">
            <p className="font-display text-lg font-medium">{b.name}</p>
            <p className="mt-0.5 text-sm text-soft">{b.products.length} products compared</p>
          </Link>
        ))}
      </section>
      <div className="columns-2 gap-8 sm:columns-3 lg:columns-4">
        {[...byLetter.entries()].map(([l, list]) => (
          <div key={l} className="mb-6 break-inside-avoid">
            <h2 className="eyebrow mb-2">{l}</h2>
            <ul className="space-y-1 text-sm">
              {list.map((b) => (
                <li key={b.slug}>
                  <Link prefetch={false} href={`/brands/${b.slug}`} className="hover:underline">
                    {b.name}
                  </Link>{" "}
                  <span className="text-soft">{b.products.length}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
