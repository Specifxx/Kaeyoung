// The basket (a visitor's question, 2026-10-30: "the lowest price on one toner
// may not be the lowest total on a three-item order"): which single store
// sells everything in it for the least, with each store's own delivery quote
// added. Client-safe: runs in the browser over /basket-data/<region>.
import { deliveryFor, type StoreShipping } from "./shipping";

export interface BasketData {
  /** [store id, name, delivery quote or null] */
  stores: [string, string, StoreShipping | null][];
  /** per search-index row: [storeIndex, price, storeIndex, price…] in stock, or 0 */
  offers: (number[] | 0)[];
}

export interface StoreTotal {
  id: string;
  name: string;
  /** rows of the basket this store has in stock */
  has: number[];
  subtotal: number;
  /** null: delivery not known for this total */
  delivery: number | null;
  ship: StoreShipping | null;
  total: number | null;
}

/** Every store that has at least one item, those with the whole basket first
 *  (by total with delivery, then by subtotal where delivery is unknown), then
 *  the rest by how many items they have. */
export function compareBasket(data: BasketData, rows: number[]): StoreTotal[] {
  const by = new Map<number, StoreTotal>();
  for (const row of rows) {
    const flat = data.offers[row];
    if (!flat) continue;
    for (let i = 0; i < flat.length; i += 2) {
      const [id, name, ship] = data.stores[flat[i]];
      const t = by.get(flat[i]) ?? { id, name, has: [], subtotal: 0, delivery: null, ship, total: null };
      if (t.has.includes(row)) continue;
      t.has.push(row);
      t.subtotal += flat[i + 1];
      by.set(flat[i], t);
    }
  }
  const out = [...by.values()].map((t) => {
    const delivery = deliveryFor(t.ship ?? undefined, t.subtotal);
    return { ...t, delivery, total: delivery == null ? null : t.subtotal + delivery };
  });
  const full = (t: StoreTotal) => t.has.length === rows.length;
  return out.sort(
    (a, b) =>
      Number(full(b)) - Number(full(a)) ||
      b.has.length - a.has.length ||
      Number(b.total != null) - Number(a.total != null) ||
      (a.total ?? a.subtotal) - (b.total ?? b.subtotal),
  );
}

const KEY = "ky-basket";
export function readBasket(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(v) ? v.filter((x) => typeof x === "string").slice(0, 30) : [];
  } catch {
    return [];
  }
}
export function writeBasket(slugs: string[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(slugs.slice(0, 30)));
  } catch {}
  window.dispatchEvent(new CustomEvent("ky-basket"));
}

// A shared basket (owner, 2026-11-02: word of mouth): the products travel in the link, /basket?b=<slug>,<slug>…,
// nothing is stored and no account exists. Slugs are kept forever (data/state/slugs.json), so a link keeps working.
export const SHARED_PARAM = "b";
export function encodeShared(slugs: readonly string[]): string {
  return slugs.slice(0, 30).map(encodeURIComponent).join(",");
}
export function decodeShared(search: string): string[] | null {
  const v = new URLSearchParams(search).get(SHARED_PARAM);
  if (v == null) return null;
  const out = v.split(",").map((s) => s.trim()).filter((s) => /^[a-z0-9][a-z0-9-]{0,150}$/.test(s));
  return [...new Set(out)].slice(0, 30);
}

/** One basket row's cheapest in-stock store in the region: its name and price, or null. */
export function cheapestOf(data: BasketData, row: number): { name: string; price: number } | null {
  const flat = data.offers[row];
  if (!flat) return null;
  let best: { name: string; price: number } | null = null;
  for (let i = 0; i < flat.length; i += 2) if (!best || flat[i + 1] < best.price) best = { name: data.stores[flat[i]][1], price: flat[i + 1] };
  return best;
}
