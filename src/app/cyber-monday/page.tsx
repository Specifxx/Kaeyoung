import type { Metadata } from "next";
import Link from "next/link";
import { POST_BY_SLUG } from "@/content/blog";
import { REGIONS } from "@/site";
import { dealsIn } from "@/lib/data";
import { TileGrid } from "@/components/ProductTile";
import { PageHead } from "@/components/Section";
import { blackFriday, cyberMonday, holidayFaq, longDate, seasonYear } from "@/lib/black-friday";

// The Cyber Monday page (DECISIONS.md, "Black Friday strip and Cyber Monday page", 2026-11-07; built like "Black Friday page", 2026-11-02): today's deals at one URL kept every year,
// prerendered at the daily build like every page.
const year = () => seasonYear(new Date().toISOString().slice(0, 10));

export function generateMetadata(): Metadata {
  const y = year();
  return {
    title: `K-beauty Cyber Monday deals ${y}`,
    description: `Cyber Monday ${y} online Korean skincare deals: in stock today where the cheapest store is at least 10% under the dearest. Same barcode, same size, per region, updated daily.`,
    alternates: { canonical: "/cyber-monday" },
  };
}

export default function CyberMonday() {
  const guide = POST_BY_SLUG["kbeauty-black-friday-2026"]; // only once the post is live (its date)
  const y = year();
  const bf = blackFriday(y);
  const before = new Date().toISOString().slice(0, 10) < cyberMonday(y);
  return (
    <div className="mx-auto max-w-6xl px-4">
      <PageHead
        eyebrow="Cyber Monday"
        title={`K-beauty Cyber Monday deals ${y}`}
        sub={
          <>
            Cyber Monday is {longDate(cyberMonday(y))} {y}, the Monday after Black Friday ({longDate(bf)}).{before ? " Many stores start their sales earlier." : ""} These are
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
        <Link prefetch={false} href="/black-friday" className="underline">Black Friday deals</Link> ·{" "}
        <Link prefetch={false} href="/deals" className="underline">K-beauty deals today</Link> · <Link prefetch={false} href="/popular" className="underline">Popular products</Link> ·{" "}
        <Link prefetch={false} href="/stores" className="underline">Stores we compare</Link>
        {guide ? <> · <Link prefetch={false} href={`/blog/${guide.slug}`} className="underline">{guide.short}: how to tell a real deal</Link></> : null}
      </p>
      <section className="mt-10 max-w-3xl">
        <h2 className="font-display text-xl font-semibold">Cyber Monday {y}: questions</h2>
        {holidayFaq("cyber-monday", y, "K-beauty").map((f) => (
          <div key={f.q} className="mt-3 text-sm">
            <h3 className="font-semibold">{f.q}</h3>
            <p className="text-soft">{f.a}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
