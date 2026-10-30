import type { Metadata } from "next";
import { REGIONS } from "@/site";
import { dealsIn } from "@/lib/data";
import { TileGrid } from "@/components/ProductTile";
import { PageHead } from "@/components/Section";

export const metadata: Metadata = {
  title: "K-beauty deals today",
  description: "Korean skincare where the cheapest store is at least 10% under the dearest, in stock today. Same barcode, same size, per region, updated daily.",
  alternates: { canonical: "/deals" },
};

export default function Deals() {
  return (
    <div className="mx-auto max-w-6xl px-4">
      <PageHead
        eyebrow="Save"
        title="K-beauty deals today"
        sub="In-stock products where the cheapest store is at least 10% under the dearest one in your region, biggest gap first. Same barcode, same size, different price."
      />
      {REGIONS.map((r) => {
        const deals = dealsIn(r.code, 60).map((d) => d.f);
        return (
          <div key={r.code} className={`rp rp-${r.code}`}>
            {deals.length ? <TileGrid products={deals} region={r.code} /> : <p className="card p-6 text-center text-soft">No deals {r.phrase} today. Check back after tomorrow&apos;s price check.</p>}
          </div>
        );
      })}
    </div>
  );
}
