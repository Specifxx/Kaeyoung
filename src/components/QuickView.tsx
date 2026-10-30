"use client";
// The quick view (owner, 2026-10-30: "like we have on RiftCompare … make the
// lag seem less"). A click on any product tile (a[data-qv]) opens this panel
// at once with what the tile already knows (photo, brand, name), then fills in
// every store's price from /q/<slug>, a static JSON on the CDN. The tile stays
// a real link: crawlers, new tabs and modified clicks go to the product page,
// whose server HTML keeps every price. eBay first, Amazon second, as on the page.
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { REGIONS, type RegionCode } from "@/site";
import { PriceRows, type RowData } from "./PriceRows";
import { ProductImage } from "./ProductImage";

interface Head {
  slug: string;
  name: string;
  brand: string;
  img: string | null;
}
interface Data {
  size: string | null;
  rows: Record<RegionCode, { pinned: RowData[]; stores: RowData[] } | null>;
}

const cache = new Map<string, Promise<Data | null>>();
function load(slug: string): Promise<Data | null> {
  let p = cache.get(slug);
  if (!p) {
    p = fetch(`/q/${encodeURIComponent(slug)}`)
      .then((r) => (r.ok ? (r.json() as Promise<Data>) : null))
      .catch(() => null);
    p.then((d) => d || cache.delete(slug));
    cache.set(slug, p);
  }
  return p;
}

export function QuickView() {
  const [head, setHead] = useState<Head | null>(null);
  const [data, setData] = useState<Data | null | "loading">(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const close = useCallback(() => setHead(null), []);

  useEffect(() => {
    // Capture phase on the document: runs before Next's Link, which then sees
    // the click already handled and does not navigate.
    function onClick(e: MouseEvent) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a[data-qv]") as HTMLAnchorElement | null;
      if (!a) return;
      e.preventDefault();
      const slug = a.dataset.qv!;
      setHead({ slug, name: a.dataset.qvName || "", brand: a.dataset.qvBrand || "", img: a.dataset.qvImg || null });
      setData("loading");
      load(slug).then((d) => setData((cur) => (cur === "loading" ? d : cur)));
    }
    // Warm the file when a pointer rests on a tile, so most opens are instant.
    function onOver(e: PointerEvent) {
      const a = (e.target as Element | null)?.closest?.("a[data-qv]") as HTMLAnchorElement | null;
      if (a && e.pointerType === "mouse") load(a.dataset.qv!);
    }
    document.addEventListener("click", onClick, true);
    document.addEventListener("pointerover", onOver, { passive: true });
    return () => {
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("pointerover", onOver);
    };
  }, []);

  useEffect(() => {
    if (!head) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [head, close]);

  if (!head) return null;
  const href = `/product/${head.slug}`;
  const short = head.brand && head.name.startsWith(head.brand) ? head.name.slice(head.brand.length).trim() : head.name;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label={head.name}>
      <button type="button" aria-label="Close" tabIndex={-1} className="qv-backdrop absolute inset-0 bg-ink/40 backdrop-blur-[2px]" onClick={close} />
      <div className="qv-panel relative flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-t-3xl border border-line bg-card shadow-2xl sm:rounded-3xl">
        <div className="flex items-start gap-4 border-b border-line p-4 sm:p-5">
          <div className="grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-2xl bg-gradient-to-b from-white to-subtle">
            <ProductImage src={head.img} alt={head.name} label={head.brand || "K-beauty"} eager className="h-full w-full object-contain p-2" />
          </div>
          <div className="min-w-0 flex-1">
            {head.brand && <p className="eyebrow truncate">{head.brand}</p>}
            <h2 className="h-display mt-0.5 text-lg leading-snug">{short}</h2>
            {data && data !== "loading" && data.size && <p className="mt-1 text-xs text-soft">{data.size}</p>}
          </div>
          <button ref={closeRef} type="button" onClick={close} aria-label="Close" className="-mr-1 -mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-full text-soft hover:bg-subtle hover:text-ink">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          <h3 className="mb-3 text-sm font-semibold">Every store&apos;s price</h3>
          {data === "loading" ? (
            <Skeleton />
          ) : data ? (
            REGIONS.map((r) => {
              const rows = data.rows[r.code];
              return (
                <div key={r.code} className={`rp rp-${r.code}`}>
                  {rows ? <PriceRows {...rows} /> : <p className="rounded-xl border border-line p-4 text-sm text-soft">No store {r.phrase} lists this product yet. The full page shows where it is sold.</p>}
                </div>
              );
            })
          ) : (
            <p className="rounded-xl border border-line p-4 text-sm text-soft">Prices did not load. The full page has every store&apos;s price.</p>
          )}
        </div>
        <div className="border-t border-line p-4 sm:px-5">
          <Link prefetch={false} href={href} onClick={close} className="btn-pop btn-buy flex w-full justify-center px-5 py-2.5 text-[15px]">
            See price history and details <span aria-hidden>→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="space-y-2" aria-label="Loading prices" aria-busy="true">
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-center gap-3 rounded-xl border border-line px-3.5 py-3">
          <div className="flex-1 space-y-1.5">
            <div className="qv-shimmer h-3.5 w-1/3 rounded" />
            <div className="qv-shimmer h-2.5 w-1/4 rounded" />
          </div>
          <div className="qv-shimmer h-8 w-20 rounded-full" />
        </div>
      ))}
    </div>
  );
}
