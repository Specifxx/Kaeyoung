// What a store title is. The barcode decides WHICH product a listing is; the
// title only decides whether it belongs on the site at all (new, a single
// product the brand makes, not a store bundle, tester or short-dated stock)
// and gives a readable name, a category and a size. Every rule changed here
// gets a real store title in tests/title.test.ts.
import { CATEGORIES, type CatKey } from "@/site";

export type Refusal = "not-beauty" | "tester" | "pre-owned" | "damaged" | "short-dated" | "bundle" | "mystery";

const NOT_BEAUTY = /\b(gift\s*card|e-?gift|gift\s*voucher|shipping|insurance|protection\s*plan|route\s*package|tote\s*bag|donation|tip\b|membership)\b/i;
const TESTER = /\b(tester|testers|sample|samples|trial\s*size\s*sample|sachet|pouch\s*sample)\b/i;
const PRE_OWNED = /\b(pre[-\s]?owned|second\s*-?\s*hand|used|opened|open\s*box)\b/i;
const DAMAGED = /\b(damaged?|dented|box\s*damage|imperfect|defect(ive)?|as[\s-]is|no\s*box|without\s*box|ugly\s*(box|packag))/i;
const SHORT_DATED = /\b(short[\s-]*(dated|date|expiry|exp)|near[\s-]*expiry|expir(y|ing|es|ed)|best\s*before|bbd|outlet\s*sale)\b|\bexp\.?\s*[:\d]/i;
// Store-made sets: the brand's own kits have their own barcode and stay; a
// shop's "Cleanser + Toner duo" carries one product's barcode and does not.
const BUNDLE = /\b(bundle|combo|duo\s*set|trio\s*set|set\s*of\s*\d|\d+\s*-?\s*(?:piece|pc)s?\s*set|buy\s*\d+\s*get|bogo|gift\s*with\s*purchase|gwp|free\s*gift)\b|\b[2-9]\s*x\s+\D|\sx\s?[2-9]\b|\(\s*x?\s*[2-9]\s*x?\s*\)/i;
const MYSTERY = /\b(mystery|lucky\s*(bag|box)|blind\s*box|random|surprise\s*box|beauty\s*box)\b/i;

export interface TitleInfo {
  cat: CatKey;
  size: string | null;
}

/** Read a store title. Returns a refusal reason or the category and size. */
export function readTitle(title: string, kind = ""): TitleInfo | { refused: Refusal } {
  if (NOT_BEAUTY.test(title)) return { refused: "not-beauty" };
  if (TESTER.test(title)) return { refused: "tester" };
  if (PRE_OWNED.test(title)) return { refused: "pre-owned" };
  if (DAMAGED.test(title)) return { refused: "damaged" };
  if (SHORT_DATED.test(title)) return { refused: "short-dated" };
  if (MYSTERY.test(title)) return { refused: "mystery" };
  if (BUNDLE.test(title)) return { refused: "bundle" };
  return { cat: categoryOf(title, kind), size: sizeOf(title) };
}

// Checked in order: the first that matches wins. Specific beats general
// ("hand cream" and "body wash" are body, "cleansing balm" is a cleanser,
// "eye cream" is eye care, "sun cushion" is makeup, "sleeping mask" is a mask).
const CAT_RULES: [CatKey, RegExp][] = [
  ["body-hair", /\b(shampoo|conditioner|hair|scalp|body|hand\s*(cream|lotion|wash|balm)|foot|feet|deodorant|toothpaste|shower)\b/i],
  ["cleansers", /\b(cleans(?:er|ing)|face\s*wash|facial\s*wash|foam(?:ing)?\s*wash|cleansing|micellar|make-?up\s*remover|remover|peeling\s*gel|exfoliat\w*\s*gel|scrub|wash|enzyme\s*powder|powder\s*wash|clean\s*balm|cleansing\s*balm|melting\s*balm)\b|\bfoam\b/i],
  ["lip-care", /\blip\s*(balm|mask|sleeping|oil|care|treatment|scrub|serum|essence|butter|glowy\s*balm)\b/i],
  ["eye-care", /\b(eye\s*(cream|serum|essence|patch(?:es)?|gel|mask|balm|stick|contour)|under\s*eye|eye\s*care)\b/i],
  ["makeup", /\b(cushion|foundation|bb\s*cream|cc\s*cream|concealer|lip\s*(tint|stick|gloss|lacquer|liner)|lipstick|tint|mascara|eye\s*liner|eyeliner|eye\s*shadow|eyeshadow|palette|brow|blush|blusher|highlighter|contour|setting\s*(powder|spray)|primer|make-?up\s*base|pact|compact|powder|velvet|matte\s*lip)\b/i],
  ["sunscreen", /\b(sun\s*(screen|cream|block|stick|serum|essence|gel|milk|fluid|lotion|spray|cushion|care|protect\w*)|sunscreen|sunblock|uv\s*(protect\w*|shield|defen[cs]e|cream|essence)|spf\s*\d+)\b/i],
  ["masks", /\b(sheet\s*masks?|mask\s*sheets?|masks?|mask\s*pack|sleeping\s*(pack|mask)|wash[-\s]?off\s*(pack|mask)|clay|peel[-\s]?off|modeling\s*pack|hydrogel|nose\s*strip)\b/i],
  ["toners", /\b(toner|tonic|skin\s*softener|softener|toner\s*pads?|pads?|mist|essence\s*water|facial\s*water|refresher)\b/i],
  ["serums", /\b(serum|essence|ampoule|ampule|booster|concentrate|treatment|spot\s*care|first\s*care|activator|elixir|oil|drops?)\b/i],
  ["moisturisers", /\b(cream|creme|lotion|emulsion|moisturi[sz]\w*|gel|balm|hydrator|fluid|milk|soothing\s*gel)\b/i],
];

