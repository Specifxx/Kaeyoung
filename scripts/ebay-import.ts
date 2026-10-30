// eBay listings for each product, looked up by its barcode through the Browse
// API (GitHub Actions only: the website never calls eBay and holds no eBay
// key). Off until EBAY_CLIENT_ID / EBAY_CLIENT_SECRET exist (a green no-op).
// One call per (product, region), home-page, popular and new products first
// (planEbay), capped at 2,500 per eBay quota day however many runs there are.
import fs from "node:fs";
import path from "node:path";
import { REGIONS, type RegionCode } from "@/site";
import { dealsIn, getProducts, newestIn } from "@/lib/data";
import { ebayPick, ebayQuotaDay, planEbay, type EbayItem, type EbayPrio } from "@/lib/ebay";
import { popularity, popularNow } from "@/lib/ratings";
import type { EbayData, Meta } from "@/lib/types";

const DATA = path.join(process.cwd(), "data");
const read = <T>(p: string, f: T): T => {
  try {
    return JSON.parse(fs.readFileSync(path.join(DATA, p), "utf8")) as T;
  } catch {
    return f;
  }
};

const MARKET: Partial<Record<RegionCode, { id: string; country: string }>> = {
  US: { id: "EBAY_US", country: "US" },
  UK: { id: "EBAY_GB", country: "GB" },
  CA: { id: "EBAY_CA", country: "CA" },
  AU: { id: "EBAY_AU", country: "AU" },
  EU: { id: "EBAY_DE", country: "DE" },
};

async function token(): Promise<string> {
  const id = process.env.EBAY_CLIENT_ID!;
  const secret = process.env.EBAY_CLIENT_SECRET!;
  const r = await fetch("https://api.ebay.com/identity/v1/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}` },
    body: "grant_type=client_credentials&scope=https%3A%2F%2Fapi.ebay.com%2Foauth%2Fapi_scope",
  });
  if (!r.ok) throw new Error(`eBay token refused: HTTP ${r.status}`);
  return ((await r.json()) as { access_token: string }).access_token;
}

async function main() {
  const metaPath = path.join(DATA, "public/meta.json");
  const meta = read<Meta | null>("public/meta.json", null);
  if (!process.env.EBAY_CLIENT_ID || !process.env.EBAY_CLIENT_SECRET) {
    console.log("eBay keys not set: skipping (no-op).");
    return;
  }
  // K Young's keyset is shared with CamCompare, 2,500 calls a day each
  // (owner, 2026-10-30). EBAY_DAILY_CAP can only lower it.
  // A second run on the same quota day (a manual dispatch) gets only what is left.
  const cap = Math.min(2500, Number(process.env.EBAY_DAILY_CAP || 2500));
  const qday = ebayQuotaDay();
  const spent = meta?.ebay?.qday === qday ? meta.ebay.qcalls ?? 0 : 0;
  const budget = Math.max(0, cap - spent);
  const checked = read<Record<string, string>>("state/ebay-checked.json", {});
  const data = read<EbayData>("public/ebay.json", {});
  const products = getProducts();
  const today = new Date().toISOString().slice(0, 10);
  const regions = Object.keys(MARKET) as RegionCode[];
  // Tier 0: what the home page shows in each region; tier 1: the top of /popular
  // and anything first seen in the last 30 days (after the launch-day catalogue,
  // which was all "first seen" on one day); tier 2: the rest.
  const home = new Set<string>();
  const hot = new Set<string>();
  for (const r of regions) {
    for (const f of [...popularNow(r, 8), ...dealsIn(r, 8).map((d) => d.f), ...newestIn(r, 8)]) home.add(`${f.ean}:${r}`);
    for (const f of popularNow(r, 300)) hot.add(`${f.ean}:${r}`);
  }
  const launch = products.reduce((m, f) => (f.first < m ? f.first : m), "9999");
  const recent = new Date(Date.now() - 30 * 86_400_000).toISOString().slice(0, 10);
  const isNew = (f: (typeof products)[number]) => f.first > launch && f.first >= recent;
  const prio = (f: (typeof products)[number], r: RegionCode): EbayPrio => ({
    tier: home.has(`${f.ean}:${r}`) ? 0 : hot.has(`${f.ean}:${r}`) || isNew(f) ? 1 : 2,
    score: popularity(f, r),
  });
  const plan = planEbay(products, checked, regions, budget, prio, today);
  if (!plan.length) {
    console.log(`eBay: nothing to search (${spent} of ${cap} calls already spent on quota day ${qday}).`);
    return;
  }
  const tok = await token();
  let calls = 0;
  let failures = 0;
  for (const { f, region } of plan) {
    const m = MARKET[region]!;
    const cur = REGIONS.find((r) => r.code === region)!.currency;
    const url = `https://api.ebay.com/buy/browse/v1/item_summary/search?gtin=${f.ean}&limit=25&sort=price&filter=${encodeURIComponent(`buyingOptions:{FIXED_PRICE},conditionIds:{1000},deliveryCountry:${m.country},priceCurrency:${cur}`)}`;
    calls++;
    const r = await fetch(url, { headers: { Authorization: `Bearer ${tok}`, "X-EBAY-C-MARKETPLACE-ID": m.id } });
    if (r.status === 429) {
      console.log("eBay 429: stopping for today.");
      break;
    }
    if (!r.ok) {
      // Nothing is written for a failed search; too many failures fail the run red.
      if (++failures >= 10) throw new Error(`eBay searches failing: HTTP ${r.status}`);
      continue;
    }
    const items = ((await r.json()) as { itemSummaries?: EbayItem[] }).itemSummaries ?? [];
    const pick = ebayPick(items, f.offers[region] ?? [], region);
    const entry = (data[f.ean] ??= {});
    if (pick) entry[region] = pick;
    else delete entry[region];
    if (!Object.keys(entry).length) delete data[f.ean];
    checked[`${f.ean}:${region}`] = today;
    await new Promise((res) => setTimeout(res, 150));
  }
  // Products that left the catalogue lose their eBay rows.
  const live = new Set(products.map((f) => f.ean));
  for (const ean of Object.keys(data)) if (!live.has(ean)) delete data[ean];
  fs.writeFileSync(path.join(DATA, "public/ebay.json"), JSON.stringify(data) + "\n");
  fs.writeFileSync(path.join(DATA, "state/ebay-checked.json"), JSON.stringify(checked) + "\n");
  if (meta) {
    meta.ebay = { at: new Date().toISOString(), day: today, calls, budget, listings: Object.keys(data).length, qday, qcalls: spent + calls };
    fs.writeFileSync(metaPath, JSON.stringify(meta, null, 1) + "\n");
  }
  console.log(`eBay: ${calls} calls of ${budget}; ${Object.keys(data).length} products with an eBay listing.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
