import type { Metadata } from "next";
import { REGIONS } from "@/site";
import { STORES } from "@/content/stores";
import { activeStores } from "@/lib/data";
import { storeUrl } from "@/lib/affiliate";
import { PageHead } from "@/components/Section";

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
        sub="Every store we compare, by region, with how many of its products are on K Young today. Real shops only: no open marketplaces, where counterfeit skincare hides. Know a store we should add? Email us from the about page."
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
    </div>
  );
}
