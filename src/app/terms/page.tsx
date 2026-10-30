import type { Metadata } from "next";
import { PageHead } from "@/components/Section";
import { Prose } from "@/components/Prose";

export const metadata: Metadata = { title: "Terms", alternates: { canonical: "/terms" } };

export default function Terms() {
  return (
    <div className="mx-auto max-w-3xl px-4">
      <PageHead title="Terms" />
      <Prose>
        <p>K Young is a free price guide. Prices and stock are what each store showed at our last check and can change at any time; the store&apos;s own page is always right. We do not sell anything and are not a party to any purchase.</p>
        <p>K Young is independent and not affiliated with or endorsed by any brand or store. Product names, trademarks and photos belong to their owners and are used to identify the products.</p>
        <p>Nothing on the site is medical or skincare advice. Patch-test new products and ask a dermatologist about skin conditions.</p>
        <p>Ratings and reviews are K Young visitors&apos; own opinions, not ours, and not verified purchases. Write only about a product you have used, in your own words: no links, contact details, advertising, copied text or claims that a product treats a medical condition. We may hold, edit out or remove any review, and reviews never change the order of prices. By sending one you let us publish it on K Young.</p>
        <p>The site is provided as is. Use it at your own risk.</p>
      </Prose>
    </div>
  );
}
