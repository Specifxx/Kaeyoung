// Runs first in every Vercel build: Amazon's own price of each product, in every region we have an Amazon
// tag for, with the Creators API (getItems, ten ASINs a call, one call a second): the ASINs the daily import
// matched to our barcodes (scripts/amazon-asins.ts, data/amazon/asins-<REGION>.json; getItems takes no barcode),
// written to data/amazon-live/<REGION>.json (git-ignored). Amazon's licence lets a price be kept
// for 24 hours and shown with its time, so prices are fetched by each build and never committed; the
// product page shows one only while under 24 hours old (lib/amazon-live.ts). Every product the homepage shows first
// (lib/home-shelves.ts; owner, 2026-11-19), then the most stores, AMAZON_BUILD_CALLS calls a region (60 by default
// since 2026-11-19, was 30: 600 products, about 70 seconds of build each; every known ASIN outside the US).
// A price far from the region's store median (under 60% or over 160%) is dropped: a different pack size or
// a marketplace seller's fantasy. Without credentials, or on any error, it writes nothing and never fails
// the build; a store whose account has no API access yet (403) is skipped and the next region still runs.
//   npx tsx scripts/fetch-amazon-prices.ts
import fs from "node:fs";
import path from "node:path";
import { amazonTag } from "../src/lib/affiliate";
import { readAsins } from "../src/lib/amazon-asins";
import { AmazonRefused, barcodeMatches, credentialsFor, creatorsClient, MARKETS, pickListing, PRICE_RESOURCES } from "../src/lib/amazon-creators";
import { AMAZON_LIVE_DIR, type AmazonLiveFile } from "../src/lib/amazon-live";
import { homeEans } from "../src/lib/home-shelves";
import type { Product } from "../src/lib/types";
import { REGIONS, type RegionCode } from "../src/site";

const PRODUCTS = path.resolve(process.cwd(), process.env.KY_DATA_DIR || "data/public", "products.json");

function median(xs: number[]): number | undefined {
  const s = [...xs].sort((a, b) => a - b);
  if (!s.length) return undefined;
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

async function region(code: RegionCode, products: Product[]) {
  const tag = amazonTag(code);
  const market = MARKETS[code];
  if (!tag || !market) return;
  const creds = credentialsFor(code);
  if (!creds) return console.log(`Amazon prices ${code}: no AMAZON_CREATORS_* credentials, skipped.`);
  const asins = readAsins(code);
  const home = homeEans(code, products);
  const inRegion = products
    .map((p) => ({ p, h: home.has(p.ean), asin: asins[p.ean]?.[0], offers: (p.offers[code] ?? []).filter((o) => o.st !== "out") }))
    .filter((x): x is typeof x & { asin: string } => !!x.asin && x.offers.length > 0)
    .sort((a, b) => Number(b.h) - Number(a.h) || b.offers.length - a.offers.length || b.offers[0].p - a.offers[0].p);
  if (!inRegion.length) return console.log(`Amazon prices ${code}: no ASINs found yet (scripts/amazon-asins.ts), skipped.`);
  const cap = Number(process.env.AMAZON_BUILD_CALLS || 60) * 10;
  const todo = inRegion.slice(0, cap);
  const api = await creatorsClient(code, tag, creds);
  const fetchedAt = new Date().toISOString();
  const prices: AmazonLiveFile["prices"] = {};
  for (let i = 0; i < todo.length; i += 10) {
    const batch = todo.slice(i, i + 10);
    let items;
    try {
      items = await api.call("getItems", { itemIds: batch.map((x) => x.asin), itemIdType: "ASIN", resources: PRICE_RESOURCES });
    } catch (e) {
      console.log(`Amazon prices ${code}: ${(e as Error).message}`);
      if (e instanceof AmazonRefused) break;
      continue;
    }
    for (const x of batch) {
      const it = items.find((it) => it.asin === x.asin);
      // The ASIN was matched by barcode; if Amazon now lists other barcodes on it, the page changed: skip it.
      if (!it || (it.itemInfo?.externalIds && !barcodeMatches(it, x.p.ean))) continue;
      const pick = pickListing(it, market.currency);
      if (!pick) continue;
      const cents = Math.round(pick.amount * 100);
      const ref = median(x.offers.map((o) => o.p));
      if (ref && (cents < ref * 0.6 || cents > ref * 1.6)) continue;
      prices[x.p.ean] = { asin: it.asin, p: cents };
    }
  }
  if (!Object.keys(prices).length) return console.log(`Amazon prices ${code}: none (${api.calls()} calls).`);
  fs.mkdirSync(AMAZON_LIVE_DIR, { recursive: true });
  fs.writeFileSync(path.join(AMAZON_LIVE_DIR, `${code}.json`), JSON.stringify({ fetchedAt, prices } satisfies AmazonLiveFile) + "\n");
  console.log(`Amazon prices ${code}: ${Object.keys(prices).length} of ${todo.length} products priced in ${api.calls()} calls.`);
}

async function main() {
  fs.rmSync(AMAZON_LIVE_DIR, { recursive: true, force: true });
  if (!fs.existsSync(PRODUCTS)) return console.log("Amazon prices: no products.json, skipped.");
  const products = (JSON.parse(fs.readFileSync(PRODUCTS, "utf8")) as { products: Product[] }).products;
  for (const r of REGIONS) await region(r.code, products).catch((e) => console.log(`Amazon prices ${r.code} skipped: ${(e as Error).message}`));
}

main().catch((e) => console.log(`Amazon prices skipped: ${(e as Error).message}`));
