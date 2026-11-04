import type { Metadata } from "next";
import { REGIONS, SITE } from "@/site";
import { STORES } from "@/content/stores";
import { PageHead } from "@/components/Section";
import { Prose } from "@/components/Prose";
import { ListYourStore } from "@/components/ListYourStore";

// The store-owner page every site in the family shares (owner, 2026-11-04).
export const metadata: Metadata = {
  title: "List your K-beauty store, free",
  description: "Run a store that sells Korean skincare? Get it listed on KaeYoung's price comparison for free: shoppers comparing prices go straight to your product pages.",
  alternates: { canonical: "/list-your-store" },
};

export default function Page() {
  const names = REGIONS.map((r) => r.name);
  const markets = `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
  return (
    <div className="mx-auto max-w-3xl px-4">
      <PageHead title="List your store on KaeYoung" />
      <Prose>
        <ListYourStore
          showTitle={false}
          site="KaeYoung"
          what="Korean skincare"
          markets={markets}
          storeCount={STORES.length}
          regions={REGIONS.map((r) => [r.code, r.name])}
          email={SITE.email}
          platforms="Shopify and WooCommerce"
          pricesRule="with three or more stores selling a product, a price under 40% of their median is dropped as a likely mistake"
          suggestHref="/stores#suggest"
          buttonClassName="btn-pop btn-buy px-6 py-2 text-sm"
        >
          <li><strong>The Korean barcode on each variant.</strong> We match products only by their EAN-13 (prefix 880), never by title, so a size or a variant without a barcode is left out.</li>
        </ListYourStore>
      </Prose>
    </div>
  );
}
