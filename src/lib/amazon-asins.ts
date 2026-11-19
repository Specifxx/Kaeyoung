// Each product's Amazon ASIN per region, found by scripts/amazon-asins.ts in the daily import and committed to
// data/amazon/asins-<REGION>.json (Amazon lets an ASIN be stored; its prices never are). A miss is kept too,
// with the day it was checked, so it is retried only after RECHECK_MISS_DAYS. Read by the build's price fetch
// (scripts/fetch-amazon-prices.ts) and, since 2026-11-17, by the unpriced "Check on Amazon" row (components/PriceTable.tsx).
import fs from "node:fs";
import path from "node:path";
import type { RegionCode } from "@/site";

/** ean → [ASIN or null for "searched, not on Amazon", YYYY-MM-DD checked] */
export type AsinFile = Record<string, [string | null, string]>;
export interface AsinStatus { at: string; state: "off" | "refused" | "ok"; searched?: number; found?: number; known?: number; waiting?: number; note?: string }

export const RECHECK_MISS_DAYS = 30;
/** A homepage product's miss is retried sooner (owner, 2026-11-19: homepage products must have Amazon prices first). */
export const RECHECK_HOME_MISS_DAYS = 7;
export const AMAZON_DIR = path.resolve(process.cwd(), process.env.KY_AMAZON_DIR || "data/amazon");
export const asinFile = (r: RegionCode, dir = AMAZON_DIR) => path.join(dir, `asins-${r}.json`);
export const statusFile = (r: RegionCode, dir = AMAZON_DIR) => path.join(dir, `status-${r}.json`);

export function readAsins(r: RegionCode, dir = AMAZON_DIR): AsinFile {
  try {
    return JSON.parse(fs.readFileSync(asinFile(r, dir), "utf8")) as AsinFile;
  } catch {
    return {};
  }
}

export function readAsinStatus(r: RegionCode, dir = AMAZON_DIR): AsinStatus | null {
  try {
    return JSON.parse(fs.readFileSync(statusFile(r, dir), "utf8")) as AsinStatus;
  } catch {
    return null;
  }
}

/** Whether a barcode is due a search today: never searched, or a miss older than RECHECK_MISS_DAYS (a homepage product's: RECHECK_HOME_MISS_DAYS). */
export function dueForSearch(entry: AsinFile[string] | undefined, today: string, home = false): boolean {
  if (!entry) return true;
  if (entry[0]) return false;
  return (Date.parse(today) - Date.parse(entry[1])) / 864e5 >= (home ? RECHECK_HOME_MISS_DAYS : RECHECK_MISS_DAYS);
}

/** The words a name search uses: house, name and size, without the house twice. */
export function searchWords(p: { brand?: string; name: string; size?: string | null }): string {
  const name = !p.brand || p.name.toLowerCase().startsWith(p.brand.toLowerCase()) ? p.name : `${p.brand} ${p.name}`;
  return `${name}${p.size && !name.toLowerCase().includes(p.size.toLowerCase()) ? ` ${p.size}` : ""}`.replace(/\s+/g, " ").trim();
}

/**
 * Amazon Creators API calls this site may spend a day, per region (owner, 2026-11-19: "be very frugal", ScentCompare
 * gets half or more of the network's Amazon allowance and KaeYoung the next share; the network table is in DECISIONS.md). Amazon's limit is per
 * Associates account (one per country, 8,640 a day and 1 a second for its first 30 days, then revenue-based), shared by
 * every site on that account. `search` is the daily import's searchItems calls, `build` the build's getItems calls
 * (ten ASINs each). AMAZON_SEARCH_BUDGET / AMAZON_BUILD_CALLS can only lower these.
 */
export const AMAZON_BUDGET = {
  search: { US: 600, other: 300 },
  build: { US: 100, other: 60 },
} as const;

export function amazonBudget(kind: keyof typeof AMAZON_BUDGET, code: RegionCode, env: Record<string, string | undefined> = process.env): number {
  const b = AMAZON_BUDGET[kind];
  const ceiling = code === "US" ? b.US : b.other;
  const raw = env[kind === "search" ? "AMAZON_SEARCH_BUDGET" : "AMAZON_BUILD_CALLS"]?.trim();
  const asked = raw && /^\d+$/.test(raw) ? Number(raw) : ceiling;
  return Math.min(ceiling, asked);
}

/**
 * Runs `fn` for every region, the regions that share one Amazon account (one credential: a region without its own
 * falls back to AU's) one after another, separate accounts side by side: each account still sees one call a second,
 * and a day's budget fits the import's time.
 */
export async function byAccount<T extends string>(codes: T[], account: (code: T) => string | null, fn: (code: T) => Promise<void>): Promise<void> {
  const groups = new Map<string, T[]>();
  for (const c of codes) {
    const k = account(c) ?? `none:${c}`;
    groups.set(k, [...(groups.get(k) ?? []), c]);
  }
  await Promise.all([...groups.values()].map(async (g) => {
    for (const c of g) await fn(c);
  }));
}
