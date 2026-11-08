import type { Metadata } from "next";
import { NeedIndex } from "@/components/NeedHub";

export const metadata: Metadata = {
  title: "Korean skincare by skin concern: compare prices",
  description: "Shop K-beauty by skin concern: acne, dryness, dark spots, redness, fine lines, pores and barrier care, with every store's price compared.",
  alternates: { canonical: "/skin-concerns" },
};

export default function Page() {
  return <NeedIndex kind="concern" />;
}
