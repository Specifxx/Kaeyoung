import Link from "next/link";
import { BfModeBar } from "@/components/BfModeBar";
import { bfModeOn } from "@/lib/bf-mode";
import { saleStrip } from "@/lib/black-friday";

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
  const on = bfModeOn(Date.now());
  if (!on) return strip;
  return (
    <BfModeBar on={on} href="/black-friday" title="K-beauty deals" line="today's cheapest stores, same barcode">
      {strip}
    </BfModeBar>
  );
}
