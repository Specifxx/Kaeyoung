import Link from "next/link";
import { REGIONS } from "@/site";
import { heroPicks } from "@/lib/hero-picks";
import { storeName } from "@/lib/data";
import { money, pct } from "@/lib/format";
import type { Product } from "@/lib/types";
import { ProductImage } from "./ProductImage";

/**
 * Two popular products with their cheapest price and store count, in the hero
 * (owner, 2026-11-05) so a first visit shows what the site does before a scroll.
 * Every region's pair is in the HTML and CSS shows the visitor's (.rp-XX), like
 * the tiles below. Nothing here is a heading: the hero's outline is unchanged.
 */
export function HeroPicks({ list }: { list?: Product[] }) {
  return (
    <div className="ky-picks">
      {REGIONS.map((r) => {
        const picks = heroPicks(r.code, list);
        if (!picks.length) return null;
        return (
          <div key={r.code} className={`rp rp-${r.code}`}>
            <p className="eyebrow mb-2.5 text-soft">Popular {r.phrase} · cheapest store first</p>
            <ul className="grid grid-cols-2 gap-3">
              {picks.map(({ f, lo, loStore, stores, save }) => {
                const short = f.brand && f.name.startsWith(f.brand) ? f.name.slice(f.brand.length).trim() : f.name;
                return (
                  <li key={f.ean} className="min-w-0">
                    <Link
                      prefetch={false}
                      href={`/product/${f.slug}`}
                      data-qv={f.slug}
                      data-qv-name={f.name}
                      data-qv-brand={f.brand || undefined}
                      data-qv-img={f.img || undefined}
                      className="card tile-hover group flex h-full flex-col overflow-hidden"
                    >
                      <div className="relative aspect-square bg-gradient-to-b from-white to-subtle">
                        <ProductImage src={f.img} alt={f.name} label={f.brand || "Product"} className="h-full w-full object-contain p-4 transition-transform duration-300 group-hover:scale-[1.03]" />
                        {save >= 0.1 && (
                          <span className="absolute left-2 top-2">
                            <span className="chip bg-save-pale text-save">Save {pct(save)}</span>
                          </span>
                        )}
                      </div>
                      <div className="flex flex-1 flex-col gap-1 border-t border-line p-3">
                        {f.brand && <p className="eyebrow truncate">{f.brand}</p>}
                        <p className="line-clamp-2 text-[13.5px] font-medium leading-snug text-ink">{short}</p>
                        <p className="mt-auto pt-1">
                          <span className="text-[17px] font-semibold tabular-nums text-accent-deep">{money(lo, r.code)}</span>
                          <span className="ml-1.5 text-xs text-soft">{stores} stores</span>
                        </p>
                        <p className="truncate text-xs text-soft">Cheapest at {storeName(loStore)}</p>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
