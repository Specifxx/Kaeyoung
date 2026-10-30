import type { Metadata } from "next";
import { PageHead } from "@/components/Section";
import { Basket } from "@/components/Basket";

export const metadata: Metadata = {
  title: "Compare a whole K-beauty basket, delivery included",
  description: "Add the Korean skincare you want and see which single store sells it all for the least, with each store's own delivery cost and free-delivery threshold.",
  alternates: { canonical: "/basket" },
};

export default function BasketPage() {
  return (
    <div className="mx-auto max-w-6xl px-4">
      <PageHead
        eyebrow="Basket"
        title="Compare a whole basket"
        sub="The cheapest store for one toner isn't always the cheapest for three items once delivery is added. Add what you want to buy and see each store's total, with its own delivery cost and free-delivery threshold."
      />
      <Basket />
    </div>
  );
}
