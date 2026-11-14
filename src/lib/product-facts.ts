// What a product page can say in words about its own prices (2026-11-14): every number here is read from the
// day's offers and the recorded price history, never typed in and never converted between currencies. The page
// prints it as a short summary, a table of regions, a table of sizes and a few computed questions, so each product
// page carries text that is its own. Pure functions: no file is read here.
import { REGIONS, REGION_BY_CODE, type RegionCode } from "@/site";
import { STORE_BY_ID } from "@/content/stores";
import { money, niceDate, pct } from "./format";
import { dayToDate } from "./history";
import type { History, Offer, Product } from "./types";

const storeName = (id: string) => STORE_BY_ID[id]?.name ?? id;

export interface Unit {
  /** the size as a number in its own unit */
  n: number;
  /** "per 100 ml", "per 100 g", "per oz" */
  per: string;
  /** the price is multiplied by this and divided by n */
  mult: number;
}

// A set, a multi-pack or a bottle with a refill: the size in the name is one item's, so a price per unit would be wrong.
const SEVERAL = /\b(?:sets?|kits?|duos?|trios?|bundles?|\d+\s?-?packs?|pack of|multi-?pack|twin|pairs?|collection|coffret|gift|refills?|bonus)\b|\s\+\s|\d\s?(?:ml|g|oz)\s?\+|\b\d+\s?x\b|\bx\s?\d+\b/i;
// A count beside a volume ("150ml 2ea") is several bottles: the volume is one bottle's.
const COUNTED = /\b\d+\s?(?:ea|pcs?|pieces?|sheets?|pads?|patches|count|ct)\b/i;

/** The unit a product's price can be divided by, or null: no size, a size we do not read, a set or a multi-pack,
 *  or a name that states two different amounts. Refuses rather than guesses. */
export function unitOf(f: Pick<Product, "name" | "size" | "cat">): Unit | null {
  if (!f.size || (f.cat as string) === "sets" || SEVERAL.test(f.name)) return null;
  // Volumes and weights only. A count ("30 sheets") is not divided: a store title that says 30 for one sheet would
  // print a price per sheet thirty times too low.
  const m = /^(\d+(?:\.\d+)?)\s?(ml|g|oz|fl oz)$/.exec(f.size);
  if (!m) return null;
  const n = Number(m[1]);
  const u = m[2];
  if (!(n > 0)) return null;
  // Two different amounts in one unit ("30ml 50ml") name more than one thing.
  for (const unit of ["ml", "g"]) {
    const seen = new Set([...f.name.matchAll(new RegExp(`(\\d+(?:[.,]\\d+)?)\\s?${unit}\\b`, "gi"))].map((x) => Number(x[1].replace(",", "."))));
    if (seen.size > 1) return null;
  }
  if (COUNTED.test(f.name)) return null;
  if (u === "ml" || u === "g") return n >= 1 ? { n, per: `per 100 ${u}`, mult: 100 } : null;
  return n >= 0.1 ? { n, per: "per oz", mult: 1 } : null;
}

/** A price in minor units for one unit of the product (rounded to the minor unit). */
export const unitMinor = (minor: number, u: Unit) => Math.round((minor * u.mult) / u.n);

export interface RegionFacts {
  region: RegionCode;
  /** stores that list it, sold out or not */
  listed: number;
  inStock: number;
  /** cheapest and dearest store that can sell it today */
  low: Offer | null;
  high: Offer | null;
  /** dearest minus cheapest, and that gap as a share of the dearest (the page's "save up to") */
  gap: number;
  gapShare: number | null;
  /** the cheapest price per unit, when the size allows one */
  unit: number | null;
  /** the recorded lowest price: first day, lowest, highest, and the last change (from, to, day) */
  hist: { since: number; lo: number; hi: number; change: { from: number; to: number; day: number } | null } | null;
}

