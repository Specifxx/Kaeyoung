// Product page <title>s that a results page shows in full (2026-11-14, DECISIONS.md "Product titles fit 60").
// Pure: no data reads, no site import, so the test runs it on the committed products. Shared by KaeYoung and
// ScentCompare (the same file in both repos); the fragrance rules simply never fire on a skincare name.
//
// Order, first fit wins (60 characters as rendered, with the layout's " | <site>" when it is kept):
//   1. the full name with " | <site>": "<name> price: compare N stores", then shorter hooks, then "<name> price";
//   2. the same, without the site name;
//   3. the name made shorter, one step at a time, each step keeping the earlier ones (no site name from here on):
//      a. the brand said twice ("Gentleman by Givenchy" under Givenchy, "4711 by 4711");
//      b. the same size twice in another unit ("100ml/3.4oz" keeps 100ml, the size the data reads);
//      c. filler words ("Eau de Parfum Spray" keeps "Eau de Parfum"; "in Manufacturer's bottle");
//      d. Eau de Parfum / Toilette / Cologne as EDP / EDT / EDC, as shoppers type them;
//      e. "for Men", "for Women", "(Unisex)";
//   4. the name cut at words, keeping the brand, the last word (what it is), the size and any shade in brackets;
//      "…" marks the words left out.
// Nothing is added that is not in the name, except the hooks (price, store count), the "…" of a cut and, for two
// products whose names say the same, the last four digits of the later one's barcode, as the size picker does
// (variantLabels in lib/data.ts).

export const TITLE_MAX = 60;

export interface TitleInput {
  slug: string;
  name: string;
  brand: string;
  /** the size the importer read, "50ml", "3.4 oz", "10 sheets" */
  size: string | null;
  stores: number;
  ean: string;
  /** first seen (YYYY-MM-DD): on a tie, the older page keeps the plain title */
  first: string;
}

/** What the page's metadata takes: a string gets the layout's " | <site>"; `absolute` is shown as it is. */
export type PageTitle = string | { absolute: string };

