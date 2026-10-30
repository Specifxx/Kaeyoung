import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CATEGORIES, CAT_BY_KEY, type CatKey } from "@/site";
import { CatHub } from "@/components/CatHub";

export const dynamicParams = false;
export const generateStaticParams = () => CATEGORIES.map((c) => ({ cat: c.key }));

export function generateMetadata({ params }: { params: { cat: string } }): Metadata {
  const c = CAT_BY_KEY[params.cat as CatKey];
  if (!c) return {};
  const P = c.plural.replace(/^./, (x) => x.toUpperCase());
  return {
    title: `${P} prices: compare every store`,
    description: `Compare ${c.plural} prices across real K-beauty stores in the US, UK, Canada, Australia, New Zealand and Europe. Matched by barcode, size by size, updated daily.`,
    alternates: { canonical: `/${c.key}` },
  };
}

export default function CatPage({ params }: { params: { cat: string } }) {
  if (!CAT_BY_KEY[params.cat as CatKey]) notFound();
  return <CatHub cat={params.cat as CatKey} page={1} />;
}
