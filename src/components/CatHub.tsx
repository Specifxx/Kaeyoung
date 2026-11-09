import Link from "next/link";
import { CAT_BY_KEY, type CatKey } from "@/site";
import { brandPages, productsOfCat } from "@/lib/data";
import { popularity } from "@/lib/ratings";
import { TileGrid } from "./ProductTile";
import { PageHead, Pager } from "./Section";
import { CatIcon } from "./Art";
import { Browse } from "./Browse";
import { Crumbs } from "@/lib/seo";
import { HUB_PER_PAGE } from "@/lib/sitemap";

export const PER_PAGE = HUB_PER_PAGE;

/** A category's products, most popular first (ties by name), 48 a page. */
export function catProducts(cat: CatKey) {
  return productsOfCat(cat)
    .map((f) => ({ f, p: popularity(f) }))
    .sort((a, b) => b.p - a.p || a.f.name.localeCompare(b.f.name))
    .map((x) => x.f);
}

export function pageCount(cat: CatKey) {
  return Math.max(1, Math.ceil(catProducts(cat).length / PER_PAGE));
}

/** The brands with a page that have the most products in this list, for the "Shop by brand" row: [slug, name, count], most first. */
export function topBrandsOf(list: { b: string; brand: string }[], max = 12): [string, string, number][] {
  const pages = brandPages();
  const c = new Map<string, [string, number]>();
  for (const f of list) if (f.b && pages.has(f.b)) c.set(f.b, [f.brand, (c.get(f.b)?.[1] ?? 0) + 1]);
  return [...c.entries()].map(([slug, [name, n]]): [string, string, number] => [slug, name, n]).sort((a, b) => b[2] - a[2] || a[1].localeCompare(b[1])).slice(0, max);
}

export function CatHub({ cat, page }: { cat: CatKey; page: number }) {
  const c = CAT_BY_KEY[cat];
  const all = catProducts(cat);
  const pages = pageCount(cat);
  const brands = topBrandsOf(all);
  const list = all.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const href = (p: number) => (p === 1 ? `/${cat}` : `/${cat}/page/${p}`);
  return (
    <div className="mx-auto max-w-6xl px-4">
      <Crumbs items={[{ name: c.plural.replace(/^./, (x) => x.toUpperCase()), path: href(1) }]} />
      <PageHead
        eyebrow="Shop by step"
        art={<CatIcon cat={cat} size={150} />}
        title={`${c.plural.replace(/^./, (x) => x.toUpperCase())} prices${page > 1 ? `, page ${page}` : ""}`}
        sub={
          <p>
            {c.about} {all.length.toLocaleString("en-US")} products compared across stores, matched by barcode, most popular first. Sort and filter by brand, rating or stock below. Prices show for your region; change it at the top.{" "}
            <Link prefetch={false} href={`/guides/cheapest-${cat}`} className="font-medium text-ink underline underline-offset-4">
              See the cheapest
            </Link>
            .
          </p>
        }
      />
      {brands.length > 1 && (
        <nav aria-label={`${c.name} by brand`} className="mb-5">
          <p className="eyebrow mb-2">Shop {c.name.toLowerCase()} by brand</p>
          <ul className="flex flex-wrap gap-2">
            {brands.map(([slug, name, n]) => (
              <li key={slug}>
                <Link prefetch={false} href={`/brands/${slug}`} className="inline-flex items-center gap-1.5 rounded-full border border-line bg-card px-3 py-1 text-sm hover:border-soft">
                  {name} <span className="text-xs text-soft">{n}</span>
                </Link>
              </li>
            ))}
            <li>
              <Link prefetch={false} href="/brands" className="inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold text-accent-deep">
                All brands →
              </Link>
            </li>
          </ul>
        </nav>
      )}
      <Browse cat={cat}>
        {list.length ? <TileGrid products={list} /> : <p className="card p-6 text-center text-soft">Nothing in stock anywhere yet.</p>}
        <Pager pages={pages} page={page} href={href} />
      </Browse>
    </div>
  );
}