export const renderTitle = (t: PageTitle, site: string) => (typeof t === "string" ? `${t} | ${site}` : t.absolute);

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const tidy = (s: string) =>
  s
    .replace(/\(\s*\)/g, " ")
    .replace(/\s+([,.)])/g, "$1")
    .replace(/\(\s+/g, "(")
    .replace(/\s{2,}/g, " ")
    .replace(/[\s,/–-]+$/g, "")
    .trim();

// A size the way store titles write it: 100ml, 3.4 oz, 6.76fl.oz, 1.7 oz., 120 g, 10 sheets.
const SIZE = /(\d+(?:[.,]\d+)?)\s?(ml|l|g|kg|fl\.?\s?oz\.?|oz\.?|sheets?|pcs|pads?|patches|pieces)(?![a-z])/gi;
const unitClass = (u: string) => (/oz/i.test(u) ? "imperial" : /^(ml|l|g|kg)$/i.test(u) ? "metric" : "count");
const squash = (s: string) => s.toLowerCase().replace(/[\s.]/g, "");

interface SizeTok {
  text: string;
  index: number;
  cls: string;
}
function sizeTokens(name: string): SizeTok[] {
  return [...name.matchAll(SIZE)].map((m) => ({ text: m[0], index: m.index!, cls: unitClass(m[2]) }));
}
/** The size token the data reads (`size`), else the first one in the name. */
function mainSize(name: string, size: string | null): SizeTok | null {
  const toks = sizeTokens(name);
  if (!toks.length) return null;
  return (size && toks.find((t) => squash(t.text) === squash(size))) || toks[0];
}

function dropRepeatedBrand(name: string, brand: string): string {
  if (!brand) return name;
  const b = esc(brand.trim());
  let out = name.replace(new RegExp(`^(${b})\\s*/\\s*${b}\\b`, "i"), "$1");
  const head = out.slice(0, brand.length);
  if (head.toLowerCase() === brand.toLowerCase()) out = head + out.slice(brand.length).replace(new RegExp(`\\s+by\\s+${b}(?![\\w'])`, "gi"), "");
  return tidy(out);
}

/** "100ml/3.4oz", "(3.4 oz.) 100ml": the same bottle in the other unit system goes; the size the data reads stays. */
function dropConvertedSize(name: string, size: string | null): string {
  const main = mainSize(name, size);
  if (!main || main.cls === "count") return name;
  let out = name;
  const other = sizeTokens(name).filter((t) => t.cls !== main.cls && t.cls !== "count");
  for (const t of other.reverse()) {
    const before = out.slice(0, t.index);
    const after = out.slice(t.index + t.text.length);
    out = before.replace(/\s*\/\s*$/, "") + (/\s*\/\s*$/.test(before) ? after : after.replace(/^\s*\/\s*/, " "));
  }
  return tidy(out);
}

function dropFiller(name: string): string {
  return tidy(
    name
      .replace(/\b(Parfum|Toilette|Cologne|EDP|EDT|EDC|Extrait|Perfume|Intense|Absolue|Elixir)\s+Spray\b/gi, "$1")
      .replace(/\s*\bin Manufacturer'?s bottle\b/gi, "")
      .replace(/\b(?:100%\s+)?(?:Authentic|Genuine)\b\s*/gi, "")
      .replace(/\bFree Shipping\b/gi, ""),
  );
}

function abbreviate(name: string): string {
  return tidy(
    name
      .replace(/\bEau de Parfum\b/gi, "EDP")
      .replace(/\bEau de Toilette\b/gi, "EDT")
      .replace(/\bEau de Cologne\b/gi, "EDC"),
  );
}

function dropGender(name: string): string {
  return tidy(name.replace(/\s*[-–,]?\s*\bfor (?:Men|Women|Man\/Woman|Man|Woman|Him|Her|Unisex)\b/gi, "").replace(/\s*\((?:Unisex|U|M|W)\)/g, ""));
}

const DANGLING = /(?:\s*[&+/,:–-]|\s+(?:and|with|of|for|the|de|by|in|x))$/i;
/** A word that says what the product is (letters, no digits): not "SPF50+", "PA++++", "50+", "60ea". */
const isNoun = (w: string) => /^[\p{L}][\p{L}'’-]+$/u.test(w) && !/^(?:spf|pa|uv|ea|pcs)$/i.test(w);

/**
 * The name shortened at word boundaries so `${cut} price` fits `max`. The brand (the first words), the last word before
 * the size (what the product is: "Toner", "Ampoule", "Mascara"), the size the data reads and any shade in brackets stay;
 * the words just before that last word go, right to left, and "…" marks where (`fromLeft`: the words just after the
 * brand go, left to right, for a product whose first cut another product already has). Brackets go only when nothing
 * else fits; then a size that sat in one stays on its own.
 */
function cutToFit(name: string, brand: string, size: string | null, max: number, tail = "", fromLeft = false): string | null {
  const room = (s: string) => `${s} price${tail}`.length <= max;
  const groups = [...name.matchAll(/\(([^()]*)\)/g)].map((m) => ({ text: m[0], index: m.index!, end: m.index! + m[0].length }));
  const main = mainSize(name, size);
  const inGroup = main ? groups.find((g) => main.index >= g.index && main.index < g.end) : undefined;
  let rest = name;
  let sizeText = "";
  if (main && !inGroup) {
    sizeText = main.text.replace(/\.$/, "");
    rest = name.slice(0, main.index) + " " + name.slice(main.index + main.text.length);
  }
  const brackets = groups.map((g) => g.text);
  rest = tidy(rest.replace(/\([^()]*\)/g, " ").replace(/\s+[-–]\s*$/, "").replace(/\s+[-–]\s+/g, " "));
  const words = rest.split(/\s+/).filter(Boolean);
  const brandWords = brand && rest.toLowerCase().startsWith(brand.toLowerCase()) ? brand.split(/\s+/).length : 1;
  // The last word that names the product; anything after it ("SPF50+ PA++++") goes first.
  let li = words.length - 1;
  while (li >= brandWords && !isNoun(words[li])) li--;
  const last = li >= brandWords ? words[li] : "";
  const middle = words.slice(brandWords, last ? li : undefined);
  const trailing = last ? words.slice(li + 1) : [];
  for (const keepBrackets of [true, false]) {
    // Without brackets, a size that sat in one ("(Givenchy L'Interdit Elixir Parfum W 50ml)") is kept on its own.
    const end = (keepBrackets ? [sizeText, ...brackets] : [sizeText || (main ? main.text.replace(/\.$/, "") : "")]).filter(Boolean).join(" ");
    const head = words.slice(0, brandWords).join(" ");
    for (let k = keepBrackets ? middle.length - 1 : middle.length; k >= 0; k--) {
      const kept = (fromLeft ? middle.slice(middle.length - k) : middle.slice(0, k)).join(" ").replace(DANGLING, "").replace(DANGLING, "");
      const gap = k < middle.length || trailing.length ? "… " : " ";
      const body = fromLeft
        ? `${head}${gap}${[kept, last].filter(Boolean).join(" ")}`
        : [head, kept].filter(Boolean).join(" ").replace(DANGLING, "") + (k < middle.length ? gap : " ") + last + (trailing.length && k === middle.length ? "…" : "");
      const t = tidy([body, end].filter(Boolean).join(" "));
      if (room(t)) return t;
    }
  }
  return null;
}

const hooks = (m: string, stores: number) => {
  const s = `${stores} store${stores === 1 ? "" : "s"}`;
  return [`${m} price: compare ${s}`, `${m}: compare ${s}`, `${m} price comparison`, `${m} price`];
};

/** The name after the shortening steps (3a to 3e, or 3a to 3d with `keepGender`), before any cut. */
export function shortName(f: TitleInput, keepGender = false): string {
  let m = f.name;
  for (const step of steps(f).slice(0, keepGender ? 4 : undefined)) m = step(m) || m;
  return m;
}
const steps = (f: TitleInput) => [(s: string) => dropRepeatedBrand(s, f.brand), (s: string) => dropConvertedSize(s, f.size), dropFiller, abbreviate, dropGender];

/** One title a product could take; `alt` is the other cut, only for a product whose first cut is taken. */
export interface Candidate {
  title: PageTitle;
  fits: boolean;
  alt?: boolean;
}

/** Every title this product could take, richest first; the first that fits is the page's. */
export function titleCandidates(f: TitleInput, site: string, max = TITLE_MAX): Candidate[] {
  const suffix = ` | ${site}`.length;
  const out: Candidate[] = [];
  for (const t of hooks(f.name, f.stores)) out.push({ title: t, fits: t.length + suffix <= max });
  for (const t of hooks(f.name, f.stores)) out.push({ title: { absolute: t }, fits: t.length <= max });
  let m = f.name;
  for (const step of steps(f)) {
    const next = step(m);
    if (next === m || !next) continue;
    m = next;
    const t = `${m} price`;
    out.push({ title: { absolute: t }, fits: t.length <= max });
  }
  const cut = cutToFit(m, f.brand, f.size, max);
  if (cut) out.push({ title: { absolute: `${cut} price` }, fits: true });
  const alt = cutToFit(m, f.brand, f.size, max, "", true);
  if (alt && alt !== cut) out.push({ title: { absolute: `${alt} price` }, fits: true, alt: true });
  return out;
}

const key = (t: PageTitle, site: string) => renderTitle(t, site).toLowerCase();

/** "<name> price · …1234": for a product whose name another product has word for word. */
function withBarcode(f: TitleInput, max: number): PageTitle {
  const tail = ` · …${f.ean.slice(-4)}`;
  const m = shortName(f);
  const whole = `${m} price${tail}`;
  if (whole.length <= max) return { absolute: whole };
  const cut = cutToFit(m, f.brand, f.size, max, tail);
  return { absolute: `${cut ?? m} price${tail}` };
}

/**
 * The title of every product page, unique across the site (as rendered, ignoring case). When two products land on
 * the same title, the older one (first seen, then barcode) keeps it; another whose name differs takes its other cut
 * when the cut made them alike, else its last richer candidate nobody has (the step that made them alike is undone,
 * even past 60); one whose name says the same as the other's (word for word once steps 3a to 3d are done) ends in
 * its barcode's last four digits.
 */
export function productTitles(products: TitleInput[], site: string, max = TITLE_MAX): Map<string, PageTitle> {
  const cands = new Map(products.map((f) => [f.slug, titleCandidates(f, site, max)]));
  const chosen = new Map<string, PageTitle>();
  const index = new Map<string, number>();
  for (const f of products) {
    const c = cands.get(f.slug)!;
    const i = c.findIndex((x) => x.fits && !x.alt);
    index.set(f.slug, i < 0 ? c.length - 1 : i);
    chosen.set(f.slug, c[index.get(f.slug)!].title);
  }
  const groups = new Map<string, TitleInput[]>();
  for (const f of products) {
    const k = key(chosen.get(f.slug)!, site);
    groups.set(k, [...(groups.get(k) ?? []), f]);
  }
  const taken = new Set([...chosen.values()].map((t) => key(t, site)));
  const order = (a: TitleInput, b: TitleInput) => a.first.localeCompare(b.first) || a.ean.localeCompare(b.ean);
  for (const k of [...groups.keys()].sort()) {
    const g = groups.get(k)!;
    if (g.length < 2) continue;
    const sorted = [...g].sort(order);
    sorted.slice(1).forEach((f, i) => {
      // Alike once the brand said twice, the other unit, filler and spelling are gone ("Eau De Parfum Spray 50ml" and
      // "Eau de Parfum 50ml"): the same thing by name, told apart by barcode. "for Men" and "for Women" still differ.
      const alike = shortName(f, true).toLowerCase();
      const sameName = sorted.slice(0, i + 1).some((x) => shortName(x, true).toLowerCase() === alike);
      let pick: PageTitle | undefined;
      if (!sameName) {
        const c = cands.get(f.slug)!;
        const alt = c.find((x) => x.alt && !taken.has(key(x.title, site)));
        if (alt && index.get(f.slug) === c.length - 2) pick = alt.title;
        for (let j = index.get(f.slug)! - 1; j >= 0 && !pick; j--) if (!taken.has(key(c[j].title, site))) pick = c[j].title;
      }
      pick ??= withBarcode(f, max);
      chosen.set(f.slug, pick);
      taken.add(key(pick, site));
    });
  }
  return chosen;
}
