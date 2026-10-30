import Link from "next/link";
import { CAT_BY_KEY, type CatKey } from "@/site";
import { productsOfCat } from "@/lib/data";
import { popularity } from "@/lib/ratings";
import { TileGrid } from "./ProductTile";
import { PageHead, Pager } from "./Section";
import { CatIcon } from "./Art";
import { Browse } from "./Browse";

export const PER_PAGE = 48;

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
      <Browse cat={cat}>
        {list.length ? <TileGrid products={list} /> : <p className="card p-6 text-center text-soft">Nothing in stock anywhere yet.</p>}
        <Pager pages={pages} page={page} href={href} />
      </Browse>
    </div>
  );
}
