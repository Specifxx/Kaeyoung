// POST /api/reviews: a shopper's star rating and optional written review
// (DECISIONS.md "Ratings and reviews"). No account: spam is kept out by a
// same-site check, a hidden honeypot field, a minimum fill time, an optional
// Cloudflare Turnstile check, per-visitor limits on a hashed IP and the word
// rules in lib/reviews.ts (anything flagged waits for the owner). A review
// shows on the product page after the next daily release, never before.
// Runs only when someone presses Send; no page calls it.
import { SITE } from "@/site";
import { isKoreanEan } from "@/lib/ean";
import { MIN_FILL_SECONDS, validateReview } from "@/lib/reviews";
import { addReview, reviewsConfigured } from "@/lib/reviews-db";
import { clientIp, sameSite, verifyTurnstile } from "@/lib/reviews-http";

const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(req: Request) {
  if (!reviewsConfigured()) return json({ ok: false, error: "Reviews open soon. Please check back in a day or two." }, 503);
  if (!sameSite(req, SITE.url)) return json({ ok: false, error: "Please send your review from the product page." }, 403);
  const raw = await req.text().catch(() => "");
  if (raw.length > 12_000) return json({ ok: false, error: "That review is too long." }, 413);
  let body: Record<string, unknown>;
  try {
    body = JSON.parse(raw);
  } catch {
    return json({ ok: false, error: "Something went wrong. Please try again." }, 400);
  }
  // A bot fills the hidden field, or sends the form faster than anyone can read it.
  // It gets a thank-you and nothing is saved.
  const elapsed = Number(body.elapsed);
  if (body.website || !Number.isFinite(elapsed) || elapsed < MIN_FILL_SECONDS) return json({ ok: true, status: "published" });
  const v = validateReview(body);
  if (!v.ok) return json({ ok: false, error: v.error }, 400);
  if (!isKoreanEan(v.review.ean)) return json({ ok: false, error: "That product isn't one we compare." }, 400);
  const ip = clientIp(req);
  if (!(await verifyTurnstile(body.turnstile, ip))) return json({ ok: false, error: "Please tick the check box and send again." }, 400);
  try {
    const r = await addReview(v.review, ip);
    return r.ok ? json(r) : json({ ok: false, error: r.error }, r.code);
  } catch (e) {
    console.error("review insert failed", (e as Error).message);
    return json({ ok: false, error: "We couldn't save that just now. Please try again in a minute." }, 500);
  }
}
