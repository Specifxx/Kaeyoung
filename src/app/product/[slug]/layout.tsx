import { notFound } from "next/navigation";
import { getProduct } from "@/lib/data";

// Product pages outside the prebuilt top 500 render on their first visit (DECISIONS.md 2026-11-06). The page streams
// behind loading.tsx, so a notFound() inside it answers 200; this layout sits outside that boundary, so a slug the
// release does not know gets a real 404 status before anything is sent.
export default function ProductLayout({ children, params }: { children: React.ReactNode; params: { slug: string } }) {
  if (!getProduct(params.slug)) notFound();
  return children;
}
