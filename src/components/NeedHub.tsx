import type { Metadata } from "next";
import Link from "next/link";
import { CATEGORIES } from "@/site";
import { needHubs, productsForNeed } from "@/lib/data";
import { needIndexable, needOf, needPath, type Need, type NeedKind } from "@/lib/needs";
import { TileGrid } from "./ProductTile";
import { PageHead } from "./Section";
import { Crumbs } from "@/lib/seo";

// Shop by need (lib/needs.ts, DECISIONS.md 2026-11-08): one hub per ingredient or skin concern, from the words in each
// product's own name. Prerendered at the release build like the brand pages; noindex until NEED_INDEX_MIN products.

const PER_SECTION = 12;
const ROOT: Record<NeedKind, { path: string; name: string; eyebrow: string }> = {
  ingredient: { path: "/ingredients", name: "Ingredients", eyebrow: "Shop by ingredient" },
  concern: { path: "/skin-concerns", name: "Skin concerns", eyebrow: "Shop by skin concern" },
};
const lower = (n: Need) => n.name.replace(/^./, (x) => x.toLowerCase()).replace(/\b(AHA|BHA|PHA|PDRN|DNA)\b/gi, (x) => x.toUpperCase());

export const needParams = (kind: NeedKind) => needHubs(kind).map((h) => ({ slug: h.need.slug }));

export function needMetadata(kind: NeedKind, slug: string): Metadata {
  const n = needOf(kind, slug);
  if (!n) return {};
  const count = productsForNeed(kind, slug).length;
  const title =
    kind === "ingredient"
      ? `${n.name} K-beauty: compare ${count} products' prices`
      : `Korean skincare for ${lower(n)}: ${count} products compared`;
  return {
    title,
    description:
      kind === "ingredient"
        ? `${count} Korean skincare products named for ${lower(n)}, with every K-beauty store's price compared side by side in the US, UK, Canada, Australia, New Zealand and Europe. Matched by barcode, updated daily.`
        : `${count} Korean skincare products whose names say they are for ${lower(n)}, with every K-beauty store's price compared side by side. Matched by barcode, updated daily.`,
    alternates: { canonical: needPath(n) },
    ...(needIndexable(count) ? {} : { robots: { index: false, follow: true } }),
  };
}

export function NeedHub({ kind, slug }: { kind: NeedKind; slug: string }) {
  const n = needOf(kind, slug)!;
  const list = productsForNeed(kind, slug);
  const root = ROOT[kind];
  const cats = CATEGORIES.map((c) => ({ c, items: list.filter((f) => f.cat === c.key) })).filter((x) => x.items.length);
  const live = new Set(needHubs().map((h) => `${h.need.kind}:${h.need.slug}`));
  const related = (kind === "concern" ? (n.ingredients ?? []).map((s) => needOf("ingredient", s)) : needHubs("concern").filter((h) => h.need.ingredients?.includes(n.slug)).map((h) => h.need)).filter(
    (x): x is Need => !!x && live.has(`${x.kind}:${x.slug}`),
  );
  return (
    <div className="mx-auto max-w-6xl px-4">
      <Crumbs items={[{ name: root.name, path: root.path }, { name: n.name, path: needPath(n) }]} />
      <PageHead
        eyebrow={root.eyebrow}
        title={kind === "ingredient" ? `${n.name} skincare prices` : `Skincare for ${lower(n)}`}
        sub={
          <p>
            {n.about} {list.length.toLocaleString("en-US")} {list.length === 1 ? "product whose own name says" : "products whose own names say"} {kind === "ingredient" ? lower(n) : "so"}, most popular first, with every store&apos;s price for your region. We go by the name on the bottle, not a full ingredient list, and nothing here is medical advice: patch-test anything new.
          </p>
        }
      />
      {related.length > 0 && (
        <section className="mb-8">
          <h2 className="eyebrow mb-2">{kind === "concern" ? "Ingredients shoppers look at for this" : "Skin concerns it's often bought for"}</h2>
          <ul className="flex flex-wrap gap-2">
            {related.map((r) => (
              <li key={r.slug}>
                <Link prefetch={false} href={needPath(r)} className="chip border border-line bg-card py-1.5 text-sm text-ink hover:border-soft">
                  {r.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
      {cats.map(({ c, items }) => (
        <section key={c.key} className="mb-10">
          <h2 className="h-display mb-4 text-xl">
            {c.name} <span className="text-base text-soft">({items.length})</span>
          </h2>
          <TileGrid products={items.slice(0, PER_SECTION)} />
          {items.length > PER_SECTION && (
            <p className="mt-3 text-sm text-soft">
              Showing the {PER_SECTION} most popular of {items.length}.{" "}
              <Link prefetch={false} href={`/search?q=${encodeURIComponent(n.name.replace(/\s*\(.*\)/, ""))}`} rel="nofollow" className="font-medium text-ink underline underline-offset-4">
                Search for more
              </Link>
              .
            </p>
          )}
        </section>
      ))}
    </div>
  );
}

export function NeedIndex({ kind }: { kind: NeedKind }) {
  const root = ROOT[kind];
  const hubs = needHubs(kind);
  const other = kind === "ingredient" ? ROOT.concern : ROOT.ingredient;
  return (
    <div className="mx-auto max-w-6xl px-4">
      <Crumbs items={[{ name: root.name, path: root.path }]} />
      <PageHead
        eyebrow={root.eyebrow}
        title={kind === "ingredient" ? "Korean skincare by ingredient" : "Korean skincare by skin concern"}
        sub={
          <p>
            {kind === "ingredient"
              ? "Centella, snail mucin, niacinamide, PDRN: pick an ingredient and compare every product named for it across real K-beauty stores."
              : "Pick what you are shopping for and compare every product whose name says it is made for it, across real K-beauty stores."}{" "}
            Or shop{" "}
            <Link prefetch={false} href={other.path} className="font-medium text-ink underline underline-offset-4">
              {other.name.toLowerCase()}
            </Link>
            .
          </p>
        }
      />
      <ul className="mb-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {hubs.map(({ need, count }) => (
          <li key={need.slug}>
            <Link prefetch={false} href={needPath(need)} className="card block h-full p-4 hover:border-soft">
              <span className="h-display text-lg">{need.name}</span>
              <span className="ml-2 text-sm text-soft">{count.toLocaleString("en-US")} product{count === 1 ? "" : "s"}</span>
              <span className="mt-1 block text-sm leading-relaxed text-soft">{need.about}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
