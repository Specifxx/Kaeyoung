"use client";

import { useEffect, useState } from "react";
import { OutLink } from "./OutLink";
import { useRegion } from "./RegionPicker";
import { AdDock, DockGate, DockTile, DOCK_LINK } from "./AdDock";
import type { RailTile, Rails } from "@/lib/side-rails";

// The ONE in-content ad block (owner, 2026-11-13: the side rails are replaced by "one bigger, subtler horizontal ad block inside
// the page that looks native"). It is the old rails' data (lib/side-rails.ts, static /rails/<region>) drawn as a full-column
// section with the site's own card, hairline and text tokens: an "Ad" label, an eBay row first and an Amazon row second, each a
// row of larger tiles that scrolls sideways (up to ten; about six show on a desktop).
//
//   • Below the page's main content (home: between sections; product page: under the price table; lists: after the grid), once a
//     page, never beside a buy button or above a price, never fixed, floating or in the side space.
//   • Browser only: the section's height is reserved in the server HTML (.inline-ad in globals.css), so nothing moves when the
//     tiles arrive (CLS 0), and the tiles are fetched from /rails/<region> after hydration, never in the server HTML. A page
//     reads no cookie or header and nothing is a function.
//   • Every link rel sponsored under its own tag (inline-ebay, inline-amazon). Amazon tiles carry no price (lib/side-rails.ts says
//     why) and Amazon is never in the phone dock (an overlay).
//   • Under DOCK_MIN_WIDTH the eBay tiles also go to the phone dock (AdDock.tsx), which yields while this block is on screen.

/** Phones: the dock shows only below this width. */
export const DOCK_MIN_WIDTH = 768;

/** A row with fewer live tiles than this is not drawn (lib/side-rails.ts MIN_TILES; that file is server-only, so it is repeated). */
const MIN_TILES = 2;

const loaded = new Map<string, Promise<Rails | null>>();
function load(region: string): Promise<Rails | null> {
  const key = region.toLowerCase();
  let p = loaded.get(key);
  if (!p) {
    p = fetch(`/rails/${key}`)
      .then((r) => (r.ok ? (r.json() as Promise<Rails>) : null))
      .catch(() => null);
    loaded.set(key, p);
  }
  return p;
}

function useRails(enabled: boolean): Rails | null {
  const region = useRegion();
  const [rails, setRails] = useState<Rails | null>(null);
  useEffect(() => {
    if (!enabled) return;
    let live = true;
    load(region).then((r) => live && setRails(r));
    return () => {
      live = false;
    };
  }, [region, enabled]);
  return enabled && rails?.region === region ? rails : null;
}

interface RowProps {
  brand: "ebay" | "amazon";
  heading: string;
  label: string;
  tiles: RailTile[];
  more: string | null;
}

function ebayRow(r: Rails): RowProps | null {
  return r.ebay.tiles.length >= MIN_TILES ? { brand: "ebay", heading: "On eBay", label: r.ebay.label, tiles: r.ebay.tiles, more: r.ebay.more } : null;
}
function amazonRow(r: Rails): RowProps | null {
  return r.amazon && r.amazon.tiles.length >= MIN_TILES ? { brand: "amazon", heading: "On Amazon", label: r.amazon.label, tiles: r.amazon.tiles, more: null } : null;
}

/** The block. `page` says where it sits (home, product, list…) for the click report; one per page. */
export function InlineAds({ page, className = "mt-12" }: { page: string; className?: string }) {
  const rails = useRails(true);
  const rows = rails ? [ebayRow(rails), amazonRow(rails)].filter((x): x is RowProps => !!x) : [];
  const failed = rails !== null && rows.length === 0;
  return (
    <section
      data-ad="inline"
      data-ad-page={page}
      aria-label="Sponsored links"
      hidden={failed}
      className={`inline-ad ${rows.length ? "" : "inline-ad-empty"} rounded-2xl border border-line bg-card p-4 sm:p-5 ${className}`}
    >
      {rows.length > 0 && rails && (
        <>
          <div className="flex items-center gap-2 text-xs text-soft">
            <span className="rounded bg-subtle px-1.5 py-px text-[10px] font-semibold uppercase tracking-wide">Ad</span>
            <span>Paid links to eBay and Amazon. We may earn a commission if you buy.</span>
          </div>
          {rows.map((row) => (
            <Row key={row.brand} {...row} region={rails.region} page={page} />
          ))}
        </>
      )}
    </section>
  );
}

