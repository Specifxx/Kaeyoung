import type { Metadata } from "next";
import { SITE } from "@/site";
import { STORES } from "@/content/stores";
import { PageHead } from "@/components/Section";
import { Prose } from "@/components/Prose";

export const metadata: Metadata = {
  title: "About K Young and how matching works",
  description: "How K Young compares Korean skincare prices: barcode matching, real K-beauty stores only, daily price checks, and how the site is paid for.",
  alternates: { canonical: "/about" },
};

export default function About() {
  return (
    <div className="mx-auto max-w-3xl px-4">
      <PageHead title="About K Young" sub="An independent price guide for Korean skincare. Stay young, pay less." />
      <Prose>
        <p>
          K Young checks {STORES.length} real K-beauty stores every day and shows every store&apos;s price for the same product, side by side, in your own currency: the US, UK, Canada, Australia, New Zealand and Europe.
        </p>
        <h2>How a product is matched</h2>
        <p>
          Every Korean beauty product carries a 13-digit barcode starting with 880, Korea&apos;s barcode prefix. We match store listings <strong>only</strong> by that barcode, size by size. A listing without one is left out rather than guessed from its title, because the 30 ml and the 100 ml, the old and new packaging, a single sheet and a box of ten all look alike in a title.
        </p>
        <p>Testers, samples, short-dated stock, damaged boxes and store-made bundles are left out too. A product gets a page once at least two stores in one region sell it: comparing one shop is not a comparison.</p>
        <h2>Which stores</h2>
        <p>
          Specialist K-beauty shops that sell new, sealed product, many of them authorised stockists of the brands they carry. No open marketplaces in the store list, because counterfeit skincare is common there. eBay, Amazon and other retailers appear above the store prices as clearly labelled links, never as &quot;the cheapest store&quot;.
        </p>
        <h2>Prices and currencies</h2>
        <p>
          Each region shows prices in its own currency, exactly as the store lists them. We never convert currencies. Prices exclude shipping, tax and import charges, which depend on where you live; many stores ship free above a minimum order.
        </p>
        <h2>Why there is no Korea region</h2>
        <p>
          Shoppers in Korea pay domestic prices at Olive Young and Coupang, which no comparison can read, and the stores we compare sell abroad. Korean-based shops that ship worldwide in US dollars are listed with the US stores.
        </p>
        <h2>How the site is paid for</h2>
        <p>
          Some links pay us a small commission if you buy, at no cost to you. That never changes the order: stores are always sorted by price. See the <a href="/disclosure">affiliate disclosure</a>. No sign-up, no accounts, no pop-ups.
        </p>
        <h2>Spotted a mistake? Want a store added?</h2>
        <p>
          Email <a href={`mailto:${SITE.email}`}>{SITE.email}</a>.
        </p>
      </Prose>
    </div>
  );
}
