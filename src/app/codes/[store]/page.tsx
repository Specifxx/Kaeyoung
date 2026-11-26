import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CODE_STORES } from "@/content/code-stores";
import { CodeList } from "@/components/codes/CodeList";
import { Monogram } from "@/components/codes/Monogram";
import { Flag } from "@/components/Flag";
import { Crumbs } from "@/lib/seo";
import { codeStoreHref, codeStoreIndexable, codeStorePage, codeStorePages, codesCheckedOn, codesMonth } from "@/lib/codes-page";
import { regionLabel } from "@/lib/codes";
import { getCodes } from "@/lib/data";
import { REGION_BY_CODE, SITE } from "@/site";

// One store's discount codes (lib/codes.ts): every page is written at the release (CLAUDE.md: fully static), and a
// slug is kept forever (content/code-stores.ts), so dynamicParams is off.
export const dynamicParams = false;
export const generateStaticParams = () => CODE_STORES.map((s) => ({ store: s.slug }));

export function generateMetadata({ params }: { params: { store: string } }): Metadata {
  const p = codeStorePage(params.store);
  if (!p) return {};
  const month = codesMonth();
  const what = [p.codes && `${p.codes} code${p.codes === 1 ? "" : "s"}`, p.deals && `${p.deals} deal${p.deals === 1 ? "" : "s"}`].filter(Boolean).join(" and ");
  return {
    title: `${p.s.name} discount codes, ${month}`,
    description: what
      ? `${what} ${p.s.name} publishes today${p.best ? `, up to ${p.best}% off` : ""}. Copy a code, use it at checkout, and see whether it worked for other shoppers.`
      : `${p.s.name} has no live discount codes today. We check its own affiliate feed every day and list each code it publishes here.`,
    alternates: { canonical: `/codes/${p.s.slug}` },
    ...(codeStoreIndexable(p) ? {} : { robots: { index: false, follow: true } }),
  };
}

