import { notFound } from "next/navigation";
import { needOf } from "@/lib/needs";
import { NeedHub, needMetadata, needParams } from "@/components/NeedHub";

// Shop by need (lib/needs.ts): every hub with a product, prerendered at the release build.
export const dynamicParams = false;
export const generateStaticParams = () => needParams("concern");
export const generateMetadata = ({ params }: { params: { slug: string } }) => needMetadata("concern", params.slug);

export default function Page({ params }: { params: { slug: string } }) {
  if (!needOf("concern", params.slug)) notFound();
  return <NeedHub kind="concern" slug={params.slug} />;
}
