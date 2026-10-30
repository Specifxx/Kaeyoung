import type { Metadata } from "next";
import { SITE } from "@/site";
import { PageHead } from "@/components/Section";
import { Prose } from "@/components/Prose";

export const metadata: Metadata = { title: "Privacy", alternates: { canonical: "/privacy" } };

export default function Privacy() {
  return (
    <div className="mx-auto max-w-3xl px-4">
      <PageHead title="Privacy" />
      <Prose>
        <p>K Young has no accounts and no sign-in, and sets no cookies of its own. The one form is the product rating form.</p>
        <ul>
          <li><strong>Your region and theme</strong> are guessed from your browser&apos;s time zone and kept in your browser&apos;s local storage. They never leave your device.</li>
          <li><strong>Ratings and reviews</strong> you send are published with the name you choose (or &ldquo;K Young shopper&rdquo;) and the skin type you pick, if any. Reviews are stored publicly, so we keep nothing else about you: no IP address and no email. Don&rsquo;t write anything in a review you don&rsquo;t want public. Ask us to remove a review at the address below.</li>
          <li><strong>Vercel Web Analytics</strong> counts page views and clicks on buy links without cookies and without identifying you.</li>
          <li><strong>Affiliate partners</strong> (eBay, Amazon, retailers, stores) may set their own cookies once you follow a link to their site, under their own privacy policies.</li>
          <li><strong>Product photos</strong> load from the stores&apos; own servers.</li>
        </ul>
        <p>Questions: <a href={`mailto:${SITE.email}`}>{SITE.email}</a>.</p>
      </Prose>
    </div>
  );
}
