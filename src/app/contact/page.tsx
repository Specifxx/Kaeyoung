import type { Metadata } from "next";
import { SITE } from "@/site";
import { PageHead } from "@/components/Section";
import { Prose } from "@/components/Prose";

// The address, said plainly and linked from every footer (owner, 2026-10-30).
// The two forms (a wrong price, a store to add) live where they are used: under
// every product's prices and on /stores (DECISIONS.md, 2026-10-31).
export const metadata: Metadata = {
  title: "Contact us",
  description: `Email K Young at ${SITE.email}: a wrong price or product match, a store to add or remove, a review to take down, press and partnerships.`,
  alternates: { canonical: "/contact" },
};

const mail = (subject: string) => `mailto:${SITE.email}?subject=${encodeURIComponent(subject)}`;

export default function Contact() {
  return (
    <div className="mx-auto max-w-3xl px-4">
      <PageHead title="Contact us" />
      <Prose>
        <p>
          Email <a href={`mailto:${SITE.email}`}><strong>{SITE.email}</strong></a>. A person reads every message, usually within two working days.
        </p>
        <p>
          Seen a wrong price? Use <strong>Report a wrong price</strong> under the product&apos;s prices, and <a href="/stores#suggest">suggest a store</a> on the stores page: no email needed.
        </p>
        <ul>
          <li><a href={mail("Wrong price or product")}>A wrong price or the wrong product</a>: the K Young page, the store, and what is wrong (a size or a shade helps).</li>
          <li><a href={mail("Store listing")}>Stores</a>: to be listed, to fix a listing, or to be removed. Listing is free and never changes the order of prices.</li>
          <li><a href={mail("Missing product")}>A product we don&apos;t list yet</a>.</li>
          <li><a href={mail("Remove a review")}>A review to take down</a>: the product page and the review.</li>
          <li><a href={mail("Press or partnership")}>Press, partnerships and affiliate programmes</a>.</li>
        </ul>
      </Prose>
    </div>
  );
}
