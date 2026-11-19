import type { Metadata } from "next";
import { PageHead } from "@/components/Section";
import { WatchesView } from "@/components/premium/WatchesView";

// The member's watch list (owner, 2026-11-19): every price-drop and back-in-stock alert set with their account, read in the browser.
export const metadata: Metadata = { title: "My watch list", robots: { index: false, follow: true }, alternates: { canonical: "/watches" } };

export default function WatchesPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 pb-12">
      <PageHead title="My watch list" sub="The products you're waiting on: price-drop and back-in-stock alerts, on every device you sign in on." />
      <WatchesView />
    </div>
  );
}
