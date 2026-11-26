import Link from "next/link";
import { InlineAds } from "@/components/InlineAds";
import type { Metadata } from "next";
import { REGIONS } from "@/site";
import { dealsIn } from "@/lib/data";
import { TileGrid } from "@/components/ProductTile";
import { PageHead } from "@/components/Section";
import { ShareButton } from "@/components/ShareButton";

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
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <ShareButton title="K-beauty deals today" path="/deals" medium="deals" />
        <Link prefetch={false} href="/codes" className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full border border-line bg-card px-4 text-sm font-semibold hover:border-accent/50">
          Store discount codes →
        </Link>
      </div>
      {REGIONS.map((r) => {
        const deals = dealsIn(r.code, 60).map((d) => d.f);
        return (
          <div key={r.code} className={`rp rp-${r.code}`}>
            {deals.length ? <TileGrid products={deals} region={r.code} /> : <p className="card p-6 text-center text-soft">No deals {r.phrase} today. Check back after tomorrow&apos;s price check.</p>}
          </div>
        );
      })}
      <InlineAds page="deals" />
    </div>
  );
}
