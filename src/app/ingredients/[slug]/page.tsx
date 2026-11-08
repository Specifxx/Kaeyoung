import { notFound } from "next/navigation";
import { needOf } from "@/lib/needs";
import { NeedHub, needMetadata, needParams } from "@/components/NeedHub";

// Shop by need (lib/needs.ts): every hub with a product, prerendered at the release build.
export const dynamicParams = false;
export const generateStaticParams = () => needParams("ingredient");
export const generateMetadata = ({ params }: { params: { slug: string } }) => needMetadata("ingredient", params.slug);

export default function Page({ params }: { params: { slug: string } }) {
  if (!needOf("ingredient", params.slug)) notFound();
  return <NeedHub kind="ingredient" slug={params.slug} />;
}