/** One entry per region that lists the product, in REGIONS order. */
export function regionFacts(f: Product, history: History[string] | undefined): RegionFacts[] {
  const u = unitOf(f);
  return REGIONS.map((r) => r.code)
    .filter((c) => f.offers[c]?.length)
    .map((region) => {
      const offers = f.offers[region]!;
      const stock = offers.filter((o) => o.st !== "out").sort((a, b) => a.p - b.p);
      const low = stock[0] ?? null;
      const high = stock[stock.length - 1] ?? null;
      const gap = low && high ? high.p - low.p : 0;
      const series = low ? history?.[region] : undefined;
      const last = series?.[series.length - 1];
      // The history is written by the same import as the offers; if the two disagree, say nothing about it.
      const hist =
        series?.length && last && last[1] === low!.p
          ? {
              since: series[0][0],
              lo: Math.min(...series.map((x) => x[1])),
              hi: Math.max(...series.map((x) => x[1])),
              change: series.length > 1 ? { from: series[series.length - 2][1], to: last[1], day: last[0] } : null,
            }
          : null;
      return { region, listed: offers.length, inStock: stock.length, low, high, gap, gapShare: stock.length > 1 && high!.p > 0 ? gap / high!.p : null, unit: low && u ? unitMinor(low.p, u) : null, hist };
    });
}

const phrase = (r: RegionCode) => REGION_BY_CODE[r].phrase;
const list = (xs: string[]) => (xs.length <= 1 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`);
const stores = (n: number) => `${n} store${n === 1 ? "" : "s"}`;
const day = (n: number) => niceDate(dayToDate(n));
/** A per-unit price that only repeats the shelf price (a 100 ml bottle per 100 ml) is not worth a sentence. */
const unitSaysMore = (x: RegionFacts) => x.unit != null && x.low != null && x.unit !== x.low.p;

/** The summary paragraph, sentence by sentence. `kind` is the site's word for its stores ("fragrance stores"). */
export function summarySentences(f: Product, facts: RegionFacts[], updatedAt: string | undefined, kind: string): string[] {
  const out: string[] = [];
  if (!facts.length) return out;
  const total = facts.reduce((n, x) => n + x.listed, 0);
  out.push(`${f.name} is listed by ${total} of the ${kind} we check: ${list(facts.map((x) => `${x.listed} ${phrase(x.region)}`))}.`);
  const priced = facts.filter((x) => x.low);
  if (priced.length) {
    out.push(
      `At our last daily check${updatedAt ? ` (${niceDate(updatedAt)})` : ""}, the lowest in-stock price was ${list(priced.map((x) => `${money(x.low!.p, x.region)} at ${storeName(x.low!.s)} ${phrase(x.region)}`))}.`,
    );
  }
  const gone = facts.filter((x) => !x.low);
  if (gone.length) out.push(`Every store that lists it ${list(gone.map((x) => phrase(x.region)))} was sold out.`);
  const u = unitOf(f);
  const units = priced.filter(unitSaysMore);
  if (u && units.length) out.push(`For the ${f.size} size, that works out to ${list(units.slice(0, 2).map((x) => `${money(x.unit!, x.region)} ${u.per} ${phrase(x.region)}`))}.`);
  const widest = [...priced].filter((x) => x.gapShare != null && x.gapShare >= 0.05).sort((a, b) => b.gapShare! - a.gapShare!)[0];
  if (widest) {
    out.push(
      `Stores disagree most ${phrase(widest.region)}: ${storeName(widest.high!.s)} asks ${money(widest.high!.p, widest.region)}, so the cheapest store with it in stock is ${money(widest.gap, widest.region)} (${pct(widest.gapShare!)}) lower.`,
    );
  }
  const h = priced.find((x) => x.hist);
  if (h) {
    const { since, lo, hi } = h.hist!;
    const now = h.low!.p;
    out.push(
      lo === hi
        ? `The lowest price ${phrase(h.region)} has stayed at ${money(now, h.region)} since we first recorded it on ${day(since)}.`
        : `Since we first recorded it ${phrase(h.region)} on ${day(since)}, the lowest price there has moved between ${money(lo, h.region)} and ${money(hi, h.region)}; today's ${money(now, h.region)} is ${now === lo ? "the lowest we have seen" : now === hi ? "the highest we have seen" : "in between"}.`,
    );
  }
  return out;
}

export interface SizeRow {
  f: Product;
  size: string;
  low: Offer;
  unit: number;
  best: boolean;
}

/** The sizes of one product family that can be ordered in a region, smallest first, each with its cheapest price per
 *  unit. Only when two or more different sizes share one unit; a size sold in several shades shows its cheapest. */
