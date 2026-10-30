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
/** A rate that names a date or a promotion ("Free shipping any order - Oct 30-31")
 *  ends soon; a week-long quote must not rest on it. */
const PROMO = /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*\d{1,2}\b|\b\d{1,2}\s*(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)|\buntil\b|\bends?\b|limited[-\s]time|black friday|cyber|promo|today only|this week/i;

class Stop extends Error {}

class Cart {
  private jar = new Map<string, string>();
  calls = 0;
  backoffs = 0;
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
    if (res.status === 429 && this.backoffs < 2) {
      // Shopify's rate limit: wait well past its window, twice at most, then
      // the store is left for this run.
      this.backoffs++;
      await sleep(30_000 * this.backoffs);
      return this.req(pathname, init);
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
    .slice(0, 12);
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
  }
  if (!rates?.length) {
    // Newer checkouts (and stores with app-calculated rates) answer the
    // plain call with nothing: ask, then poll for the answer.
    rates = null;
    try {
      await cart.req(`/cart/prepare_shipping_rates.json?${q}`, { method: "POST", body: "{}" });
    } catch (e) {
      if (e instanceof Stop) throw e;
    }
    for (let i = 0; i < 6 && !rates; i++) {
      await sleep(1500);
      const r = (await cart.req(`/cart/async_shipping_rates.json?${q}`)) as { shipping_rates: Rate[] } | null;
      rates = r?.shipping_rates ?? null;
    }
  }
  const delivery = (rates ?? []).filter((r) => !NOT_DELIVERY.test(r.name));
  const lasting = delivery.filter((r) => !PROMO.test(r.name));
  const usable = lasting.length ? lasting : delivery;
  if (!usable.length) throw new Error("no delivery rate for this address");
  const best = usable.map((r) => ({ name: r.name, cents: Math.round(parseFloat(r.price) * 100) })).sort((a, b) => a.cents - b.cents)[0];
  return best;
}

interface Line { id: number; cents: number; qty: number; full: boolean }

/** Sets one line's quantity and returns the cart total. A store that holds
 *  less stock answers 422 ("Only 6 items were added"), keeping what it has:
 *  the line is then full and the cart is read back for its real total. */
async function setQty(cart: Cart, line: Line, qty: number): Promise<number> {
  try {
    const c = (await cart.req("/cart/change.js", { method: "POST", body: JSON.stringify({ id: String(line.id), quantity: qty }) })) as { total_price: number; items: { id: number; quantity: number }[] };
    line.qty = c.items.find((x) => x.id === line.id)?.quantity ?? qty;
    if (line.qty < qty) line.full = true;
    return c.total_price;
  } catch (e) {
    if (e instanceof Stop || (e as { status?: number }).status !== 422) throw e;
    const c = (await cart.req("/cart.js")) as { total_price: number; items: { id: number; quantity: number }[] };
    line.qty = c.items.find((x) => x.id === line.id)?.quantity ?? line.qty;
    line.full = true;
    return c.total_price;
  }
}

