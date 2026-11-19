import { buildAlertFeed } from "@/lib/alert-feed";

// The static price feed the shared alert service reads once a day (lib/alert-feed.ts). Written at the release build and served from
// the CDN until the next one: no function runs for it.
export const dynamic = "force-static";

export function GET() {
  return new Response(JSON.stringify(buildAlertFeed()), { headers: { "Content-Type": "application/json; charset=utf-8" } });
}
