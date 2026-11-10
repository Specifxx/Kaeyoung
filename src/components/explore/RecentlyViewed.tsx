"use client";
// "Recently viewed": the visitor's own last product pages (./recent.ts), drawn in the
// browser after load (nothing in the server HTML, so nothing for crawlers and no layout
// shift above the fold: it sits below the first screen). Prices are the lowest store
// price the visitor saw, labelled with when, in every region's own currency; CSS
// shows the visitor's region (.rp-XX) like every other list.
import Link from "next/link";
import { useEffect, useState } from "react";
import { REGIONS } from "@/site";
import { money } from "@/lib/format";
import { readRecent, writeRecent, type RecentItem } from "./recent";

function seen(t: number): string {
  const d = Math.floor((Date.now() - t) / 86_400_000);
  return d <= 0 ? "today" : d === 1 ? "yesterday" : `${d} days ago`;
}

export function RecentlyViewed({ prefix, exclude, className = "mt-12" }: { prefix: string; exclude?: string; className?: string }) {
  const [items, setItems] = useState<RecentItem[]>([]);
  useEffect(() => {
    setItems(readRecent(prefix).filter((x) => x.s !== exclude));
  }, [prefix, exclude]);
  if (!items.length) return null;
  return (
    <section className={className} aria-labelledby="recent-h">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <h2 id="recent-h" className="h-display text-2xl">Recently viewed</h2>
        <button
          type="button"
          onClick={() => {
            writeRecent(prefix, []);
            setItems([]);
          }}
          className="text-sm text-soft underline-offset-4 hover:text-ink hover:underline"
        >
          Clear
        </button>
      </div>
      <ul className="ex-scroll -mx-4 flex gap-3 overflow-x-auto px-4 pb-2">
        {items.map((x) => {
          const short = x.b && x.n.startsWith(x.b) ? x.n.slice(x.b.length).trim() : x.n;
          return (
            <li key={x.s} className="w-[9.5rem] shrink-0 sm:w-44">
              <Link prefetch={false} href={`/product/${x.s}`} className="card tile-hover flex h-full flex-col overflow-hidden">
                <div className="aspect-square bg-gradient-to-b from-white to-subtle">
                  {x.i ? (
                    <img src={x.i} alt={x.n} loading="lazy" decoding="async" referrerPolicy="no-referrer" className="h-full w-full object-contain p-3 text-transparent" />
                  ) : (
                    <div className="grid h-full place-items-center text-xs text-soft">{x.b}</div>
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-0.5 border-t border-line p-2.5">
                  {x.b && <p className="eyebrow truncate">{x.b}</p>}
                  <p className="line-clamp-2 text-[13px] font-medium leading-snug">{short}</p>
                  <div className="mt-auto pt-1 text-xs text-soft">
                    {REGIONS.map((r) => (
                      <p key={r.code} className={`rp rp-${r.code}`}>
                        {x.p[r.code] ? (
                          <>
                            <span className="text-sm font-semibold tabular-nums text-accent-deep">{money(x.p[r.code], r.code)}</span> · seen {seen(x.t)}
                          </>
                        ) : (
                          <>Seen {seen(x.t)}</>
                        )}
                      </p>
                    ))}
                  </div>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
