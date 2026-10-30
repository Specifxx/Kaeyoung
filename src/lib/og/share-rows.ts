// The rows a guide's share card shows (and a Reddit post quotes): the
// best-known products sold in a region where the same barcode costs clearly different
// amounts at different stores. Pure, so the card and its test agree.
import type { RegionCode } from "@/site";
import type { Product } from "@/lib/types";

export interface ShareRow {
  slug: string;
  name: string;
  /** brand slug */
  b: string;
  size: string | null;
  /** in-stock stores in the region */
  stores: number;
  /** stores carrying it in any region: how well known it is */
  reach: number;
  lo: number;
  loStore: string;
  hi: number;
  /** (hi - lo) / hi */
  save: number;
}

/** A gap under MIN_SAVE is not news; one over MAX_SAVE is more likely a sale
 *  that ends tomorrow or a listing worth a second look than a fair headline,
 *  and a thumbnail is frozen forever, so the card leaves it out. */
const MIN_SAVE = 0.15;
const MAX_SAVE = 0.6;

export function shareRows(region: RegionCode, list: Product[], n = 5, minStores = 3): ShareRow[] {
  const rows: ShareRow[] = [];
  for (const f of list) {
    const open = (f.offers[region] ?? []).filter((o) => o.st === "in");
    if (open.length < minStores) continue;
    const lo = open.reduce((a, b) => (b.p < a.p ? b : a));
    const hi = Math.max(...open.map((o) => o.p));
    const save = hi > 0 ? (hi - lo.p) / hi : 0;
    if (save < MIN_SAVE || save > MAX_SAVE) continue;
    const reach = new Set(Object.values(f.offers).flatMap((o) => (o ?? []).map((x) => x.s))).size;
    rows.push({ slug: f.slug, name: f.name, b: f.b, size: f.size, stores: open.length, reach, lo: lo.p, loStore: lo.s, hi, save });
  }
  // The best-known products first (stocked by the most stores anywhere), so the
  // card names products the reader already buys.
  rows.sort((a, b) => b.reach - a.reach || b.stores - a.stores || b.save - a.save || a.name.localeCompare(b.name));
  // One product per brand, so the card reads as the market, not one brand's range.
  const brands = new Set<string>();
  const out: ShareRow[] = [];
  for (const r of rows) {
    if (out.length === n) break;
    if (brands.has(r.b)) continue;
    brands.add(r.b);
    out.push(r);
  }
  return out;
}
