// Daily: asks each store's own Shopify cart what 1, 2 and 3 of a product cost, so a multi-buy ("Buy 2 save 10%",
// "3 for 2") or a free gift the store applies by itself shows beside its price (src/lib/promos.ts, DECISIONS.md
// 2026-11-06). Writes data/public/promos.json. Run by .github/workflows/promos.yml.
//
// Per store: a short screen first, the store's most compared in-stock product in each category (SCREEN); only a store
// whose cart discounted any of them (or did yesterday) is then asked about up to DEEP more. Per product: add one, read
// the cart, set 2, set 3, clear: the same cart endpoints the store's own page uses, one request every 1.5 s, a 403,
// 429 or captcha stops that store (never worked around). Nothing is bought. A cart in another currency than the
// region's is left alone, and so is a product whose cart price is above our shelf price (another variant).
//
//   npx tsx scripts/promos.ts                 every store
//   STORES=heartdrops,kanvas npx tsx scripts/promos.ts
import fs from "node:fs";
import path from "node:path";
import { STORES, type Store } from "@/content/stores";
import { CATEGORIES, REGION_BY_CODE } from "@/site";
import { unpackProducts } from "@/lib/products-file";
import { dealTiers, readCart, type CartJson, type ProductDeal, type PromoData, type StorePromos } from "@/lib/promos";
import type { Product } from "@/lib/types";

const OUT = path.resolve("data/public/promos.json");
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";
const SCREEN = Number(process.env.PROMO_SCREEN ?? 6);
const DEEP = Number(process.env.PROMO_DEEP ?? 60);
const KEEP_DAYS = 2;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const today = new Date().toISOString().slice(0, 10);

class Stop extends Error {}

class Cart {
  private jar = new Map<string, string>();
  calls = 0;
  constructor(private base: string) {}

  async req(pathname: string, init: RequestInit = {}): Promise<unknown> {
    await sleep(1500);
    this.calls++;
    const cookie = [...this.jar].map(([k, v]) => `${k}=${v}`).join("; ");
    const res = await fetch(this.base + pathname, {
      ...init,
      redirect: "follow",
      headers: { "User-Agent": UA, Accept: "application/json", "Content-Type": "application/json", ...(cookie ? { Cookie: cookie } : {}), ...(init.headers ?? {}) },
      signal: AbortSignal.timeout(30_000),
    });
    for (const c of res.headers.getSetCookie?.() ?? []) {
      const [kv] = c.split(";");
      const i = kv.indexOf("=");
      if (i > 0) this.jar.set(kv.slice(0, i).trim(), kv.slice(i + 1).trim());
    }
    if (res.status === 403 || res.status === 429) throw new Stop(`HTTP ${res.status}`);
    const text = await res.text();
    if (/captcha|challenge-platform|cf-chl/i.test(text.slice(0, 3000)) && !text.trimStart().startsWith("{")) throw new Stop("bot challenge");
    if (!res.ok) throw Object.assign(new Error(`HTTP ${res.status} ${pathname.split("?")[0]} ${text.slice(0, 160)}`), { status: res.status });
    return text.trim() === "" ? null : JSON.parse(text);
  }

  post(pathname: string, body: unknown) {
    return this.req(pathname, { method: "POST", body: JSON.stringify(body) });
  }
}

interface Candidate {
  ean: string;
  cat: string;
  price: number;
  url: string;
  /** stores selling it in this region: the more, the more a deal matters to the comparison */
  stores: number;
}

/** The store's in-stock products, most compared first; the screen takes the top one of each category. */
export function candidatesFor(store: Store, products: Product[]): { screen: Candidate[]; rest: Candidate[] } {
  const all: Candidate[] = [];
  for (const f of products) {
    const offers = f.offers[store.region] ?? [];
    const o = offers.find((x) => x.s === store.id && x.st === "in");
    if (o) all.push({ ean: f.ean, cat: f.cat, price: o.p, url: o.u, stores: offers.length });
  }
  all.sort((a, b) => b.stores - a.stores || a.ean.localeCompare(b.ean));
  const screen: Candidate[] = [];
  for (const c of CATEGORIES) {
    const hit = all.find((x) => x.cat === c.key && !screen.includes(x));
    if (hit && screen.length < SCREEN) screen.push(hit);
  }
  for (const x of all) if (screen.length < SCREEN && !screen.includes(x)) screen.push(x);
  return { screen, rest: all.filter((x) => !screen.includes(x)) };
}

