import Link from "next/link";
import { BfModeBar } from "@/components/BfModeBar";
import { bfModeOn, bfPhase } from "@/lib/bf-mode";
import { saleStrip } from "@/lib/black-friday";
import { ebayAffiliateUrl, ebayShopHost, subId } from "@/lib/affiliate";
import { REGIONS } from "@/site";

// One line under the header on every page from 1 November to the day after Cyber Monday, linking the Black Friday page,
// then the Cyber Monday page (lib/black-friday.ts saleStrip; DECISIONS.md, "Black Friday strip and Cyber Monday page",
// 2026-11-07). Drawn at the daily build like every page; a plain link, never a pop-up, a countdown or "ends soon".
export function HolidayStrip({ today = new Date().toISOString().slice(0, 10) }: { today?: string }) {
  const s = saleStrip(today);
  const strip = s ? (
    <div className="border-b border-line bg-card" data-holiday-strip={s.href.slice(1)}>
      <p className="mx-auto max-w-6xl truncate px-4 py-1.5 text-center text-xs sm:text-sm">
        <Link prefetch={false} href={s.href} className="hover:underline">
          <b>{s.name} K-beauty deals</b><span className="hidden sm:inline"> · today&apos;s cheapest stores, same barcode, updated daily</span> · <span className="font-semibold text-accent">see the deals →</span>
        </Link>
      </p>
    </div>
  ) : null;
  // For Black Friday itself (lib/bf-mode.ts, owner 2026-11-27) the line becomes the bold Black Friday bar, which falls back to it.
  const now = Date.now();
  const on = bfModeOn(now);
  // After the sale the bar keeps running with the offer calendar (lib/offer-calendar.ts, owner 2026-11-28): the season and our
  // own deals pages. Its one paid link (owner, 2026-11-28: "for the other websites … something with eBay and Amazon") is eBay's
  // own Daily Deals page in the visitor's region (CSS picks the region, as every price does), tagged and labelled Ad, naming no
  // price, discount or date: eBay runs that page every day, so it is always true. Inside this one bar only: no strip, no box,
  // no pop-up. Never Amazon here (its 2 Nov Associates rule: no deals or category links); Amazon keeps its row's deal badge.
  const ebayAd = (
    <>
      {REGIONS.map((r) => {
        const h = ebayShopHost(r.code);
        if (!h) return null;
        return (
          <a key={r.code} href={ebayAffiliateUrl(`https://${h}/deals`, subId(r.code, "offer-bar"))} rel="sponsored nofollow noopener" target="_blank" className={`rp rp-inline rp-${r.code} underline-offset-2 hover:underline`} style={{ color: "#d4d4d8" }}>
            eBay Daily Deals · Ad
          </a>
        );
      })}
    </>
  );
  return (
    <BfModeBar
      on={on} phase={bfPhase(now)} now={now} href="/black-friday" title="K-beauty deals" line="today's cheapest stores, same barcode"
      evergreen={{ title: "K-beauty deals", line: "today's cheapest stores, same barcode", href: "/deals", hrefs: { afterChristmas: "/boxing-day", newYear: "/january-sales" }, ad: ebayAd }}
    >
      {strip}
    </BfModeBar>
  );
}
