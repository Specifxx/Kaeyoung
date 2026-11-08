import type { Metadata } from "next";
import { NeedIndex } from "@/components/NeedHub";

export const metadata: Metadata = {
  title: "Korean skincare by ingredient: compare prices",
  description: "Shop K-beauty by ingredient: centella, snail mucin, niacinamide, PDRN, retinol and more, with every store's price compared side by side.",
  alternates: { canonical: "/ingredients" },
};

export default function Page() {
  return <NeedIndex kind="ingredient" />;
}