export default function StoreCodes({ params }: { params: { store: string } }) {
  const p = codeStorePage(params.store);
  if (!p) notFound();
  const { s } = p;
  const builtAt = Date.parse(getCodes().updatedAt) || Date.now();
  const checked = codesCheckedOn();
  const href = codeStoreHref(s);
  const codes = p.live.filter((c) => c.code);
  const deals = p.live.filter((c) => !c.code);
  const region = REGION_BY_CODE[s.region];
  const others = codeStorePages().filter((o) => o.s.slug !== s.slug && !o.s.retired && o.live.length > 0);
  const faq: [string, string][] = [
    [
      `Does ${s.name} have a discount code right now?`,
      codes.length
        ? `Yes: ${codes.length} code${codes.length === 1 ? "" : "s"} today${checked ? ` (checked ${checked})` : ""}, the newest first. Under each one, other shoppers say whether it worked for them.`
        : `Not today${checked ? ` (checked ${checked})` : ""}. ${deals.length ? `It has ${deals.length} deal${deals.length === 1 ? "" : "s"} that need no code.` : "We check every day and list each new code here."}`,
    ],
    [
      "Where do these codes come from?",
      `From ${s.name} itself: each one is a code the store published through its affiliate programme, which we read every morning. We never list codes copied from other coupon sites, and a code that ends or disappears moves to "Recently ended".`,
    ],
    [
      "Why didn't a code work?",
      "Most codes need a minimum spend, exclude sale or gift-set items, or work only once per customer or in one country. Read the line under the code, and check its region. If it still fails, tap \"Didn't\" so the next shopper knows.",
    ],
    ["Do you earn from this?", `Yes. ${s.name} pays us a small commission when you buy after following our link, at no cost to you. It never decides which codes we show or their order.`],
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 pb-6">
      <Crumbs items={[{ name: "Discount codes", path: "/codes" }, { name: s.name, path: `/codes/${s.slug}` }]} />

      <header className="wash relative mb-5 mt-3 overflow-hidden rounded-3xl border border-line px-4 py-4 sm:mb-6 sm:mt-5 sm:px-8 sm:py-8">
        <div className="flex items-start gap-3 sm:gap-4">
          <Monogram name={s.name} />
          <div className="min-w-0">
            <p className="eyebrow mb-1.5 text-accent-deep">Discount codes</p>
            <h1 className="h-display text-[1.6rem] leading-[1.1] sm:text-[2.35rem]">{s.name} discount codes</h1>
            <p className="mt-2 hidden max-w-[60ch] text-[15px] leading-relaxed text-soft sm:block">
              {p.live.length
                ? `The codes and deals ${s.name} publishes today. Tap a code to copy it, use it at checkout, then tell everyone whether it worked.`
                : `${s.name} has no live codes or deals today. We read its own affiliate feed every morning, so new codes appear here the day it publishes them.`}
            </p>
          </div>
        </div>
        <dl className="mt-4 grid grid-cols-3 gap-2 text-sm sm:mt-5 sm:grid-cols-4">
          <Stat k="Codes" v={String(codes.length)} />
          <Stat k="Deals" v={String(deals.length)} />
          <Stat k="Best" v={p.best ? `${p.best}% off` : "–"} />
          <Stat k="Checked" v={checked ?? "today"} wide />
        </dl>
        <p className="mt-3 flex flex-wrap items-center gap-x-3.5 gap-y-1 text-[12.5px] text-soft sm:mt-4">
          <span className="sm:hidden">Checked {checked ?? "today"}</span>
          <span className="inline-flex items-center gap-1.5">
            <Flag code={s.region} className="h-3 w-[18px] rounded-[2px]" /> Ships from {region?.name ?? s.region}
          </span>
          <span>
            <span className="chip bg-ad text-soft">Paid link</span> We earn a commission when you buy<span className="hidden sm:inline">. It never changes which codes we show</span>.
          </span>
        </p>
      </header>

      {codes.length > 0 && (
        <section aria-labelledby="codes-h" className="mt-2">
          <SectionHead id="codes-h" title="Codes" n={codes.length} sub="Newest first. Each one is the store's own, with its own fine print." />
          <CodeList store={{ slug: s.slug, name: s.name }} href={href} codes={codes} builtAt={builtAt} region={s.region} />
        </section>
      )}

      {deals.length > 0 && (
        <section aria-labelledby="deals-h" className="mt-10">
          <SectionHead id="deals-h" title="Deals, no code needed" n={deals.length} sub="Applied on the store's own site: follow the link." />
          <CodeList store={{ slug: s.slug, name: s.name }} href={href} codes={deals} builtAt={builtAt} region={s.region} />
        </section>
      )}

      {p.live.length === 0 && (
        <div className="card flex flex-col items-center gap-3 px-6 py-10 text-center">
          <p className="h-display text-xl">No codes today</p>
          <p className="max-w-md text-sm text-soft">We&apos;ll list the next one the day {s.name} publishes it. Until then its own site has today&apos;s prices.</p>
          <a href={href} rel="sponsored noopener" target="_blank" className="btn-pop btn-buy mt-1 inline-flex min-h-[44px] items-center rounded-xl px-5 text-sm font-semibold">
            Visit {s.name}
          </a>
        </div>
      )}

      {p.ended.length > 0 && (
        <details className="group mt-10 rounded-2xl border border-line bg-card">
          <summary className="flex min-h-[52px] cursor-pointer list-none items-center justify-between gap-3 px-4 text-sm font-semibold sm:px-5">
            <span>
              Recently ended <span className="font-normal text-soft">({p.ended.length})</span>
            </span>
            <svg aria-hidden viewBox="0 0 20 20" className="h-4 w-4 text-soft transition-transform group-open:rotate-180" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m5 8 5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </summary>
          <ul className="divide-y divide-line border-t border-line">
            {p.ended.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm sm:px-5">
                <span className="min-w-0">
                  <span className="block truncate text-soft">{c.title}</span>
                  <span className="text-[12px] text-soft">
                    {regionLabel(c.regions)} · ended {c.ended ? new Date(c.ended).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" }) : ""}
                  </span>
                </span>
                {c.code && <span className="shrink-0 rounded-md border border-dashed border-line px-2 py-1 font-mono text-[13px] text-soft line-through">{c.code}</span>}
              </li>
            ))}
          </ul>
        </details>
      )}

      <section aria-labelledby="faq-h" className="mt-12">
        <h2 id="faq-h" className="h-display mb-3 text-2xl">
          About {s.name} codes
        </h2>
        <div className="divide-y divide-line rounded-2xl border border-line bg-card">
          {faq.map(([q, a]) => (
            <details key={q} className="group px-4 sm:px-5" open={q === faq[0][0]}>
              <summary className="flex min-h-[52px] cursor-pointer list-none items-center justify-between gap-3 text-[15px] font-semibold">
                {q}
                <span aria-hidden className="text-lg leading-none text-soft transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="pb-4 text-sm leading-relaxed text-soft">{a}</p>
            </details>
          ))}
        </div>
      </section>

      {others.length > 0 && (
        <nav aria-label="More stores" className="mt-12">
          <h2 className="h-display mb-3 text-xl">Codes at other K-beauty stores</h2>
          <ul className="flex flex-wrap gap-2">
            {others.map((o) => (
              <li key={o.s.slug}>
                <Link prefetch={false} href={`/codes/${o.s.slug}`} className="inline-flex min-h-[40px] items-center gap-2 rounded-full border border-line bg-card px-3.5 text-sm font-medium hover:border-accent/50">
                  {o.s.name}
                  <span className="text-[12px] tabular-nums text-soft">{o.live.length}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
      <p className="mt-10 text-[12px] text-soft">
        {SITE.name} lists only codes a store publishes itself. Votes come from shoppers like you, one per code per visitor, and never change the order.
      </p>
    </div>
  );
}

function Stat({ k, v, wide = false }: { k: string; v: string; wide?: boolean }) {
  return (
    <div className={`rounded-xl border border-line/80 bg-card/80 px-2.5 py-2 backdrop-blur sm:px-3 sm:py-2.5 ${wide ? "hidden sm:block" : ""}`}>
      <dt className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-soft sm:text-[11px]">{k}</dt>
      <dd className="mt-0.5 truncate font-display text-base font-semibold tabular-nums leading-tight text-ink sm:text-lg">{v}</dd>
    </div>
  );
}

function SectionHead({ id, title, n, sub }: { id: string; title: string; n: number; sub: string }) {
  return (
    <div className="mb-3 sm:mb-4">
      <h2 id={id} className="h-display flex items-baseline gap-2 text-2xl">
        {title} <span className="font-sans text-base font-semibold tabular-nums text-soft">{n}</span>
      </h2>
      <p className="mt-0.5 text-sm text-soft">{sub}</p>
    </div>
  );
}