/** The category a title (or, failing that, the store's product type and tags) says. */
export function categoryOf(title: string, kind = ""): CatKey {
  for (const [cat, re] of CAT_RULES) if (re.test(title)) return cat;
  for (const [cat, re] of CAT_RULES) if (re.test(kind)) return cat;
  return "other";
}

const SIZE = /(\d+(?:[.,]\d+)?)\s?(ml|g|gr|fl\.?\s?oz|oz|ea|sheets?|pcs|pads?|patches)\b/gi;

/** The pack size a title states ("150ml", "30g", "10 sheets"), the first one when it names several. */
export function sizeOf(title: string): string | null {
  for (const m of title.matchAll(SIZE)) {
    const n = m[1].replace(",", ".");
    const u = m[2].toLowerCase().replace(/\s/g, "").replace("gr", "g").replace("fl.oz", "fl oz").replace("floz", "fl oz");
    if (Number(n) <= 0) continue;
    if (u === "ml" || u === "g" || u === "oz" || u === "fl oz") return `${n}${u === "fl oz" ? " fl oz" : u === "oz" ? " oz" : u}`;
    if (u === "ea" || u === "pcs") return `${n} pcs`;
    return `${n} ${u.replace(/s?$/, "s")}`;
  }
  return null;
}

// Store noise stripped before a title becomes a product name.
const NOISE = [
  /\[[^\]]*\]/g,
  /【[^】]*】/g,
  /\((?:new|renewal|renewed|restock|in\s*stock|sale|hot|best\s*seller|bestseller|us\s*version|korean\s*version|ship[^)]*|new\s*packaging|old\s*packaging|upgrade[d]?|limited[^)]*)\)/gi,
  /\b(?:new\s*arrival|best\s*seller|bestseller|hot\s*item|on\s*sale|sale|restock(?:ed)?|in\s*stock|authentic|official|100%\s*genuine|genuine)\b\s*[:\-–!]?/gi,
  /\s[-–|]\s*(?:k-?beauty|korean\s*(?:skin\s*care|skincare|beauty|cosmetics?))\s*$/i,
  /\s{2,}/g,
];

/** A clean display name from a store title. */
export function cleanName(title: string): string {
  let t = title;
  for (const re of NOISE) t = t.replace(re, " ");
  t = t
    .replace(/\(\s*\)/g, " ")
    .replace(/\s+([,:;)])/g, "$1")
    .replace(/([(])\s+/g, "$1")
    .replace(/^[\s\-–:|,*]+|[\s\-–:|,*]+$/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
  // Shouting stores: "COSRX ADVANCED SNAIL 96 MUCIN" → title case.
  if (t.length > 12 && t === t.toUpperCase() && /[A-Z]{4}/.test(t)) {
    t = t.toLowerCase().replace(/\b([a-z])/g, (c) => c.toUpperCase());
  }
  return t;
}

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * One name shape for every store: the brand first, then the product, with the
 * store's own brand prefix removed ("COSRX - Advanced Snail 96 Mucin Power
 * Essence" and "Advanced Snail 96 Mucin Power Essence by COSRX" both become
 * "COSRX Advanced Snail 96 Mucin Power Essence").
 */
export function tidyName(title: string, brand: string): string {
  let t = cleanName(title);
  if (brand) {
    const b = brand.replace(/[^a-z0-9]+/gi, "[^a-z0-9]*");
    t = t.replace(new RegExp(`^\\s*${b}\\s*[-–:|]?\\s*`, "i"), "").replace(new RegExp(`\\s*(?:[-–|]|\\bby)\\s*${b}\\s*$`, "i"), "");
    t = t.replace(new RegExp(`^\\[?${esc(brand)}\\]?\\s*`, "i"), "");
  }
  t = t.replace(/^[\s\-–:|,]+|[\s\-–:|,]+$/g, "").trim();
  return brand ? `${brand} ${t}`.trim() : t;
}

/** Pick the product's display name from every store's tidied title: the most
 *  common one wins, then the one nearest a readable length. */
export function pickName(names: string[]): string {
  const ok = names.filter((n) => n.length >= 6);
  if (!ok.length) return names[0] ?? "";
  const count = new Map<string, number>();
  for (const n of ok) count.set(n.toLowerCase(), (count.get(n.toLowerCase()) ?? 0) + 1);
  const score = (n: string) => (count.get(n.toLowerCase()) ?? 0) * 1000 - Math.abs(n.length - 55) - (n === n.toUpperCase() ? 200 : 0);
  return ok.slice().sort((a, b) => score(b) - score(a) || a.localeCompare(b))[0];
}

export const CATEGORY_KEYS = CATEGORIES.map((c) => c.key);
