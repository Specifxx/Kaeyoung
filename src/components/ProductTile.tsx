import Link from "next/link";
import { REGIONS, type RegionCode } from "@/site";
import { bestIn, spreadIn } from "@/lib/data";
import { money, pct } from "@/lib/format";
import type { Product } from "@/lib/types";
import { ProductImage } from "./ProductImage";

/** A product card. With `region` it shows that region's price only (lists
 *  already split by region); without, every region's, switched by CSS. */
export function ProductTile({ f, region }: { f: Product; region?: RegionCode }) {
  const regions = region ? REGIONS.filter((r) => r.code === region) : REGIONS;
  const cls = (code: RegionCode) => (region ? "" : `rp rp-${code}`);
  const short = f.brand && f.name.startsWith(f.brand) ? f.name.slice(f.brand.length).trim() : f.name;
  return (
    <Link
      prefetch={false}
      href={`/product/${f.slug}`}
      // A plain click opens the quick view (QuickView.tsx); the link itself stays for crawlers and new tabs.
      data-qv={f.slug}
      data-qv-name={f.name}
      data-qv-brand={f.brand || undefined}
      data-qv-img={f.img || undefined}
      className="card tile-hover group flex flex-col overflow-hidden"
    >
      <div className="relative aspect-square bg-gradient-to-b from-white to-subtle">
        <ProductImage src={f.img} alt={f.name} label={f.brand || "K-beauty"} className="h-full w-full object-contain p-4 transition-transform duration-300 group-hover:scale-[1.03]" />
        {regions.map((r) => {
          const s = spreadIn(f, r.code);
          return s != null && s >= 0.1 ? (
            <span key={r.code} className={`${cls(r.code)} absolute left-2 top-2`}>
              <span className="chip bg-save-pale text-save">Save {pct(s)}</span>
            </span>
          ) : null;
        })}
      </div>
      <div className="flex flex-1 flex-col gap-1 border-t border-line p-3">
        {f.brand && <p className="eyebrow truncate">{f.brand}</p>}
        <h3 className="line-clamp-2 text-[13.5px] font-medium leading-snug text-ink">{short}</h3>
        <div className="mt-auto pt-1 text-sm">
          {regions.map((r) => {
            const b = bestIn(f, r.code);
            return (
              <p key={r.code} className={cls(r.code)}>
                {b ? (
                  <>
                    <span className="text-[15px] font-semibold tabular-nums text-accent-deep">{money(b.offer.p, r.code)}</span>
                    <span className="ml-1.5 text-xs text-soft">
                      {b.stores} store{b.stores === 1 ? "" : "s"}
                    </span>
                  </>
                ) : f.offers[r.code]?.length ? (
                  <span className="text-xs text-soft">Sold out {r.phrase}</span>
                ) : (
                  <span className="text-xs text-soft">Not sold {r.phrase} yet</span>
                )}
              </p>
            );
          })}
        </div>
      </div>
    </Link>
  );
}

export function TileGrid({ products, region }: { products: Product[]; region?: RegionCode }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
      {products.map((f) => (
        <ProductTile key={f.ean} f={f} region={region} />
      ))}
    </div>
  );
}
