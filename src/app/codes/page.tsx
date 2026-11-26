import type { Metadata } from "next";
import Link from "next/link";
import { Flag } from "@/components/Flag";
import { Monogram } from "@/components/codes/Monogram";
import { PageHead } from "@/components/Section";
import { codeStorePages, codesCheckedOn, codesMonth } from "@/lib/codes-page";
import { REGION_BY_CODE } from "@/site";

export function generateMetadata(): Metadata {
  return {
    title: `K-beauty discount codes, ${codesMonth()}`,
    description: "Discount codes and deals published by the K-beauty stores themselves, checked every morning, with shoppers' votes on whether each code worked.",
    alternates: { canonical: "/codes" },
  };
}

export default function Codes() {
  const pages = codeStorePages().filter((p) => !p.s.retired);
  const live = pages.filter((p) => p.live.length > 0).sort((a, b) => b.codes - a.codes || b.live.length - a.live.length || a.s.name.localeCompare(b.s.name));
  const quiet = pages.filter((p) => p.live.length === 0);
  const checked = codesCheckedOn();
  const totalCodes = pages.reduce((a, p) => a + p.codes, 0);
  const totalDeals = pages.reduce((a, p) => a + p.deals, 0);

  return (
    <div className="mx-auto max-w-6xl px-4 pb-6">
      <PageHead
        eyebrow="Save"
        title="K-beauty discount codes"
        sub={
          <>
            Codes and deals the stores publish themselves, read every morning{checked ? ` (last on ${checked})` : ""}. No codes copied from coupon sites. Under every code, shoppers
            say whether it worked.
          </>
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-2 text-sm">
        <span className="chip bg-accent-pale text-accent-deep">{totalCodes} codes</span>
        <span className="chip tint-mint text-save">{totalDeals} deals</span>
        <span className="chip bg-subtle text-soft">{live.length} stores</span>
      </div>

      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {live.map((p) => (
          <li key={p.s.slug}>
            <Link
              prefetch={false}
              href={`/codes/${p.s.slug}`}
              className="card group flex h-full flex-col gap-4 p-4 transition hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-[0_10px_30px_-18px_rgb(var(--ink)/0.45)] sm:p-5"
            >
              <div className="flex items-center gap-3">
                <Monogram name={p.s.name} size="sm" />
                <div className="min-w-0">
                  <p className="truncate text-[16px] font-semibold text-ink group-hover:text-accent-deep">{p.s.name}</p>
                  <p className="flex items-center gap-1.5 text-[12.5px] text-soft">
                    <Flag code={p.s.region} className="h-2.5 w-[15px] rounded-[2px]" /> {REGION_BY_CODE[p.s.region]?.name ?? p.s.region}
                  </p>
                </div>
                {p.best && (
                  <span className="ml-auto shrink-0 rounded-lg bg-accent-pale px-2 py-1 text-center font-display text-[15px] font-semibold leading-none text-accent-deep">
                    <span className="block font-sans text-[9px] font-semibold uppercase tracking-[0.08em] opacity-80">up to</span>
                    {p.best}%
                  </span>
                )}
              </div>
              <p className="line-clamp-2 text-[13.5px] leading-snug text-soft">{(p.live.find((c) => c.code) ?? p.live[0])?.title}</p>
              <div className="mt-auto flex items-center justify-between border-t border-line pt-3 text-[13px]">
                <span className="tabular-nums text-ink">
                  {[p.codes > 0 && [p.codes, `code${p.codes === 1 ? "" : "s"}`], p.deals > 0 && [p.deals, `deal${p.deals === 1 ? "" : "s"}`]]
                    .filter((x): x is [number, string] => !!x)
                    .map(([n, w], i) => (
                      <span key={w}>
                        {i > 0 && <span className="text-soft"> · </span>}
                        <b className="font-semibold">{n}</b> <span className="text-soft">{w}</span>
                      </span>
                    ))}
                </span>
                <span className="font-semibold text-accent-deep transition-transform group-hover:translate-x-0.5">See codes →</span>
              </div>
            </Link>
          </li>
        ))}
      </ul>

      {quiet.length > 0 && (
        <p className="mt-6 text-sm text-soft">
          No codes today at{" "}
          {quiet.map((p, i) => (
            <span key={p.s.slug}>
              {i > 0 && (i === quiet.length - 1 ? " and " : ", ")}
              <Link prefetch={false} href={`/codes/${p.s.slug}`} className="underline-offset-2 hover:underline">
                {p.s.name}
              </Link>
            </span>
          ))}
          . We check every morning.
        </p>
      )}

      <section className="mt-12 grid gap-4 sm:grid-cols-3">
        {[
          ["Straight from the store", "Every code comes from the store's own affiliate feed. We never copy codes from coupon sites, so there are no fake ones to wade through."],
          ["Checked every morning", "A code that ends or disappears moves to \"Recently ended\" on its store's page the next day, so you can see what stopped."],
          ["Shoppers vote", "Tap \"Worked\" or \"Didn't\" after checkout. Votes never change the order: newest codes always come first."],
        ].map(([h, t]) => (
          <div key={h} className="rounded-2xl border border-line bg-card p-5">
            <h2 className="mb-1 text-[15px] font-semibold">{h}</h2>
            <p className="text-sm leading-relaxed text-soft">{t}</p>
          </div>
        ))}
      </section>
      <p className="mt-6 text-[12px] text-soft">
        These stores pay us a commission when you buy after following our link (<Link prefetch={false} href="/disclosure" className="underline">how we make money</Link>). It never decides which codes we list.
      </p>
    </div>
  );
}
