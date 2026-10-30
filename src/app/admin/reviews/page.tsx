import type { Metadata } from "next";
import { ReviewAdmin } from "@/components/reviews/ReviewAdmin";

// The owner's review moderation: a static shell; everything it shows comes
// from POST /api/reviews/admin with the key typed here (kept in this browser).
export const metadata: Metadata = { title: "Reviews admin", robots: { index: false, follow: false } };

export default function ReviewsAdmin() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="h-display text-3xl">Reviews</h1>
      <p className="mt-2 text-sm text-soft">Held reviews wait for you; published ones go live with the next daily update. Hide removes one at the next update.</p>
      <ReviewAdmin />
    </div>
  );
}
