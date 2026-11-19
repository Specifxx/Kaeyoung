import type { Metadata } from "next";
import { SignIn } from "@/components/premium/SignIn";

// Sign in ON KaeYoung (owner, 2026-11-19): Google, Discord or an emailed link; the account lives with the shared account service
// (lib/premium-member.ts). Static: everything happens in the browser.
export const metadata: Metadata = { title: "Sign in", robots: { index: false, follow: true }, alternates: { canonical: "/account" } };

export default function AccountPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:py-16">
      <SignIn />
    </div>
  );
}