function Row({ brand, heading, label, tiles, more, region, page }: RowProps & { region: string; page: string }) {
  const placement = `inline_${brand}_${page}`;
  return (
    <div role="group" aria-label={`Sponsored: ${label}`} className="mt-4">
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <h3 className="text-sm font-semibold text-ink">
          {heading} <span className="text-xs font-normal text-soft">· Ad</span>
        </h3>
        {more && (
          <OutLink href={more} paid className="truncate text-xs font-semibold text-accent-deep underline-offset-4 hover:underline" event={{ source: brand, region, placement }}>
            More on {label} →
          </OutLink>
        )}
      </div>
      <ul role="list" className="ex-scroll -mx-1 flex gap-3 overflow-x-auto px-1 pb-2">
        {tiles.map((t) => (
          <li key={t.id} className="w-[150px] shrink-0 sm:w-[160px] lg:w-[calc((100%-60px)/6)] lg:min-w-[160px]">
            <OutLink
              href={t.href}
              paid
              className="group flex h-full flex-col rounded-xl p-1.5 transition-colors hover:bg-subtle"
              event={{ source: brand, region, placement, ean: t.id }}
            >
              <span className="relative block aspect-square w-full overflow-hidden rounded-lg border border-line bg-white">
                <img src={t.img} alt={`${t.name} on ${label}`} width={160} height={160} loading="lazy" decoding="async" referrerPolicy="no-referrer" className="absolute inset-0 h-full w-full object-contain p-2" />
              </span>
              <span className="mt-2 line-clamp-2 h-9 text-[13px] font-medium leading-[18px] text-ink group-hover:text-accent-deep">{t.name}</span>
              {t.price ? (
                <span className="mt-1 block h-5 truncate text-sm font-semibold tabular-nums leading-5 text-ink">{t.price}</span>
              ) : (
                <span className="mt-1 block h-5 truncate text-xs leading-5 text-soft">See price ↗</span>
              )}
              <span className="sr-only">, on {label}</span>
            </OutLink>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Phones: the eBay tiles in the phone dock (AdDock.tsx). Never Amazon. */
export function RailDock() {
  return (
    <DockGate minWidth={DOCK_MIN_WIDTH}>
      <DockItems />
    </DockGate>
  );
}

/** The eBay tag with the dock's placement in it (inline-ebay → dock-ebay), so EPN's customid report tells the two apart. Pure. */
export function dockHref(href: string): string {
  return href.replace(/(customid=[a-z]+-[a-z]+-)inline-ebay/, "$1dock-ebay");
}

function DockItems() {
  const rails = useRails(true);
  if (!rails || rails.ebay.tiles.length === 0) return null;
  const items = rails.ebay.tiles
    .filter((t) => t.price)
    .map((t) => (
      <OutLink key={t.id} href={dockHref(t.href)} paid className={DOCK_LINK} event={{ source: "ebay", region: rails.region, placement: "dock_ebay", ean: t.id }}>
        <DockTile img={t.img} alt={`${t.name} on eBay`} brand={<span className="font-bold text-ink">eBay</span>} title={t.name} price={t.price!} cta="View" />
        <span className="sr-only">, on {rails.ebay.label}</span>
      </OutLink>
    ));
  if (items.length === 0) return null;
  return <AdDock label={`Sponsored: on ${rails.ebay.label}`} items={items} placement="dock_ebay" minWidth={DOCK_MIN_WIDTH} />;
}
