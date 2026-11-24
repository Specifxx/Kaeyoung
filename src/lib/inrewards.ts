// InRewards (Dealmoon group's affiliate network, owner's exception to "Impact + Awin only" for this site and
// ScentCompare, 2026-11-20). Its Open API turns one retailer URL into one tracked inrwd.me short link:
//   POST https://api.inrewards.com/openapi/influencer-marketing/v1/advertiser/conversion/link
//   header x-ir-authorization: Bearer <the API key secret>, body { originalUrl }, links under data.shortLinks.
// 60 requests a minute (InRewards, 2026-11-24). scripts/inrewards-links.ts converts each partner search URL
// once in GitHub Actions and keeps it in data/public/inrewards.json; pages only read that file, never the API.
// Regions: only where InRewards confirmed the merchant pays (US until their international check comes back).
import type { RegionCode } from "@/site";

export const INREWARDS_API = "https://api.inrewards.com/openapi/influencer-marketing/v1/advertiser/conversion/link";

export interface InrewardsFile {
  v: 1;
  /** Original retailer URL -> its inrwd.me short link. */
  links: Record<string, string>;
  /** Original URL -> the day (YYYY-MM-DD) InRewards refused it, so it is not asked again for a week. */
  refused: Record<string, string>;
  run?: { at: string; asked: number; made: number; refused: number; pending: number; error?: string };
}

export const emptyInrewards = (): InrewardsFile => ({ v: 1, links: {}, refused: {} });

/** A short link we trust: InRewards' own host, https. Anything else is ignored. */
export function isShortLink(u: unknown): u is string {
  return typeof u === "string" && /^https:\/\/(?:[a-z0-9-]+\.)?inrwd\.me\/[A-Za-z0-9_-]+$/.test(u.trim());
}

/** The first short link in an API answer (data.shortLinks: strings or objects carrying one). */
export function shortLinkFrom(body: unknown): string | null {
  const list = (body as { data?: { shortLinks?: unknown } } | null)?.data?.shortLinks;
  const items: unknown[] = Array.isArray(list) ? list : list ? [list] : [];
  for (const it of items) {
    if (isShortLink(it)) return it.trim();
    if (it && typeof it === "object") for (const v of Object.values(it)) if (isShortLink(v)) return v.trim();
  }
  return null;
}

/** The tracked short link for a partner's URL in a region, or null (no link yet, or InRewards does not pay there). */
export function inrewardsHref(file: InrewardsFile | null, regions: RegionCode[] | undefined, region: RegionCode, url: string): string | null {
  if (!file || !regions?.includes(region)) return null;
  const s = file.links[url];
  return isShortLink(s) ? s : null;
}

/** Whether a refused URL may be asked again (after seven days). */
export function mayRetry(refusedOn: string | undefined, today: string): boolean {
  if (!refusedOn) return true;
  return Date.parse(today) - Date.parse(refusedOn) >= 7 * 86_400_000;
}
