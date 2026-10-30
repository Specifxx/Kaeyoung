// POST /api/reviews/admin: the owner's moderation (the page is /admin/reviews,
// a static shell). The key travels in the JSON body only, never a URL, and is
// compared in constant time; without REVIEWS_ADMIN_KEY (24+ characters) every
// call is refused. Actions: list, publish <id>, hide <id>. A change shows on
// the site at the next daily release.
import { SITE } from "@/site";
import { adminList, reviewsConfigured, setStatus } from "@/lib/reviews-db";
import { adminKeyOk, sameSite } from "@/lib/reviews-http";

const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(req: Request) {
  if (!sameSite(req, SITE.url)) return json({ ok: false, error: "forbidden" }, 403);
  let body: { key?: unknown; action?: unknown; id?: unknown };
  try {
    body = await req.json();
  } catch {
    return json({ ok: false, error: "bad request" }, 400);
  }
  if (!adminKeyOk(body.key, process.env.REVIEWS_ADMIN_KEY)) return json({ ok: false, error: "wrong key" }, 401);
  if (!reviewsConfigured()) return json({ ok: false, error: "the reviews database is not set" }, 503);
  try {
    if (body.action === "list") return json({ ok: true, rows: await adminList() });
    const id = Number(body.id);
    if ((body.action === "publish" || body.action === "hide") && Number.isInteger(id) && id > 0) {
      return json({ ok: await setStatus(id, body.action === "publish" ? "published" : "hidden") });
    }
    return json({ ok: false, error: "unknown action" }, 400);
  } catch (e) {
    return json({ ok: false, error: (e as Error).message }, 500);
  }
}
