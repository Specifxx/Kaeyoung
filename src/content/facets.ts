// The niche's own filters on the browse bar (components/Browse.tsx), beside brand and rating: the dimensions a buyer in this space
// narrows by (Bill, 2026-11-09). Each reads only the product's NAME, which the browser already holds in /search-index.json, so a
// filter never reaches a function and nothing here is guessed: a name that does not say, has no value. Client-safe, pure.
import { CONCERNS } from "@/lib/needs";

export interface Facet {
  key: string;
  /** the select's accessible name */
  label: string;
  /** its first option: "Any size" */
  any: string;
  /** shown before the index has loaded, so the control is never empty */
  values?: string[];
  /** options in this order (else most products first) */
  order?: string[];
  /** at most this many options (default 40) */
  max?: number;
  of(name: string, cat: string): string[];
}


/** "150ml", "4g", "1.7 oz": the size in ml or g (a K-beauty product is sold by one or the other), or null. */
export function amount(name: string): number | null {
  const m = name.match(/(\d+(?:[.,]\d+)?)\s?(ml|g)\b/i);
  if (m) return parseFloat(m[1].replace(",", "."));
  const oz = name.match(/(\d+(?:\.\d+)?)\s?(?:fl\.?\s?)?oz\b/i);
  return oz ? Math.round(parseFloat(oz[1]) * 29.5735) : null;
}

const SIZES = ["Under 30 ml/g", "30 to 59 ml/g", "60 to 119 ml/g", "120 to 199 ml/g", "200 ml/g and over"];
export function sizeBucket(n: number): string {
  return n < 30 ? SIZES[0] : n < 60 ? SIZES[1] : n < 120 ? SIZES[2] : n < 200 ? SIZES[3] : SIZES[4];
}

export const FACETS: Facet[] = [
  // The skin-concern hubs (lib/needs.ts), read from the same words in the product's own name; never a claim.
  { key: "concern", label: "Skin concern", any: "Any skin concern", values: CONCERNS.map((c) => c.name), order: CONCERNS.map((c) => c.name), of: (n) => CONCERNS.filter((c) => c.re.test(n)).map((c) => c.name) },
  { key: "size", label: "Size", any: "Any size", values: SIZES, order: SIZES, of: (n) => { const a = amount(n); return a ? [sizeBucket(a)] : []; } },
];
