// Store promotions beside a price (owner, 2026-11-06: "with Stylevana, when you purchase 2 cleansers you get a
// discount compared to just buying one … any promotions or discounts captured in our price comparison").
//
// Two sources, both the store's own word, never ours:
//
// 1. MULTI-BUYS AND FREE GIFTS, measured in the store's own cart (scripts/promos.ts, daily). Shopify applies a store's
//    automatic discounts ("Buy 2 save 10%", "3 for 2", a free gift over a spend) in the cart, so the cart is asked what
//    1, 2 and 3 of THIS product cost today. A deal is recorded only when the cart itself charged less than that many
//    times the shelf price; a free gift only when the cart added a free line of its own. Never a guess from a banner,
//    and never carried from one product to another: a "buy 2 cleansers" offer shows only on products the cart priced.
// 2. AWIN OFFERS AND VOUCHERS for a retailer that accepted us on Awin (Compare Empire's daily Offers API read,
//    data/awin/promotions.json, copied at build by scripts/fetch-awin.ts): the advertiser's own title, code and end date.
//
// Both are a NOTE on the store's row. The row's price stays the single-item price, the rows stay in single-item price
// order and the real cheapest keeps its badge: a deal that needs two items never outranks a store that sells one for
// less. A deal older than two days, or whose shelf price has changed since the cart was asked, is not shown; an Awin
// offer is not shown after its end date. Client-safe: no node imports.
import { REGION_BY_CODE, type RegionCode } from "@/site";

/** What the cart charged for `q` of one product: [quantity, total in minor units]. */
export type Tier = [number, number];

export interface ProductDeal {
  /** the single-item shelf price the cart was asked at (minor units): a deal is shown only while the offer still costs this */
  u: number;
  /** quantities the cart charged less for than that many times `u`, cheapest per item last */
  t: Tier[];
  /** the store's own name for the discount, when it reads like words ("Buy 2 save 10%"), never a code */
  l?: string;
  /** the title of a free item the cart added by itself */
  g?: string;
}

export interface StorePromos {
  /** the day the cart was asked (YYYY-MM-DD) */
  at: string;
  /** products the cart was asked about */
  tested: number;
  deals: Record<string, ProductDeal>;
}

export type PromoData = Record<string, StorePromos>;

/** A deal is shown for two days after the cart said so: the check runs daily, and one failed run is not a blank page. */
export const DEAL_DAYS = 2;
/** A saving under 1% (or under 10 minor units) is rounding, not a deal. */
export const MIN_SAVING_SHARE = 0.01;
export const MIN_SAVING_MINOR = 10;

// ---- Reading a Shopify cart (scripts/promos.ts) ---------------------------------------------------------------------

export interface CartLine {
  id: number;
  variant_id?: number;
  quantity: number;
  final_line_price: number;
  original_line_price?: number;
  product_title?: string;
  title?: string;
  line_level_discount_allocations?: { discount_application?: { title?: string } }[];
}
export interface CartJson {
  currency?: string;
  total_price: number;
  items: CartLine[];
  cart_level_discount_applications?: { title?: string }[];
}

/** A discount's own title, kept only when it reads like a sentence a shopper would see ("Buy 2 Save 10%"), never
 *  an internal code ("BOGO-NOV23", "AUTO_123"). */
export function humanLabel(title: string | undefined): string | null {
  const t = (title ?? "").replace(/\s+/g, " ").trim();
  if (t.length < 6 || t.length > 48 || !t.includes(" ")) return null;
  if (!/[a-z]/.test(t)) return null; // ALL CAPS: usually a code
  if (/https?:|www\.|[<>{}]|@/.test(t)) return null;
  return t;
}

export interface CartReading {
  /** this product's line total at this quantity */
  total: number;
  qty: number;
  labels: string[];
  /** free lines the cart added by itself */
  gifts: string[];
}

/** One cart answer → what it charged for our line, and anything it added for free. Null when our line is missing. */
export function readCart(cart: CartJson, variantId: number): CartReading | null {
  const ours = cart.items.filter((l) => (l.variant_id ?? l.id) === variantId);
  if (ours.length === 0) return null;
  const others = cart.items.filter((l) => (l.variant_id ?? l.id) !== variantId);
  // Only our product is in the cart, so a cart-level discount ("10% off 2 or more") is ours too: it counts once.
  const cartLevel = Math.max(0, cart.items.reduce((s, l) => s + l.final_line_price, 0) - cart.total_price);
  const othersTotal = others.reduce((s, l) => s + l.final_line_price, 0);
  const lineTotal = ours.reduce((s, l) => s + l.final_line_price, 0);
  const labels = [
    ...ours.flatMap((l) => (l.line_level_discount_allocations ?? []).map((a) => a.discount_application?.title)),
    ...(cart.cart_level_discount_applications ?? []).map((a) => a.title),
  ]
    .map(humanLabel)
    .filter((x): x is string => !!x);
  const gifts = others.filter((l) => l.final_line_price === 0 && (l.original_line_price ?? 1) > 0).map((l) => (l.product_title ?? l.title ?? "").trim()).filter((t) => t && t.length <= 90);
  return {
    total: othersTotal > 0 ? lineTotal : Math.max(0, lineTotal - cartLevel),
    qty: ours.reduce((s, l) => s + l.quantity, 0),
    labels: [...new Set(labels)],
    gifts: [...new Set(gifts)],
  };
}

