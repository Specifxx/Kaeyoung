// Runs in GitHub Actions every three hours (ops-monitor.yml), so it works when
// the site or the deploy is what broke. A failing check fails the run, and
// GitHub emails the owner. Add a check here for every new scheduled job, API
// or limit (family rule: the owner is not watching).
import fs from "node:fs";
import path from "node:path";
import { STORES } from "@/content/stores";
import type { Meta } from "@/lib/types";
import type { ReviewsFile } from "@/lib/reviews";
import { loadStore, reviewsConfigured } from "@/lib/reviews-store";

type Status = "ok" | "warn" | "fail";
type Result = { name: string; status: Status; detail: string };
const site = (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "");
const DATA = path.join(process.cwd(), "data/public");

async function check(name: string, fn: () => Promise<Omit<Result, "name">> | Omit<Result, "name">): Promise<Result> {
  try {
    return { name, ...(await fn()) };
  } catch (e) {
    return { name, status: "fail", detail: (e as Error).message };
  }
}

async function get(p: string) {
  const r = await fetch(`${site}${p}`, { signal: AbortSignal.timeout(20000), headers: { "User-Agent": "K Young ops monitor" } });
  return r;
}

export function judgeFreshness(updatedAt: string, now = Date.now()): Omit<Result, "name"> {
  const h = (now - Date.parse(updatedAt)) / 3_600_000;
  if (h < 30) return { status: "ok", detail: `${h.toFixed(1)}h old` };
  return { status: h < 54 ? "warn" : "fail", detail: `prices are ${h.toFixed(0)}h old: check the Import prices workflow` };
}

export function judgeStores(meta: Meta, total: number): Omit<Result, "name"> {
  const bad = Object.entries(meta.stores).filter(([, s]) => !s.ok);
  // A store that answered with no products at all: it moved, closed or
  // stopped publishing products.json.
  const empty = Object.entries(meta.stores).filter(([, s]) => s.ok && s.listings === 0);
  if (!bad.length && !empty.length) return { status: "ok", detail: `${total} stores read` };
  const detail = [...bad.map(([k, s]) => `${k}: ${s.error}`), ...empty.map(([k]) => `${k}: no products`)].join("; ");
  return { status: bad.length > total / 3 ? "fail" : "warn", detail };
}

/** The daily reviews export (scripts/reviews-export.ts) and the private store
 *  it reads, probed live (one GitHub API read). Held reviews raise a warning
 *  once a day only (the 09:50 UTC run), so the owner gets one daily count,
 *  never a mail per review. The store's token expiring is warned 14 days ahead:
 *  without it the form can't save. */
export function judgeReviews(
  file: ReviewsFile | null,
  configured: boolean,
  now = Date.now(),
  probe: { error?: string; tokenExpires?: string } = {},
): Omit<Result, "name"> {
  if (!configured) return { status: "warn", detail: "REVIEWS_GITHUB_TOKEN not set in GitHub secrets: ratings and reviews are off" };
  if (probe.error) return { status: "warn", detail: `the private reviews store can't be read: ${probe.error}` };
  if (probe.tokenExpires) {
    const days = (Date.parse(probe.tokenExpires.replace(" UTC", "Z").replace(" ", "T")) - now) / 86_400_000;
    if (Number.isFinite(days) && days < 14)
      return { status: "warn", detail: `the reviews token expires in ${Math.max(0, Math.floor(days))} day(s): make a new one and update REVIEWS_GITHUB_TOKEN in Vercel and GitHub` };
  }
  if (!file) return { status: "warn", detail: "no reviews export yet (data/public/reviews.json missing)" };
  if (file.error) return { status: "warn", detail: `the last reviews export could not read the store: ${file.error}` };
  const h = (now - Date.parse(file.exportedAt)) / 3_600_000;
  if (h > 54) return { status: "warn", detail: `reviews last exported ${h.toFixed(0)}h ago: check the Import prices workflow` };
  const rated = Object.keys(file.products).length;
  if (file.held > 0 && new Date(now).getUTCHours() === 9) return { status: "warn", detail: `${file.held} review(s) waiting for you at /admin/reviews` };
  return { status: "ok", detail: `${rated} products rated${file.held ? `, ${file.held} held` : ""}` };
}