/** The listing's variant id: ?variant= on a multi-variant product, else the product's one priced variant. */
async function variantOf(cart: Cart, c: Candidate): Promise<number | null> {
  const u = new URL(c.url);
  const v = Number(u.searchParams.get("variant"));
  if (v) return v;
  const handle = u.pathname.match(/\/products\/([^/?#]+)/)?.[1];
  if (!handle) return null;
  const p = (await cart.req(`/products/${handle}.js`)) as { variants?: { id: number; price: number }[] } | null;
  const priced = (p?.variants ?? []).filter((x) => x.price > 0);
  return priced.length === 1 ? priced[0].id : null;
}

/** One product: the cart's totals for 1, 2 and 3, and what it added for free. Null when there is nothing to say. */
async function probe(cart: Cart, c: Candidate, currency: string): Promise<ProductDeal | null> {
  const id = await variantOf(cart, c);
  if (!id) return null;
  try {
    await cart.post("/cart/add.js", { items: [{ id, quantity: 1 }] });
  } catch (e) {
    if (e instanceof Stop) throw e;
    return null;
  }
  try {
    const readings: { q: number; total: number }[] = [];
    const labels = new Set<string>();
    const gifts = new Set<string>();
    let cartJson = (await cart.req("/cart.js")) as CartJson;
    if (cartJson.currency && cartJson.currency !== currency) throw new Stop(`cart in ${cartJson.currency}`);
    for (const q of [1, 2, 3]) {
      if (q > 1) cartJson = (await cart.post("/cart/change.js", { id: String(id), quantity: q })) as CartJson;
      const r = readCart(cartJson, id);
      if (!r || r.qty !== q) break; // not enough stock for q: stop at what the store has
      // The cart's single-item price above our shelf price: another variant or a price change since the import.
      if (q === 1 && r.total > c.price) return null;
      readings.push({ q, total: r.total });
      r.labels.forEach((l) => labels.add(l));
      r.gifts.forEach((g) => gifts.add(g));
    }
    const t = dealTiers(c.price, readings);
    if (!t.length && !gifts.size) return null;
    const d: ProductDeal = { u: c.price, t };
    const l = [...labels][0];
    if (l) d.l = l;
    const g = [...gifts][0];
    if (g) d.g = g;
    return d;
  } finally {
    await cart.post("/cart/clear.js", {}).catch((e) => {
      if (e instanceof Stop) throw e;
    });
  }
}

export async function checkStore(store: Store, products: Product[], hadDeals: boolean): Promise<StorePromos & { calls: number }> {
  const cart = new Cart(store.base);
  const region = REGION_BY_CODE[store.region];
  // The visitor's country, as the import asks for it: Shopify Markets prices (and the cart's currency) follow it.
  await cart.req(`/cart.js?country=${region.shopifyCountry}`);
  const { screen, rest } = candidatesFor(store, products);
  const deals: Record<string, ProductDeal> = {};
  let tested = 0;
  const run = async (list: Candidate[]) => {
    for (const c of list) {
      tested++;
      try {
        const d = await probe(cart, c, region.currency);
        if (d) deals[c.ean] = d;
      } catch (e) {
        if (e instanceof Stop) throw e;
      }
    }
  };
  await run(screen);
  if (Object.keys(deals).length || hadDeals) await run(rest.slice(0, DEEP));
  return { at: today, tested, deals, calls: cart.calls };
}

function readJson<T>(file: string, fallback: T): T {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8")) as T;
  } catch {
    return fallback;
  }
}

function write(data: PromoData) {
  const sorted = Object.fromEntries(Object.entries(data).sort(([a], [b]) => a.localeCompare(b)));
  fs.writeFileSync(OUT, JSON.stringify(sorted) + "\n");
}

async function main() {
  const prev = readJson<PromoData>(OUT, {});
  const mergeDir = process.argv[process.argv.indexOf("--merge") + 1];
  if (process.argv.includes("--merge") && mergeDir) {
    const files = fs.readdirSync(mergeDir, { recursive: true }).map(String).filter((f) => /promos-out-\d+\.json$/.test(f));
    const data: PromoData = {};
    for (const f of files) Object.assign(data, readJson<PromoData>(path.join(mergeDir, f), {}));
    const n = Object.keys(data).length;
    const withDeals = Object.values(data).filter((s) => Object.keys(s.deals).length).length;
    console.log(`${n} of ${STORES.length} stores checked, ${withDeals} with a multi-buy or a free gift (${files.length} shards)`);
    // A run that reads almost nobody is broken (an endpoint changed): fail red, keep the last file.
    if (n < STORES.length * 0.3) process.exit(1);
    write(data);
    return;
  }
  const products = unpackProducts(readJson("data/public/products.json", null));
  const only = process.env.STORES?.split(",").map((s) => s.trim());
  const shard = Number(process.env.SHARD ?? 0);
  const shards = Number(process.env.SHARDS ?? 1);
  const stores = STORES.filter((s, i) => (only ? only.includes(s.id) : i % shards === shard));
  const out: PromoData = {};
  const report: string[] = [];
  for (const s of stores) {
    try {
      const { calls, ...r } = await checkStore(s, products, !!Object.keys(prev[s.id]?.deals ?? {}).length);
      out[s.id] = r;
      const n = Object.keys(r.deals).length;
      report.push(`ok   ${s.id.padEnd(22)} ${s.region} ${r.tested} checked, ${n} deals (${calls} calls)${n ? ": " + Object.values(r.deals).slice(0, 2).map((d) => JSON.stringify(d)).join(" ") : ""}`);
    } catch (e) {
      const old = prev[s.id];
      const fresh = old && (Date.parse(today) - Date.parse(old.at)) / 86_400_000 < KEEP_DAYS;
      if (fresh) out[s.id] = old;
      report.push(`fail ${s.id.padEnd(22)} ${s.region} ${(e as Error).message.slice(0, 140)}${fresh ? " (kept yesterday's)" : ""}`);
    }
  }
  console.log(report.sort().join("\n"));
  if (process.env.SHARD != null) fs.writeFileSync(path.resolve(`promos-out-${shard}.json`), JSON.stringify(out));
  else write(only ? { ...prev, ...out } : out);
}

if (process.argv[1]?.endsWith("promos.ts")) main();
