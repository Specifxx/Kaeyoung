import type { Metadata } from "next";
import { SITE } from "@/site";
import { PageHead } from "@/components/Section";
import { Prose } from "@/components/Prose";
import { PremiumPanel } from "@/components/premium/PremiumPanel";
import { PREMIUM_PRICE_LINE } from "@/lib/premium-member";

// KaeYoung Premium (owner, 2026-11-19: "a premium feature … like with the deals and everything"). Static; the browser asks the
// shared account service. Comparing prices, the cheapest price and the deals page stay free for everyone.
const DESCRIPTION = `KaeYoung Premium: no banner ads and up to 200 price-drop and back-in-stock alerts on a watch list that follows you. ${PREMIUM_PRICE_LINE}. Comparing prices stays free.`;
export const metadata: Metadata = {
  title: "Premium: no ads, 200 price alerts",
  description: DESCRIPTION,
  alternates: { canonical: "/premium" },
};

export default function PremiumPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 pb-12">
      <PageHead
        eyebrow="New · 14 days free"
        title={`${SITE.name} Premium`}
        sub="Comparing K-beauty prices stays free, and so do price alerts, back-in-stock emails and today's deals. Premium is for people who watch a lot of products and want a calmer site."
      />
      <PremiumPanel />
      <div className="mt-8">
      <Prose>
        <h2>What you get</h2>
        <ul>
          <li><strong>No banner ads.</strong> The sponsored block and the phone ad dock disappear while you are signed in. Price tables, the stores in them and their order do not change.</li>
          <li><strong>Up to 200 alerts</strong> instead of 25: price drops at the price you pick, and an email when a sold-out product is back at any store in your region.</li>
          <li><strong>A watch list</strong> at <a href="/watches">My watch list</a>: every alert you have set, with today&rsquo;s lowest in-stock price, on every device you sign in on.</li>
        </ul>
        <h2>How it works</h2>
        <p>
          Sign in on {SITE.name} with Google, Discord or an emailed link (no password), pick monthly or yearly, and start the 14-day trial through Stripe&rsquo;s secure checkout.
          You are not charged until day 15, and you can cancel any time from <strong>Manage billing</strong> on this page. If it lapses, the extras stop; your free alerts keep working.
        </p>
        <h2>What it does not do</h2>
        <p>
          It does not change which stores are shown or in what order, hide any price, or promise stock: alerts use the same daily store check as the site, so a product that sells out within hours can be gone by the time you click.
          Prices are the lowest in-stock store price, before delivery.
        </p>
        <p>Questions? <a href={`mailto:${SITE.email}`}>{SITE.email}</a>.</p>
      </Prose>
      </div>
    </div>
  );
}