/** The weekly delivery quotes (scripts/shipping.ts, shipping.yml). */
export function judgeShipping(file: Record<string, { at: string }> | null, stores: number, now = Date.now()): Omit<Result, "name"> {
  if (!file) return { status: "warn", detail: "no delivery quotes yet (data/public/shipping.json missing): run the Delivery quotes workflow" };
  const ats = Object.values(file).map((s) => Date.parse(s.at));
  const newest = ats.length ? Math.max(...ats) : 0;
  const days = (now - newest) / 86_400_000;
  if (days > 9) return { status: "warn", detail: `delivery quotes last refreshed ${days.toFixed(0)} days ago: check the Delivery quotes workflow` };
  const n = ats.length;
  if (n < stores * 0.3) return { status: "warn", detail: `delivery quotes for only ${n} of ${stores} stores` };
  return { status: "ok", detail: `${n} of ${stores} stores quoted` };
}

async function main() {
  if (!fs.existsSync(path.join(DATA, "meta.json"))) {
    // Before the first import there is nothing to judge; a setup step, not an incident.
    console.log("WARN Daily price import: no import has run yet (data/public/meta.json not set)");
    return;
  }
  const meta = JSON.parse(fs.readFileSync(path.join(DATA, "meta.json"), "utf8")) as Meta;
  const size = fs.statSync(path.join(DATA, "products.json")).size;
  const results = await Promise.all([
    check("Live site", async () => {
      if (!site) return { status: "warn", detail: "SITE_URL repository variable not set: live checks skipped" };
      const r = await get("/");
      return r.ok ? { status: "ok", detail: `HTTP ${r.status}` } : { status: "fail", detail: `HTTP ${r.status}` };
    }),
    check("Search index", async () => {
      if (!site) return { status: "warn", detail: "SITE_URL not set" };
      const r = await get("/search-index.json");
      if (!r.ok) return { status: "fail", detail: `HTTP ${r.status}` };
      const n = ((await r.json()) as unknown[]).length;
      return n >= meta.products * 0.5 ? { status: "ok", detail: `${n} products live` } : { status: "warn", detail: `live site has ${n} products, data has ${meta.products}: is the daily release deploying?` };
    }),
    check("Daily price import", () => judgeFreshness(meta.updatedAt)),
    check("Store imports", () => judgeStores(meta, STORES.length)),
    check("Catalogue", () => (meta.products > 0 ? { status: "ok", detail: `${meta.products} products` } : { status: "fail", detail: "no products in data/public/products.json" })),
    check("Data size", () =>
      size < 12e6 ? { status: "ok", detail: `${(size / 1e6).toFixed(1)} MB` } : { status: "warn", detail: `products.json is ${(size / 1e6).toFixed(1)} MB: builds slow down; raise minStoresPerRegion or trim` },
    ),
    check("Ratings and reviews", async () => {
      const f = path.join(DATA, "reviews.json");
      const probe: { error?: string; tokenExpires?: string } = {};
      if (reviewsConfigured()) {
        try {
          probe.tokenExpires = (await loadStore()).tokenExpires;
        } catch (e) {
          probe.error = (e as Error).message.slice(0, 160);
        }
      }
      return judgeReviews(fs.existsSync(f) ? (JSON.parse(fs.readFileSync(f, "utf8")) as ReviewsFile) : null, reviewsConfigured(), Date.now(), probe);
    }),
    check("Delivery quotes", () => {
      const f = path.join(DATA, "shipping.json");
      return judgeShipping(fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, "utf8")) : null, STORES.length);
    }),
    check("eBay listings", () => {
      if (!process.env.EBAY_CLIENT_ID) return { status: "warn", detail: "EBAY_CLIENT_ID not set in GitHub secrets: no eBay listings yet (search links still earn)" };
      if (!meta.ebay) return { status: "warn", detail: "no eBay run recorded yet" };
      const age = (Date.now() - Date.parse(meta.ebay.at)) / 3_600_000;
      if (age > 30) return { status: "warn", detail: `last eBay run ${age.toFixed(0)}h ago` };
      return { status: "ok", detail: `${meta.ebay.calls}/${meta.ebay.budget} calls on ${meta.ebay.day}` };
    }),
  ]);
  for (const r of results) console.log(`${r.status.toUpperCase().padEnd(4)} ${r.name}: ${r.detail}`);
  // "not set" warnings are setup steps, not incidents.
  const bad = results.filter((r) => r.status === "fail" || (r.status === "warn" && !/not set/.test(r.detail)));
  if (bad.length) {
    console.error(`\n${bad.length} check(s) need a look: ${bad.map((r) => r.name).join(", ")}`);
    process.exit(1);
  }
}

if (process.argv[1]?.endsWith("ops-monitor.ts")) main();
