"use client";

import { useEffect, useState } from "react";
import { OutLink } from "./OutLink";
import { useRegion } from "./RegionPicker";
import { AdDock, DockGate, DockTile, DOCK_LINK } from "./AdDock";
import type { RailTile, Rails } from "@/lib/side-rails";

// The two side rails (ported from DexCompare / MTG / WargameCompare / RiftCompare; owner 2026-11-06: "the eBay ads … but instead
// of the TCGplayer ad, the Amazon ad banner that's scrollable"): eBay down the left of the page, Amazon down the right, each a
// column of up to ten products that scrolls inside itself.
//
//   • From MIN_WIDTH (1440px): the side panel already takes 256px on the left, so below that the page would get too narrow. The
//     columns' room is reserved by CSS in the server HTML (an empty <aside> each side of <main>), so nothing moves when the tiles
//     arrive (CLS 0). The tiles are browser only: fetched from the static /rails/<region> after hydration, never in the server
//     HTML, so crawlers see nothing new (no SEO change).
//   • Sticky beside the content, inside the page's own row: they stop above the footer and never cover anything. Not a pop-up.
//   • Labelled "Ad" with the affiliate note; every link rel sponsored under its own tag (side-ebay, side-amazon). Amazon tiles
//     carry no price (lib/side-rails.ts says why).
//   • Below MIN_WIDTH, the eBay tiles go to the phone dock (AdDock.tsx); Amazon never does (an overlay).

export const MIN_WIDTH = 1440;
/** One whole tile must fit under the header in the window, or the rail is not drawn. */
export const MIN_HEIGHT = 480;

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

function useWide(): boolean {
  const [wide, setWide] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${MIN_WIDTH}px)`);
    const update = () => setWide(SIDE_RAILS && mq.matches && window.innerHeight >= MIN_HEIGHT);
    update();
    mq.addEventListener("change", update);
    window.addEventListener("resize", update, { passive: true });
    return () => {
      mq.removeEventListener("change", update);
      window.removeEventListener("resize", update);
    };
  }, []);
  return wide;
}

/** One rail's column: always in the server HTML as an empty <aside> (CSS gives it its width from MIN_WIDTH), filled in the browser. */
/** The side rails are OFF (owner, 2026-11-13: "banner ads on the side … doesn't look as good … fill in that space on the side again"): the ads are the strips inside the page and the phone dock. The rail code stays; nothing renders or fetches it while this is false. */
export const SIDE_RAILS = false;

export function RailSlot({ side }: { side: "left" | "right" }) {
  const wide = useWide();
  const rails = useRails(wide);
  if (!SIDE_RAILS) return null;
  const rail = rails && (side === "left" ? ebayRail(rails) : amazonRail(rails));
  return (
    <aside className="side-rail-slot shrink-0" data-rail={side}>
      {rail && <Rail {...rail} region={rails!.region} />}
    </aside>
  );
}

interface RailProps {
  brand: "ebay" | "amazon";
  heading: string;
  label: string;
  tiles: RailTile[];
  placement: string;
  more: string | null;
  note: string;
}

function ebayRail(r: Rails): RailProps | null {
  return r.ebay.tiles.length >= 2
    ? { brand: "ebay", heading: "On eBay", label: r.ebay.label, tiles: r.ebay.tiles, placement: "side_ebay", more: r.ebay.more, note: "Affiliate · delivered" }
    : null;
}
function amazonRail(r: Rails): RailProps | null {
  return r.amazon && r.amazon.tiles.length >= 2
    ? { brand: "amazon", heading: "On Amazon", label: r.amazon.label, tiles: r.amazon.tiles, placement: "side_amazon", more: null, note: "Paid links" }
    : null;
}

const TILE = "group flex flex-col border-b border-line bg-card p-2 transition-colors hover:bg-subtle";

function Rail({ brand, heading, label, tiles, placement, more, note, region }: RailProps & { region: string }) {
  return (
    <div role="group" data-ad={placement} aria-label={`Sponsored: ${label}`} className="side-rail flex flex-col border-line bg-card">
      <div className="flex h-[30px] shrink-0 items-center justify-between px-2">
        <span className="truncate text-[13px] font-semibold text-ink">{heading}</span>
        <span className="rounded bg-subtle px-1.5 py-px text-[10px] font-semibold uppercase tracking-wide text-soft">Ad</span>
      </div>
      <ul role="list" className="rail-scroll grid min-h-0 flex-1 content-start overflow-y-auto overscroll-contain border-t border-line">
        {tiles.map((t) => (
          <li key={t.id}>
            <OutLink href={t.href} paid className={TILE} event={{ source: brand, region, placement, ean: t.id }}>
              <span className="relative block aspect-square w-full overflow-hidden rounded-lg bg-white">
                <img src={t.img} alt={`${t.name} on ${label}`} width={120} height={120} loading="lazy" decoding="async" referrerPolicy="no-referrer" className="absolute inset-0 h-full w-full object-contain p-1" />
              </span>
              <span className="mt-1.5 line-clamp-2 h-9 text-xs font-medium leading-[18px] text-ink group-hover:text-accent-deep">{t.name}</span>
              {t.price ? (
                <span className="block h-5 truncate text-[15px] font-bold tabular-nums leading-5 text-accent-deep">{t.price}</span>
              ) : (
                <span className="block h-5 truncate text-xs font-semibold leading-5 text-accent-deep">See price ↗</span>
              )}
              <span className="sr-only">, on {label}</span>
            </OutLink>
          </li>
        ))}
      </ul>
      <p className="flex shrink-0 flex-col px-2 py-2 text-[10px] leading-[13px] text-soft">
        {more && (
          <OutLink href={more} paid className="truncate font-semibold text-accent-deep" event={{ source: brand, region, placement }}>
            More on {label} →
          </OutLink>
        )}
        <span className="truncate">{note}</span>
      </p>
    </div>
  );
}

/** Below MIN_WIDTH: the left rail's eBay tiles in the phone dock (AdDock.tsx). Never Amazon. */
export function RailDock() {
  return (
    <DockGate minWidth={MIN_WIDTH}>
      <DockItems />
    </DockGate>
  );
}

/** The eBay tag with the dock's placement in it (side-ebay → dock-ebay), so EPN's customid report tells the two apart. Pure. */
export function dockHref(href: string): string {
  return href.replace(/(customid=[a-z]+-[a-z]+-)side-ebay/, "$1dock-ebay");
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
  return <AdDock label={`Sponsored: on ${rails.ebay.label}`} items={items} placement="dock_ebay" minWidth={MIN_WIDTH} />;
}
