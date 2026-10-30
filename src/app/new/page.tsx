import type { Metadata } from "next";
import { REGIONS } from "@/site";
import { newestIn } from "@/lib/data";
import { TileGrid } from "@/components/ProductTile";
import { PageHead } from "@/components/Section";

export const metadata: Metadata = {
  title: "New Korean skincare in stores",
  description: "K-beauty products that just appeared at two or more stores, newest first, with every store's price compared.",
  alternates: { canonical: "/new" },
};

export default function NewProducts() {
  return (
    <div className="mx-auto max-w-6xl px-4">
      <PageHead eyebrow="Save" title="New arrivals" sub="Products that most recently appeared at two or more stores, newest first." />
      {REGIONS.map((r) => {
        const list = newestIn(r.code, 60);
        return (
          <div key={r.code} className={`rp rp-${r.code}`}>
            {list.length ? <TileGrid products={list} region={r.code} /> : <p className="card p-6 text-center text-soft">Nothing new {r.phrase} yet.</p>}
          </div>
        );
      })}
    </div>
  );
}
