import type { Metadata } from "next";
import { REGIONS } from "@/site";
import { STORES } from "@/content/stores";
import { activeStores } from "@/lib/data";
import { storeUrl } from "@/lib/affiliate";
import { PageHead } from "@/components/Section";
import { SuggestStore } from "@/components/ReportForms";

export const metadata: Metadata = {
  title: "Where to buy Korean skincare online",
  description: "The K-beauty stores K Young compares every day, by region: specialist Korean skincare shops in the US, UK, Canada, Australia, New Zealand and Europe.",
  alternates: { canonical: "/stores" },
};

export default function Stores() {
  const counts = activeStores();
  return (
    <div className="mx-auto max-w-6xl px-4">
      <PageHead
        eyebrow="K Young"
        title="Where to buy Korean skincare online"
        sub="Every store we compare, by region, with how many of its products are on K Young today. Real shops only: no open marketplaces, where counterfeit skincare hides. Know a store we should add? Suggest it below."
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {REGIONS.map((r) => {
          const list = STORES.filter((s) => s.region === r.code).sort((a, b) => (counts[b.id] ?? 0) - (counts[a.id] ?? 0) || a.name.localeCompare(b.name));
          if (!list.length) return null;
          return (
            <section key={r.code} className="card p-5">
              <h2 className="h-display mb-3 text-xl">
                {r.flag} {r.name}
              </h2>
              <ul className="space-y-1.5 text-sm">
                {list.map((s) => (
                  <li key={s.id} className="flex justify-between gap-2">
                    <a href={storeUrl(s.id, s.base)} rel="nofollow noopener" target="_blank" className="font-medium hover:underline">
                      {s.name}
                    </a>
                    <span className="shrink-0 whitespace-nowrap tabular-nums text-soft">{counts[s.id] ? `${counts[s.id].toLocaleString("en-US")} products` : "checking"}</span>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
      <section id="suggest" className="mt-10">
        <h2 className="h-display mb-1 text-2xl">Suggest a store</h2>
        <p className="mb-2 text-sm text-soft">A real K-beauty shop we don&apos;t compare yet? We look at every suggestion and add the store if its listings carry barcodes we can read. Store owners welcome: listing is free.</p>
        <SuggestStore regions={REGIONS.map((r) => [r.code, r.name])} what="Korean skincare" buttonClassName="btn-pop btn-buy px-6 py-2 text-sm" />
      </section>
    </div>
  );
}
