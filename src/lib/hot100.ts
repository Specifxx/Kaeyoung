// The weekly Hot 100 (owner, 2026-11-18: RiftCompare's Hot chart, for every site): one stable URL, /hot-100, posted to Reddit
// once a week as a plain link and title. Per region: the products whose cheapest orderable price rose most over the last seven
// days, biggest rise first, up to 100, each with its place on the chart seven days earlier, worked out the same way. Pure, from
// the committed price history (data/public/history.json, lib/history.ts) and today's products only.
//
// REAL MOVES ONLY: two or more stores sell it in the region today, the price rose HOT_MIN_PCT or more and under HOT_MAX_PCT (a
// bigger jump is a store selling out or a misfiled listing, not a price). A week with 37 such products is the Hot 37, never padded
// (RiftCompare's Hot 40 rule).
import type { RegionCode } from "@/site";
import { priceOn } from "./history";
import type { History, Product } from "./types";

export const HOT_MAX = 100;
export const HOT_MIN_PCT = 1;
export const HOT_MAX_PCT = 50;

export interface HotRow {
  f: Product;
  rank: number;
  lastRank: number | null;
  before: number;
  after: number;
  /** Percent, one decimal. */
  pct: number;
}

export interface HotChart {
  /** The chart's last day and its comparison day, YYYY-MM-DD. */
  through: string;
  from: string;
  rows: HotRow[];
  lastWeekSize: number;
}

const iso = (day: number) => new Date(day * 86_400_000).toISOString().slice(0, 10);

/** The newest day the history has a point on: the day of the last import. */
export function historyDay(history: History): number | null {
  let max: number | null = null;
  for (const byRegion of Object.values(history))
    for (const series of Object.values(byRegion)) {
      const last = series?.[series.length - 1];
      if (last && (max == null || last[0] > max)) max = last[0];
    }
  return max;
}

const inStockStores = (f: Product, region: RegionCode) => (f.offers[region] ?? []).filter((o) => o.st !== "out").length;

function risers(products: Product[], history: History, region: RegionCode, end: number, max: number) {
  const rows: Omit<HotRow, "rank" | "lastRank">[] = [];
  for (const f of products) {
    if (inStockStores(f, region) < 2) continue;
    const series = history[f.ean]?.[region];
    const before = priceOn(series, end - 7);
    const after = priceOn(series, end);
    if (before == null || after == null || before <= 0) continue;
    const pct = Math.round(((after - before) / before) * 1000) / 10;
    if (pct < HOT_MIN_PCT || pct >= HOT_MAX_PCT) continue;
    rows.push({ f, before, after, pct });
  }
  return rows.sort((a, b) => b.pct - a.pct || b.after - a.after || a.f.slug.localeCompare(b.f.slug)).slice(0, max);
}

export function hotChart(products: Product[], history: History, region: RegionCode, max = HOT_MAX): HotChart | null {
  const end = historyDay(history);
  if (end == null) return null;
  const last = risers(products, history, region, end - 7, max);
  const lastRank = new Map(last.map((r, i) => [r.f.slug, i + 1]));
  const rows = risers(products, history, region, end, max).map((r, i) => ({ ...r, rank: i + 1, lastRank: lastRank.get(r.f.slug) ?? null }));
  return { through: iso(end), from: iso(end - 7), rows, lastWeekSize: last.length };
}

/** "▲3", "▼2", "=", "New", or "" when there was no chart a week earlier. */
export function hotMove(row: Pick<HotRow, "rank" | "lastRank">, lastWeekSize: number): string {
  if (row.lastRank == null) return lastWeekSize > 0 ? "New" : "";
  if (row.lastRank === row.rank) return "=";
  return row.lastRank > row.rank ? `▲${row.lastRank - row.rank}` : `▼${row.rank - row.lastRank}`;
}

export const hotName = (n: number) => `Hot ${n}`;

/** "17 Nov 2026". */
export const hotDate = (isoDate: string) => new Date(`${isoDate}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
