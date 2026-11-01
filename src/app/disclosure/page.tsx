import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/site";
import { STORES } from "@/content/stores";
import { PageHead } from "@/components/Section";
import { Prose } from "@/components/Prose";

export const metadata: Metadata = {
  title: "How we make money (affiliate disclosure)",
  description: "How KaeYoung is paid for, which links can earn us a commission, and why commission never changes the order of prices.",
  alternates: { canonical: "/disclosure" },
};

export default function Disclosure() {
  const paying = STORES.filter((s) => s.affiliate && process.env[s.affiliate.envVar]).length;
  return (
    <div className="mx-auto max-w-3xl px-4">
      <PageHead title="How we make money" sub="The short version: some links can earn us a commission. They are labelled, and they never change which store is shown as cheapest." />
      <Prose>
        <p>KaeYoung is free to use, with no sign-up and no banner ads. It is paid for by affiliate links: if you buy after following one, the retailer may pay us a commission. You pay the same price.</p>
        <h2>Which links can earn us money</h2>
        <ul>
          <li><strong>eBay</strong> (eBay Partner Network): the eBay row above the stores on a product page.</li>
          <li><strong>Amazon</strong> (Amazon Associates, US and Australia): the Amazon row above the stores. As an Amazon Associate we earn from qualifying purchases.</li>
          <li><strong>Big beauty retailers</strong> such as YesStyle, Stylevana, Olive Young Global and iHerb, through their own programs or networks such as Awin, Impact, FlexOffers and Involve Asia, only once they accept us. Until then their links are plain searches that earn nothing.</li>
          <li>
            <strong>Stores in the comparison:</strong> {paying ? `${paying} of the ${STORES.length} stores pay us a commission, and their rows say "Paid link".` : `none of the ${STORES.length} stores pays us today. If one ever does, its row will say "Paid link".`}
          </li>
        </ul>
        <p>Every link that can pay us says &quot;Paid link&quot; or &quot;Ad&quot; next to it and carries rel=&quot;sponsored&quot;.</p>
        <h2>What commission never does</h2>
        <ul>
          <li>It never changes the order. Stores are sorted by their item price, cheapest first, by a program that does not know who pays.</li>
          <li>It never makes a row &quot;the cheapest&quot;. eBay, Amazon and the big retailers sit in their own labelled rows, apart from the stores, and are never counted as a store.</li>
          <li>It never decides which stores we list. We list every specialist K-beauty shop we can read reliably, paying or not; we leave out open marketplaces because counterfeits are common there.</li>
        </ul>
        <h2>The referral tag on store links</h2>
        <p>Links to stores that pay us nothing carry a referral tag (utm_source={SITE.domain}) so the store can see we sent you. It doesn&apos;t change the price or track you across sites.</p>
        <h2>How accurate are the prices?</h2>
        <p>
          Prices are read from each store&apos;s own site once a day, and delivery quotes once a week. They can change between checks, so the store&apos;s checkout is always the final word. More on how we check, and what we leave out, is on{" "}
          <Link prefetch={false} href="/about">how it works</Link>. Found a wrong price? Email <a href={`mailto:${SITE.email}?subject=Wrong%20price`}>{SITE.email}</a>.
        </p>
      </Prose>
    </div>
  );
}
