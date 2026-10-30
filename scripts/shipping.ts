// Weekly delivery quotes: asks each store's own Shopify cart what delivery
// costs to one address in its region, for a small basket and then bigger ones
// until delivery turns free, and writes data/public/shipping.json
// (src/lib/shipping.ts). Run by .github/workflows/shipping.yml.
//
// Per store: one products.json page to find a cheap in-stock item, a cart
// with it, then the cart's shipping rates (the same endpoints the store's own
// "estimate shipping" box uses), growing the quantity, then halving the gap.
// About 15–30 requests a store, one at a time, a second apart; a 403, 429 or
// captcha stops that store for the run (never worked around). Nothing is
// bought, and the cart is abandoned. A store that fails keeps last week's
// quote if it is under five weeks old, so one bad run never blanks the site.
//
//   npx tsx scripts/shipping.ts            every store
//   STORES=heartdrops,kanvas npx tsx scripts/shipping.ts
import fs from "node:fs";
import path from "node:path";
import { STORES, type Store } from "@/content/stores";
import { destinationFor, type ShippingData, type StoreShipping } from "@/lib/shipping";

const OUT = path.resolve("data/public/shipping.json");
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";
/** The biggest basket we build, in the store's currency units. */
const CAP_UNITS = 250;
const KEEP_DAYS = 35;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const today = new Date().toISOString().slice(0, 10);
const NOT_DELIVERY = /pick\s*-?up|collect|click\s*&|in[-\s]?store|local delivery|courier on demand|uber|same[-\s]?day/i;

class Stop extends Error {}

class Cart {
  private jar = new Map<string, string>();
  calls = 0;
  constructor(private base: string) {}

  async req(pathname: string, init: RequestInit = {}): Promise<unknown> {
    await sleep(1100);
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
    return text.trim() === "null" || text.trim() === "" ? null : JSON.parse(text);
  }
}

interface Variant { id: number; price: string; available: boolean; requires_shipping?: boolean }
interface Prod { title: string; product_type?: string; variants: Variant[] }

/** Cheap in-stock items that ship: the smaller the step, the closer we land on the threshold. */
async function candidates(cart: Cart): Promise<{ id: number; cents: number }[]> {
  const data = (await cart.req("/products.json?limit=250")) as { products: Prod[] };
  return data.products
    .filter((p) => !/gift\s*card|sample|tester|e-?gift|donation|shipping|insurance|protection/i.test(`${p.title} ${p.product_type ?? ""}`))
    .flatMap((p) => p.variants.filter((v) => v.available && v.requires_shipping !== false).map((v) => ({ id: v.id, cents: Math.round(parseFloat(v.price) * 100) })))
    .filter((v) => v.cents >= 300)
    .sort((a, b) => a.cents - b.cents)
    .slice(0, 4);
}

function addressQuery(d: ReturnType<typeof destinationFor>): string {
  const q = new URLSearchParams();
  q.set("shipping_address[zip]", d.zip);
  q.set("shipping_address[country]", d.country);
  if (d.province) q.set("shipping_address[province]", d.province);
  return q.toString();
}

interface Rate { name: string; price: string }

/** The cheapest delivery rate (cents) for what is in the cart now. */
async function cheapestRate(cart: Cart, q: string): Promise<{ cents: number; name: string }> {
  let rates: Rate[] | null = null;
  try {
    rates = ((await cart.req(`/cart/shipping_rates.json?${q}`)) as { shipping_rates: Rate[] }).shipping_rates;
  } catch (e) {
    if (e instanceof Stop) throw e;
    // Newer themes: ask, then poll for the answer.
    await cart.req(`/cart/prepare_shipping_rates.json?${q}`, { method: "POST", body: "{}" });
    for (let i = 0; i < 6 && !rates; i++) {
      await sleep(1500);
      const r = (await cart.req(`/cart/async_shipping_rates.json?${q}`)) as { shipping_rates: Rate[] } | null;
      rates = r?.shipping_rates ?? null;
    }
  }
  const usable = (rates ?? []).filter((r) => !NOT_DELIVERY.test(r.name));
  if (!usable.length) throw new Error("no delivery rate for this address");
  const best = usable.map((r) => ({ name: r.name, cents: Math.round(parseFloat(r.price) * 100) })).sort((a, b) => a.cents - b.cents)[0];
  return best;
}

