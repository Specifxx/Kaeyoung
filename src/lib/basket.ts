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
