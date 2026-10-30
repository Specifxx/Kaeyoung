import Link from "next/link";
import { CAT_BY_KEY, type CatKey } from "@/site";
import { productsOfCat, storeCount } from "@/lib/data";
import { TileGrid } from "./ProductTile";
import { PageHead, Pager } from "./Section";

export const PER_PAGE = 48;

/** A category's products, most-stocked first (ties by name), 48 a page. */
export function catProducts(cat: CatKey) {
  return productsOfCat(cat).sort((a, b) => storeCount(b) - storeCount(a) || a.name.localeCompare(b.name));
}

export function pageCount(cat: CatKey) {
  return Math.max(1, Math.ceil(catProducts(cat).length / PER_PAGE));
}

export function CatHub({ cat, page }: { cat: CatKey; page: number }) {
  const c = CAT_BY_KEY[cat];
  const all = catProducts(cat);
  const pages = pageCount(cat);
  const list = all.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const href = (p: number) => (p === 1 ? `/${cat}` : `/${cat}/page/${p}`);
  return (
    <div className="mx-auto max-w-6xl px-4">
      <PageHead
        eyebrow="Shop by step"
        title={`${c.plural.replace(/^./, (x) => x.toUpperCase())} prices${page > 1 ? `, page ${page}` : ""}`}
        sub={
          <p>
            {c.about} {all.length.toLocaleString("en-US")} products compared across stores, matched by barcode, most widely stocked first. Prices show for your region; change it at the top.{" "}
            <Link prefetch={false} href={`/guides/cheapest-${cat}`} className="font-medium text-ink underline underline-offset-4">
              See the cheapest
            </Link>
            .
          </p>
        }
      />
      {list.length ? <TileGrid products={list} /> : <p className="card p-6 text-center text-soft">Nothing in stock anywhere yet.</p>}
      <Pager pages={pages} page={page} href={href} />
    </div>
  );
}
