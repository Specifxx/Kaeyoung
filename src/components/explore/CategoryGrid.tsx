// "Shop by category" as photo tiles (2026-11-10, the PriceRunner-style redesign): each
// section a tile of up to three of its most popular products' own store photos, its
// name and how many products it compares, so the first screen shows what is inside
// each door, not an icon. Plain links in the server HTML. Byte-identical in KaeYoung
// and ScentCompare; each site picks the sections and the photos.
import Link from "next/link";
import type { ReactNode } from "react";

export interface CategoryCard {
  href: string;
  name: string;
  count: number;
  /** up to three product photos, most popular first */
  imgs: string[];
  /** drawn when there is no photo */
  icon?: ReactNode;
  /** a tint class for the photo plate */
  tint?: string;
}

export function CategoryGrid({ cards }: { cards: CategoryCard[] }) {
  return (
    <ul data-reveal="stagger" className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {cards.map((c) => (
        <li key={c.href}>
          <Link prefetch={false} href={c.href} className="card tile-hover group flex h-full flex-col overflow-hidden">
            <div className={`ex-mosaic relative grid aspect-[4/3] grid-cols-3 items-end gap-1 px-2.5 pt-3 ${c.tint ?? "bg-subtle"}`}>
              {c.imgs.length ? (
                c.imgs.slice(0, 3).map((src, i) => (
                  <span key={src} className={`ex-mosaic-${i} block overflow-hidden rounded-xl bg-white`}>
                    <img src={src} alt={`${c.name}: a popular product`} loading="lazy" decoding="async" referrerPolicy="no-referrer" className="aspect-[3/4] w-full object-contain p-1 text-transparent transition-transform duration-300 group-hover:scale-[1.04]" />
                  </span>
                ))
              ) : (
                <span className="col-span-3 grid h-full place-items-center">{c.icon}</span>
              )}
            </div>
            <div className="flex items-center justify-between gap-2 border-t border-line px-3 py-2.5">
              <span className="min-w-0">
                <span className="block truncate font-display text-[15.5px] font-medium leading-tight sm:text-[17px]">{c.name}</span>
                <span className="mt-0.5 block text-xs tabular-nums text-soft">{c.count.toLocaleString("en-US")} compared</span>
              </span>
              <span aria-hidden className="text-soft transition group-hover:translate-x-0.5 group-hover:text-accent-deep">→</span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
