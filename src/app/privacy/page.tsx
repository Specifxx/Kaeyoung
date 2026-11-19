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
        <p>KaeYoung sets no cookies of its own. Accounts are optional: you can compare every price without one.</p>
        <ul>
          <li><strong>Your region and theme</strong> are guessed from your browser&apos;s time zone and kept in your browser&apos;s local storage. They never leave your device.</li>
          <li><strong>Ratings and reviews</strong> you send are published with the name you choose (or &ldquo;KaeYoung shopper&rdquo;) and the skin type you pick, if any. Reviews are stored publicly, so we keep nothing else about you: no IP address and no email. Don&rsquo;t write anything in a review you don&rsquo;t want public. Ask us to remove a review at the address below.</li>
          <li id="alerts"><strong>Accounts and price alerts.</strong> If you sign in (with Google, Discord or an emailed link) or set a price-drop or back-in-stock alert, your email address and the alerts you set are kept by the account and alert service we share with our other comparison sites, in the US, and used only to sign you in and send the emails you asked for. We email you once to confirm an alert, then only when it fires; every email has a stop link, and alerts end after six months. Your sign-in is kept in your browser&apos;s local storage, never a cookie. Premium is billed by Stripe, which holds your card details; we never see them. Ask us to delete your account or alerts at the address below.</li>
          <li><strong>Vercel Web Analytics</strong> counts page views and clicks on buy links without cookies and without identifying you.</li>
          <li><strong>Affiliate partners</strong> (eBay, Amazon, retailers, stores) may set their own cookies once you follow a link to their site, under their own privacy policies.</li>
          <li><strong>Product photos</strong> load from the stores&apos; own servers.</li>
        </ul>
        <p>Questions: <a href={`mailto:${SITE.email}`}>{SITE.email}</a>.</p>
      </Prose>
    </div>
  );
}
