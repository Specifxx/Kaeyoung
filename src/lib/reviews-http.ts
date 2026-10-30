// Request checks for the two /api/reviews routes (server only).
import { timingSafeEqual } from "node:crypto";

/** The request comes from our own pages: Origin (or Referer) is the site, a
 *  Vercel deployment of it, or localhost in development. */
export function sameSite(req: Request, siteUrl: string): boolean {
  const from = req.headers.get("origin") || req.headers.get("referer");
  if (!from) return false;
  let host: string;
  try {
    host = new URL(from).host;
  } catch {
    return false;
  }
  const site = new URL(siteUrl).host;
  return host === site || host === `www.${site}` || host === req.headers.get("host") || /^localhost(:\d+)?$/.test(host);
}

/** Vercel puts the visitor's address first in x-forwarded-for. */
export function clientIp(req: Request): string {
  return (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || req.headers.get("x-real-ip") || "unknown";
}

/** Cloudflare Turnstile, only once TURNSTILE_SECRET_KEY is set (the form shows
 *  the widget only when NEXT_PUBLIC_TURNSTILE_SITE_KEY was set at build). */
export async function verifyTurnstile(token: unknown, ip: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;
  if (typeof token !== "string" || !token) return false;
  try {
    const r = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: new URLSearchParams({ secret, response: token, remoteip: ip }),
      signal: AbortSignal.timeout(8000),
    });
    return Boolean(((await r.json()) as { success?: boolean }).success);
  } catch {
    return false;
  }
}

export function adminKeyOk(given: unknown, expected: string | undefined): boolean {
  if (!expected || expected.length < 24 || typeof given !== "string") return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
