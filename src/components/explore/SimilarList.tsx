// "Similar products" beside a product's price table (2026-11-10, the PriceRunner-style
// redesign): a compact list of the products shoppers cross-check, with each one's
// lowest store price and store count for every region (CSS shows the visitor's), so
// the next click is one glance away instead of a scroll to the bottom. Plain links in
// the server HTML. Byte-identical in KaeYoung and ScentCompare.
import Link from "next/link";
import { REGIONS } from "@/site";
import { bestIn } from "@/lib/data";
import { money } from "@/lib/format";
import type { Product } from "@/lib/types";
import { ProductImage } from "../ProductImage";

export function SimilarList({ title, products, more }: { title: string; products: Product[]; more?: { href: string; label: string } }) {
  if (!products.length) return null;
  return (
    <div className="card p-5">
      <h2 className="h-display mb-3 text-lg">{title}</h2>
      <ul className="divide-y divide-line">
        {products.map((f) => {
          const short = f.brand && f.name.startsWith(f.brand) ? f.name.slice(f.brand.length).trim() : f.name;
          return (
            <li key={f.ean}>
              <Link prefetch={false} href={`/product/${f.slug}`} data-qv={f.slug} data-qv-name={f.name} data-qv-brand={f.brand || undefined} data-qv-img={f.img || undefined} className="group flex items-center gap-3 py-2.5">
                <span className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-line bg-white">
                  <ProductImage src={f.img} alt={f.name} label={f.brand?.slice(0, 10) || "·"} className="h-full w-full object-contain p-1" />
                </span>
                <span className="min-w-0 flex-1">
                  {f.brand && <span className="eyebrow block truncate">{f.brand}</span>}
                  <span className="line-clamp-2 text-[13px] font-medium leading-snug group-hover:underline">{short}</span>
                </span>
                <span className="shrink-0 text-right text-xs text-soft">
                  {REGIONS.map((r) => {
                    const b = bestIn(f, r.code);
                    return (
                      <span key={r.code} className={`rp rp-${r.code}`}>
                        {b ? (
                          <>
                            <span className="block text-sm font-semibold tabular-nums text-accent-deep">{money(b.offer.p, r.code)}</span>
                            {b.stores} store{b.stores === 1 ? "" : "s"}
                          </>
                        ) : (
                          "Not in stock"
                        )}
                      </span>
                    );
                  })}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
      {more && (
        <Link prefetch={false} href={more.href} className="mt-3 inline-block text-sm font-semibold text-accent-deep underline-offset-4 hover:underline">
          {more.label} →
        </Link>
      )}
    </div>
  );
}