export async function quote(store: Store): Promise<StoreShipping & { calls: number; rate: string }> {
  const cart = new Cart(store.base);
  const dest = destinationFor(store.region, store.base);
  const q = addressQuery(dest);
  const items = await candidates(cart);
  const lines: Line[] = [];
  for (const c of items) {
    if (lines.length) break;
    try {
      await cart.req("/cart/add.js", { method: "POST", body: JSON.stringify({ items: [{ id: c.id, quantity: 1 }] }) });
      lines.push({ ...c, qty: 1, full: false });
    } catch (e) {
      if (e instanceof Stop) throw e;
    }
  }
  if (!lines.length) throw new Error("could not add an item to a cart");
  let total = await setQty(cart, lines[0], 1);
  const first = await cheapestRate(cart, q);
  const base = { at: today, to: dest.city, rate: first.name };
  // A small order quoted over 40 units is a heavy item or a zone the store
  // doesn't really serve, not what a shopper would pay: leave the store out.
  if (first.cents > 4000) throw new Error(`implausible small-order fee ${first.cents} (${first.name})`);
  if (first.cents === 0) return { ...base, fee: 0, freeFrom: total, paidAt: 0, maxTested: total, calls: cart.calls };

  // Grow the basket (about doubling) until delivery is free or we reach the
  // cap. When an item runs out of stock, the next cheapest item takes over.
  const cap = CAP_UNITS * 100;
  let lo = total;
  let hi: number | null = null;
  let loQty = 1;
  let loLine = 0;
  let hiQty = 0;
  let line = lines[0];
  const spare = items.filter((c) => c.id !== line.id);
  while (hi == null && total < cap) {
    if (line.full) {
      const next = spare.shift();
      if (!next) break;
      try {
        await cart.req("/cart/add.js", { method: "POST", body: JSON.stringify({ items: [{ id: next.id, quantity: 1 }] }) });
      } catch (e) {
        if (e instanceof Stop) throw e;
        continue;
      }
      line = { ...next, qty: 0, full: false };
      lines.push(line);
    }
    const want = Math.max(line.qty + 1, Math.min(line.qty * 2, line.qty + Math.ceil((cap - total) / line.cents)));
    const before = line.qty;
    const t = await setQty(cart, line, want);
    if (line.qty <= before) {
      line.full = true;
      continue;
    }
    total = t;
    const r = await cheapestRate(cart, q);
    if (r.cents === 0) {
      hi = total;
      hiQty = line.qty;
    } else {
      lo = total;
      loQty = line.qty;
      loLine = lines.length - 1;
    }
  }
  // Halve the gap on the last line (the others stay as they are): the
  // threshold is within one item of what we report. With the last line at 0
  // the cart is what we last saw charged, so the search can start there.
  if (hi != null) {
    let a = loLine === lines.length - 1 ? loQty : 0;
    let b = hiQty;
    while (b - a > 1) {
      const mid = Math.floor((a + b) / 2);
      const t = await setQty(cart, line, mid);
      const r = await cheapestRate(cart, q);
      if (r.cents === 0) {
        hi = t;
        b = mid;
      } else {
        lo = t;
        a = mid;
      }
    }
  }
  for (const l of lines) await setQty(cart, l, 0).catch(() => 0);
  return { ...base, fee: first.cents, freeFrom: hi, paidAt: lo, maxTested: Math.max(total, lo), calls: cart.calls };
}

/** The quotes of the stores in this shard (SHARD of SHARDS, one runner each:
 *  Shopify rate-limits by address, so runners share nothing). */
async function run(stores: Store[], prev: ShippingData): Promise<{ out: ShippingData; report: string[] }> {
  const out: ShippingData = {};
  const report: string[] = [];
  for (const s of stores) {
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
  return { out, report };
}

function readJson<T>(file: string, fallback: T): T {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8")) as T;
  } catch {
    return fallback;
  }
}

function write(data: ShippingData) {
  const sorted = Object.fromEntries(Object.entries(data).sort(([a], [b]) => a.localeCompare(b)));
  fs.writeFileSync(OUT, JSON.stringify(sorted, null, 1) + "\n");
}

async function main() {
  const prev = readJson<ShippingData>(OUT, {});
  // Merge mode (the workflow's last job): every shard's quotes into one file.
  const mergeDir = process.argv[process.argv.indexOf("--merge") + 1];
  if (process.argv.includes("--merge") && mergeDir) {
    const files = fs.readdirSync(mergeDir, { recursive: true }).map(String).filter((f) => /shipping-out-\d+\.json$/.test(f));
    const data: ShippingData = {};
    for (const f of files) Object.assign(data, readJson<ShippingData>(path.join(mergeDir, f), {}));
    const n = Object.keys(data).length;
    console.log(`${n} of ${STORES.length} stores quoted (${files.length} shards)`);
    // A run that quotes almost nobody is broken (an endpoint changed): fail red, keep last week's file.
    if (n < STORES.length * 0.3) process.exit(1);
    write(data);
    return;
  }
  const only = process.env.STORES?.split(",").map((s) => s.trim());
  const shard = Number(process.env.SHARD ?? 0);
  const shards = Number(process.env.SHARDS ?? 1);
  const stores = STORES.filter((s, i) => (only ? only.includes(s.id) : i % shards === shard));
  const { out, report } = await run(stores, prev);
  console.log(report.sort().join("\n"));
  console.log(`\n${report.filter((r) => r.startsWith("ok")).length} of ${stores.length} stores quoted`);
  if (process.env.SHARD != null) fs.writeFileSync(path.resolve(`shipping-out-${shard}.json`), JSON.stringify(out));
  else write(only ? { ...prev, ...out } : out);
}

if (process.argv[1]?.endsWith("shipping.ts")) main();
