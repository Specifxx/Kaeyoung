import type { Metadata } from "next";
import Link from "next/link";
import { REGIONS } from "@/site";
import { dealsIn } from "@/lib/data";
import { TileGrid } from "@/components/ProductTile";
import { PageHead } from "@/components/Section";
import { blackFriday, cyberMonday, longDate, seasonYear } from "@/lib/black-friday";

// The Black Friday page (DECISIONS.md, "Black Friday page", 2026-11-02): today's deals at one URL kept every year,
// prerendered at the daily build like every page.
const year = () => seasonYear(new Date().toISOString().slice(0, 10));

export function generateMetadata(): Metadata {
  const y = year();
  return {
    title: `K-beauty Black Friday deals ${y}`,
    description: `Black Friday and Cyber Monday ${y} Korean skincare deals: in stock today where the cheapest store is at least 10% under the dearest. Same barcode, same size, per region, updated daily.`,
    alternates: { canonical: "/black-friday" },
  };
}

export default function BlackFriday() {
  const y = year();
  const bf = blackFriday(y);
  const before = new Date().toISOString().slice(0, 10) < bf;
  return (
    <div className="mx-auto max-w-6xl px-4">
      <PageHead
        eyebrow="Black Friday"
        title={`K-beauty Black Friday deals ${y}`}
        sub={
          <>
            Black Friday is {longDate(bf)} and Cyber Monday is {longDate(cyberMonday(y))} {y}.{before ? " Many stores start their sales earlier." : ""} These are
            today&apos;s in-stock products where the cheapest store is at least 10% under the dearest in your region: same barcode, same size. The page updates every
            day through the sales. We only see what a store asks when we read its prices, so check the store&apos;s page before you buy.
          </>
        }
      />
      {REGIONS.map((r) => {
        const deals = dealsIn(r.code, 60).map((d) => d.f);
        return (
          <div key={r.code} className={`rp rp-${r.code}`}>
            {deals.length ? <TileGrid products={deals} region={r.code} /> : <p className="card p-6 text-center text-soft">No product is 10% under the dearest store {r.phrase} today.</p>}
          </div>
        );
      })}
      <p className="mt-8 text-sm text-soft">
        <Link prefetch={false} href="/deals" className="underline">K-beauty deals today</Link> · <Link prefetch={false} href="/popular" className="underline">Popular products</Link> ·{" "}
        <Link prefetch={false} href="/stores" className="underline">Stores we compare</Link>
      </p>
    </div>
  );
}
