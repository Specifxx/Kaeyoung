// This site's price feed for the shared alert service (owner, 2026-11-19: accounts, Premium and alerts on every site; DECISIONS.md):
// served as the static file /alert-feed.json (src/app/alert-feed.json/route.ts), built once per release from the same file the pages
// read. The service fetches it once a day; its format is pinned at the top of the service's sister-alerts feed.ts and by
// tests/alert-feed.test.ts.
//
// The id is the product's barcode (the same the page's alert form sends). The price is the lowest IN-STOCK store offer per region, in
// that region's own currency: never eBay, Amazon, a partner row or a conversion (offers only ever hold stores).
import { dealsIn, getProducts } from "./data";
import { REGIONS, type RegionCode } from "@/site";
import type { Offer, Product } from "./types";

export function lowestInStock(offers: Offer[] | undefined): number | null {
  let best: number | null = null;
  for (const o of offers ?? []) if (o.st === "in" && o.p > 0 && (best == null || o.p < best)) best = o.p;
  return best;
}

export interface AlertFeed {
  v: 1;
  site: "kaeyoung";
  generatedAt: string;
  items: Record<string, { n: string; u: string; p: Partial<Record<RegionCode, number>> }>;
  deals: { n: string; u: string; r: RegionCode; p: number; ref?: number; refLabel?: string }[];
}

function nameOf(f: Product): string {
  const base = f.name.toLowerCase().startsWith(f.brand.toLowerCase()) ? f.name : `${f.brand} ${f.name}`;
  return f.size && !base.toLowerCase().includes(f.size.toLowerCase()) ? `${base} ${f.size}` : base;
}

export function buildAlertFeed(now = new Date(), list: Product[] = getProducts()): AlertFeed {
  const items: AlertFeed["items"] = {};
  for (const f of list) {
    const p: Partial<Record<RegionCode, number>> = {};
    for (const r of REGIONS) {
      const c = lowestInStock(f.offers[r.code]);
      if (c != null) p[r.code] = c;
    }
    // A product listed but sold out everywhere is kept with no price, so a back-in-stock alert on it stays alive.
    if (!Object.values(f.offers).some((o) => o?.length)) continue;
    items[f.ean] = { n: nameOf(f), u: `/product/${f.slug}`, p };
  }
  // The weekly email's deals: the biggest gaps between stores, the dearest store's price as the reference, labelled as such.
  const deals: AlertFeed["deals"] = [];
  for (const r of REGIONS) {
    for (const d of dealsIn(r.code, 3, list)) {
      const hi = Math.max(...(d.f.offers[r.code] ?? []).filter((o) => o.st !== "out").map((o) => o.p));
      deals.push({ n: nameOf(d.f), u: `/product/${d.f.slug}`, r: r.code, p: d.best.offer.p, ...(hi > d.best.offer.p ? { ref: hi, refLabel: "dearest store" } : {}) });
    }
  }
  return { v: 1, site: "kaeyoung", generatedAt: now.toISOString(), items, deals };
}