async function setQty(cart: Cart, id: number, qty: number): Promise<number> {
  const c = (await cart.req("/cart/change.js", { method: "POST", body: JSON.stringify({ id: String(id), quantity: qty }) })) as { total_price: number };
  return c.total_price;
}

export async function quote(store: Store): Promise<StoreShipping & { calls: number; rate: string }> {
  const cart = new Cart(store.base);
  const dest = destinationFor(store.region, store.base);
  const q = addressQuery(dest);
  const items = await candidates(cart);
  let item: { id: number; cents: number } | null = null;
  for (const c of items) {
    try {
      await cart.req("/cart/add.js", { method: "POST", body: JSON.stringify({ items: [{ id: c.id, quantity: 1 }] }) });
      item = c;
      break;
    } catch (e) {
      if (e instanceof Stop) throw e;
    }
  }
  if (!item) throw new Error("could not add an item to a cart");
  let total = await setQty(cart, item.id, 1);
  const first = await cheapestRate(cart, q);
  const base = { at: today, to: dest.city, calls: 0, rate: first.name };
  if (first.cents === 0) return { ...base, fee: 0, freeFrom: total, paidAt: 0, maxTested: total, calls: cart.calls };

  // Grow the basket (about doubling) until delivery is free or we reach the cap.
  const cap = CAP_UNITS * 100;
  let lo = { qty: 1, total };
  let hi: { qty: number; total: number } | null = null;
  let qty = 1;
  while (!hi && total < cap) {
    const next = Math.min(Math.max(qty + 1, Math.round(qty * 2)), Math.ceil(cap / item.cents));
    if (next === qty) break;
    const t = await setQty(cart, item.id, next);
    if (t <= total) break; // the store capped the quantity (stock)
    qty = next;
    total = t;
    const r = await cheapestRate(cart, q);
    if (r.cents === 0) hi = { qty, total };
    else lo = { qty, total };
  }
  // Halve the gap: the threshold is within one item of what we report.
  while (hi && hi.qty - lo.qty > 1) {
    const mid = Math.floor((lo.qty + hi.qty) / 2);
    const t = await setQty(cart, item.id, mid);
    const r = await cheapestRate(cart, q);
    if (r.cents === 0) hi = { qty: mid, total: t };
    else lo = { qty: mid, total: t };
  }
  await setQty(cart, item.id, 0).catch(() => {});
  return { ...base, fee: first.cents, freeFrom: hi?.total ?? null, paidAt: lo.total, maxTested: Math.max(total, lo.total), calls: cart.calls };
}

async function main() {
  const only = process.env.STORES?.split(",").map((s) => s.trim());
  const stores = STORES.filter((s) => !only || only.includes(s.id));
  let prev: ShippingData = {};
  try {
    prev = JSON.parse(fs.readFileSync(OUT, "utf8"));
  } catch {}
  const out: ShippingData = {};
  const report: string[] = [];
  let i = 0;
  const worker = async () => {
    while (i < stores.length) {
      const s = stores[i++];
      try {
        const { calls, rate, ...q } = await quote(s);
        out[s.id] = q;
        report.push(`ok   ${s.id.padEnd(22)} ${s.region} fee ${q.fee} free ${q.freeFrom ?? "-"} paid≤${q.paidAt} (${rate}, ${calls} calls)`);
      } catch (e) {
        const old = prev[s.id];
        const fresh = old && (Date.parse(today) - Date.parse(old.at)) / 86_400_000 < KEEP_DAYS;
        if (fresh) out[s.id] = old;
        report.push(`fail ${s.id.padEnd(22)} ${s.region} ${(e as Error).message.slice(0, 140)}${fresh ? " (kept last quote)" : ""}`);
      }
    }
  };
  await Promise.all([worker(), worker(), worker()]);
  // A partial run (STORES=…) keeps everyone else's quotes.
  const merged = only ? { ...prev, ...out } : out;
  const sorted = Object.fromEntries(Object.entries(merged).sort(([a], [b]) => a.localeCompare(b)));
  fs.writeFileSync(OUT, JSON.stringify(sorted, null, 1) + "\n");
  console.log(report.sort().join("\n"));
  const ok = report.filter((r) => r.startsWith("ok")).length;
  console.log(`\n${ok} of ${stores.length} stores quoted`);
  // A run that quotes almost nobody is broken (an endpoint changed): fail red.
  if (!only && ok < stores.length * 0.3) process.exit(1);
}

if (process.argv[1]?.endsWith("shipping.ts")) main();
