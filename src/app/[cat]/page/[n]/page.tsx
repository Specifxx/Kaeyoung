import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CATEGORIES, CAT_BY_KEY, type CatKey } from "@/site";
import { CatHub, pageCount } from "@/components/CatHub";

export const dynamicParams = false;
export function generateStaticParams() {
  return CATEGORIES.flatMap((c) => Array.from({ length: pageCount(c.key) - 1 }, (_, i) => ({ cat: c.key, n: String(i + 2) })));
}

export function generateMetadata({ params }: { params: { cat: string; n: string } }): Metadata {
  const c = CAT_BY_KEY[params.cat as CatKey];
  if (!c) return {};
  return {
    title: `${c.plural.replace(/^./, (x) => x.toUpperCase())} prices, page ${params.n}`,
    alternates: { canonical: `/${c.key}/page/${params.n}` },
  };
}

export default function CatPaged({ params }: { params: { cat: string; n: string } }) {
  const cat = params.cat as CatKey;
  const n = Number(params.n);
  if (!CAT_BY_KEY[cat] || !Number.isInteger(n) || n < 2 || n > pageCount(cat)) notFound();
  return <CatHub cat={cat} page={n} />;
}
