import type { Metadata } from "next";
import { PageHead } from "@/components/Section";
import { Browse } from "@/components/Browse";

export const metadata: Metadata = {
  title: "Search Korean skincare",
  robots: { index: false, follow: true },
  alternates: { canonical: "/search" },
};

export default function Search() {
  return (
    <div className="mx-auto max-w-6xl px-4 pb-40">
      <PageHead title="Search Korean skincare" sub="Type a brand, a product, an ingredient like snail or centella, or a 13-digit barcode, then narrow it down by type, brand, rating and price." />
      <Browse search />
    </div>
  );
}