export function sizeRows(f: Product, variants: Product[], region: RegionCode, max = 6): SizeRow[] {
  const mine = unitOf(f);
  if (!mine) return [];
  const bySize = new Map<number, SizeRow>();
  for (const x of [f, ...variants]) {
    const u = unitOf(x);
    if (!u || u.per !== mine.per) continue;
    const low = (x.offers[region] ?? []).filter((o) => o.st !== "out").sort((a, b) => a.p - b.p)[0];
    if (!low) continue;
    const row = { f: x, size: x.size!, low, unit: unitMinor(low.p, u), best: false };
    const had = bySize.get(u.n);
    // This page's own product stands for its size; otherwise the cheapest of that size.
    if (!had || x.ean === f.ean || (had.f.ean !== f.ean && row.low.p < had.low.p)) bySize.set(u.n, row);
  }
  if (bySize.size < 2 || !bySize.has(mine.n)) return [];
  let rows = [...bySize.entries()].sort((a, b) => a[0] - b[0]);
  if (rows.length > max) {
    // Keep this page's size and its nearest neighbours.
    const i = rows.findIndex(([n]) => n === mine.n);
    const from = Math.max(0, Math.min(i - Math.floor(max / 2), rows.length - max));
    rows = rows.slice(from, from + max);
  }
  const out = rows.map(([, r]) => r);
  const min = Math.min(...out.map((r) => r.unit));
  // "Best value" only when one size is alone at the lowest price per unit.
  if (out.filter((r) => r.unit === min).length === 1) out.find((r) => r.unit === min)!.best = true;
  return out;
}

/** Questions the day's data answers for this product, beyond "where is it cheapest". */
export function factsQa(f: Product, facts: RegionFacts[], sizes: { region: RegionCode; rows: SizeRow[] } | null): [string, string][] {
  const qa: [string, string][] = [];
  const priced = facts.filter((x) => x.low);
  const spread = priced.filter((x) => x.inStock > 1 && x.gap > 0);
  if (spread.length) {
    qa.push([
      `How much do stores' prices for ${f.name} differ?`,
      `${spread.map((x) => `${phrase(x.region).replace(/^in /, "In ")} it runs from ${money(x.low!.p, x.region)} (${storeName(x.low!.s)}) to ${money(x.high!.p, x.region)} (${storeName(x.high!.s)}) across the ${stores(x.inStock)} with it in stock, a gap of ${money(x.gap, x.region)} or ${pct(x.gapShare!)}`).join(". ")}.`,
    ]);
  }
  const u = unitOf(f);
  const units = priced.filter(unitSaysMore);
  if (u && units.length) {
    qa.push([`How much is ${f.name} ${u.per}?`, `At the lowest in-stock price for the ${f.size} size: ${list(units.map((x) => `${money(x.unit!, x.region)} ${u.per} ${phrase(x.region)}`))}.`]);
  }
  if (sizes && sizes.rows.length > 1 && u) {
    const best = sizes.rows.find((r) => r.best);
    const rest = sizes.rows.filter((r) => r !== best);
    if (best) {
      qa.push([
        `Which size is the best value?`,
        `Of the ${sizes.rows.length} sizes in stock ${phrase(sizes.region)}, the ${best.size} is the cheapest ${u.per}: ${money(best.unit, sizes.region)} (${best.unit === best.low.p ? "" : `${money(best.low.p, sizes.region)} `}at ${storeName(best.low.s)}). The ${rest.length === 1 ? "other is" : "others are"} ${list(rest.map((r) => `the ${r.size} at ${money(r.unit, sizes.region)}`))}.`,
      ]);
    }
  }
  const moved = priced.filter((x) => x.hist?.change).slice(0, 3);
  if (moved.length) {
    qa.push([
      `Has the price of ${f.name} changed lately?`,
      `${moved.map((x) => `${phrase(x.region).replace(/^in /, "In ")} the lowest price went from ${money(x.hist!.change!.from, x.region)} to ${money(x.hist!.change!.to, x.region)} on ${day(x.hist!.change!.day)}`).join(". ")}. We record the lowest in-stock price every day, and the chart on this page shows each change.`,
    ]);
  }
  return qa;
}

/** The one AggregateOffer a Product block carries: the first region (US first) where a store can sell it today, in that
 *  region's own currency. One currency per page, so a results page never mixes a low price in one currency with a
 *  high price in another. */
export function schemaRegion(facts: RegionFacts[]): RegionFacts | null {
  return facts.find((x) => x.low) ?? null;
}

/** The barcode as schema.org names it: a 13-digit code starting 0 is a 12-digit UPC-A with a zero in front. */
export function gtinProps(ean: string): { gtin13: string } | { gtin12: string } {
  return /^0\d{12}$/.test(ean) ? { gtin12: ean.slice(1) } : { gtin13: ean };
}