/** The tiers worth stating: the cart charged at least 1% (and 10 minor units) less than q × the shelf price, but not
 *  an implausible amount less (under 40%: a broken cart or a mis-priced variant, not a deal). */
export function dealTiers(shelf: number, readings: { q: number; total: number }[]): Tier[] {
  const out: Tier[] = [];
  for (const { q, total } of readings.sort((a, b) => a.q - b.q)) {
    const full = q * shelf;
    const saving = full - total;
    if (total <= 0 || total < full * 0.4) continue;
    if (saving < Math.max(MIN_SAVING_MINOR, full * MIN_SAVING_SHARE)) continue;
    // A bigger quantity is only worth stating when it is cheaper per item than the smaller one.
    const prev = out[out.length - 1];
    if (prev && total / q >= prev[1] / prev[0]) continue;
    out.push([q, total]);
  }
  return out;
}

// ---- Showing them (src/components/PriceTable.tsx) -------------------------------------------------------------------

/** The deal for this store and product, only while it is fresh and the shelf price is still the one the cart saw. */
export function liveDeal(data: PromoData, store: string, ean: string, shelf: number, now = Date.now()): ProductDeal | null {
  const s = data[store];
  const d = s?.deals[ean];
  if (!s || !d) return null;
  const age = (now - Date.parse(`${s.at}T00:00:00Z`)) / 86_400_000;
  if (!(age >= 0 && age < DEAL_DAYS + 1)) return null;
  if (d.u !== shelf) return null;
  if (!d.t.length && !d.g) return null;
  return d;
}

/** "Buy 2: A$38.00 (A$19.00 each) · Buy 3: A$54.00 (A$18.00 each)", "Free gift in cart: Mini Toner 30ml". */
export function dealNote(d: ProductDeal, money: (minor: number) => string): string {
  const parts = d.t.map(([q, total]) => (q === 1 ? `${money(total)} in the cart` : `Buy ${q}: ${money(total)} (${money(Math.round(total / q))} each)`));
  if (d.g) parts.push(`Free gift in cart: ${d.g}`);
  return parts.join(" · ");
}

/** The cheapest per-item price a deal gives, for "lowest per item if you buy 2" (never the row's price or rank). */
export function bestPerItem(d: ProductDeal): { q: number; each: number } | null {
  const last = d.t[d.t.length - 1];
  return last ? { q: last[0], each: Math.round(last[1] / last[0]) } : null;
}

// ---- Awin offers ------------------------------------------------------------------------------------------------------

export interface AwinPromotion {
  id: number;
  advertiserId: number;
  type: "promotion" | "voucher";
  title: string;
  description: string;
  start: string;
  end: string;
  regions: "all" | string[];
  code?: string;
}

const EU_COUNTRIES = new Set(["AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES", "SE"]);

function inRegion(p: AwinPromotion, region: RegionCode): boolean {
  if (p.regions === "all") return true;
  if (region === "EU") return p.regions.some((c) => EU_COUNTRIES.has(c));
  return p.regions.includes(REGION_BY_CODE[region].shopifyCountry);
}

/** The advertiser's live offers in this region, soonest ending first (two at most). Nothing before its start, and
 *  nothing within a day of its end: a static page lives until the next build. */
export function awinOffers(all: AwinPromotion[], advertiserId: number | null, region: RegionCode, now = Date.now()): AwinPromotion[] {
  if (advertiserId == null) return [];
  return all
    .filter((p) => p.advertiserId === advertiserId && inRegion(p, region) && Date.parse(p.start) <= now && Date.parse(p.end) - now > 86_400_000)
    .sort((a, b) => a.end.localeCompare(b.end))
    .slice(0, 2);
}

/** "Code GLOW15: 15% off K-beauty (ends 30 Nov)" */
export function offerNote(p: AwinPromotion): string {
  const end = new Date(p.end).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
  return `${p.code ? `Code ${p.code}: ` : ""}${p.title} (ends ${end})`;
}
