import type { Metadata } from "next";
import { STORES } from "@/content/stores";
import { PageHead } from "@/components/Section";
import { Prose } from "@/components/Prose";
import { HowWePickStores } from "@/components/HowWePickStores";

export const metadata: Metadata = {
  title: "How we pick stores",
  description: "How KaeYoung checks every K-beauty store before listing it, keeps checking it, and how to report one.",
  alternates: { canonical: "/how-we-pick-stores" },
};

export default function Page() {
  return (
    <div className="mx-auto max-w-3xl px-4">
      <PageHead title="How we pick stores" />
      <Prose>
        <HowWePickStores
          showTitle={false}
          family={false}
          site="KaeYoung"
          what="Korean skincare"
          stores={STORES.map((s) => s.name)}
          priceRule="Every product is matched only by its Korean barcode, so a fake or a different size can't borrow a real product's page, and with three or more stores selling it, a price under 40% of their median is dropped automatically."
          marketplaces="eBay, Amazon and the partner retailers pinned above the stores are labelled as paid links and never counted as a store or as the cheapest. We don't vet the individual eBay and Amazon sellers, so check a seller's feedback before you buy."
          buttonClassName="btn-pop"
          suggestHref="/stores#suggest"
        />
      </Prose>
    </div>
  );
}
