import type { Metadata } from "next";
import Link from "next/link";
import { REGIONS } from "@/site";
import { getHistory, getProducts } from "@/lib/data";
import { money } from "@/lib/format";
import { hotChart, hotDate, hotMove, hotName, HOT_MIN_PCT } from "@/lib/hot100";
import { PageHead } from "@/components/Section";
import { ShareButton } from "@/components/ShareButton";

// /hot-100: the weekly Hot 100 (lib/hot100.ts; owner, 2026-11-18), the one URL a week's Reddit post links. Prerendered at the
// day's build like every page; every region's chart is in the HTML and CSS shows the visitor's (.rp-XX).
const NOUN = "K-beauty";

export const metadata: Metadata = {
  title: `Hot 100: this week's biggest ${NOUN} price risers`,
  description: `The ${NOUN} products whose cheapest store price rose most in the last seven days, ranked per region, with each one's place on last week's chart. From our daily price history.`,
  alternates: { canonical: "/hot-100" },
};

export default function Hot100() {
  const products = getProducts();
  const history = getHistory();
  return (
    <div className="mx-auto max-w-6xl px-4">
      <PageHead
        eyebrow="This week"
        title={`${NOUN[0].toUpperCase()}${NOUN.slice(1)} Hot 100`}
        sub={`The products whose cheapest in-stock price rose most over the last seven days, biggest rise first, with each one's place on last week's chart. Two or more stores must sell it in your region and the price must have risen ${HOT_MIN_PCT}% or more; a short week is a shorter chart, never padded.`}
      />
      <ShareButton title={`${NOUN[0].toUpperCase()}${NOUN.slice(1)} Hot 100`} path="/hot-100" medium="deals" className="mb-6" />
      {REGIONS.map((r) => {
        const c = hotChart(products, history, r.code);
        const rows = c?.rows ?? [];
        return (
          <section key={r.code} className={`rp rp-${r.code}`}>
            {rows.length ? (
              <>
                <h2 className="mb-3 text-lg font-semibold">
                  {r.name}: the {hotName(rows.length)}, {hotDate(c!.from)} to {hotDate(c!.through)}
                </h2>
                <ol className="card divide-y divide-line">
                  {rows.map((x) => (
                    <li key={x.f.slug} className="flex items-center gap-3 px-3 py-2.5 text-sm">
                      <span className="w-8 shrink-0 text-right text-base font-bold tabular-nums">{x.rank}</span>
                      <span className="w-10 shrink-0 text-center text-xs font-semibold text-soft">{hotMove(x, c!.lastWeekSize)}</span>
                      <Link prefetch={false} href={`/product/${x.f.slug}`} className="min-w-0 flex-1 truncate font-medium hover:underline">
                        {x.f.name}
                        {x.f.size ? <span className="text-soft"> {x.f.size}</span> : null}
                      </Link>
                      <span className="hidden tabular-nums text-soft sm:inline">{money(x.before, r.code)} →</span>
                      <span className="tabular-nums">{money(x.after, r.code)}</span>
                      <span className="w-16 shrink-0 text-right font-semibold tabular-nums">+{x.pct}%</span>
                    </li>
                  ))}
                </ol>
              </>
            ) : (
              <p className="card p-6 text-center text-soft">No product&apos;s price rose {HOT_MIN_PCT}% or more this week {r.phrase}.</p>
            )}
          </section>
        );
      })}
      <p className="mt-6 max-w-3xl text-sm text-soft">
        Prices exclude delivery. One store selling out or listing a product can move the cheapest price, so a single week is a short window: this is what the shelves did, not a forecast.{" "}
        <Link prefetch={false} href="/deals" className="font-medium hover:underline">
          Today&apos;s deals →
        </Link>
      </p>
    </div>
  );
}
