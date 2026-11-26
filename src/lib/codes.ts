// DISCOUNT-CODE PAGES (owner, 2026-11-26; OzBargain study, move 3). One page per store that pays us commission
// (src/content/code-stores.ts), listing the codes and deals the store itself publishes through its Awin feed, and a
// "did it work?" vote under each code, kept by RiftCompare for every site (riftcompare.com/api/code-votes).
//
// • Real codes only: a code is the advertiser's own `code` field on an Awin voucher, never one we typed, guessed or
//   read from a coupon site. A deal is an Awin promotion with no code ("Free delivery over £25").
// • scripts/codes.ts runs in the daily import and writes data/public/codes.json through mergeCodes: a code keeps the
//   day we first saw it, and one that leaves the feed or passes its end date moves to `ended` (kept ENDED_DAYS days,
//   struck through, so the page says honestly that it stopped).
// • Order never comes from votes or commission: codes first, then deals, newest published first.
// • Votes are shown beside a code only. Client-safe: no node imports.

export interface AwinPromotionIn {
  id: number;
  advertiserId: number;
  type: "promotion" | "voucher";
  title: string;
  description?: string;
  start: string;
  end: string;
  regions: "all" | string[];
  code?: string;
}

export interface StoreCode {
  /** "aw-<Awin promotion id>": the vote key, stable for the code's life */
  id: string;
  /** the code to type at checkout; absent for a deal */
  code?: string;
  title: string;
  /** the advertiser's fine print, when it says more than the title */
  terms?: string;
  start: string;
  end: string;
  /** ISO country codes ("US", "GB"), or "all" */
  regions: "all" | string[];
  /** YYYY-MM-DD we first saw it */
  seen: string;
  /** YYYY-MM-DD it left the feed or passed its end date */
  ended?: string;
}

export interface CodesFile {
  updatedAt: string;
  stores: Record<string, { live: StoreCode[]; ended: StoreCode[] }>;
}

/** How long an ended code stays on its page, struck through. */
export const ENDED_DAYS = 45;
/** A code ending sooner than this after the build is left out: a static page lives until the next release. */
export const END_MARGIN_MS = 12 * 3_600_000;
/** An end date this far out is the network's "no end date", not a real one. */
export const OPEN_ENDED_YEARS = 3;

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", "#39": "'", rsquo: "’", lsquo: "‘", ndash: "–", mdash: "—", pound: "£", euro: "€" };

/** Awin titles arrive HTML-escaped ("$50 &amp; Up"): decode the few entities they use, collapse spaces. */
export function decode(s: string): string {
  return s
    .replace(/&(#\d+|#x[0-9a-f]+|[a-z]+\d*);/gi, (m, e: string) => {
      if (e[0] === "#") {
        const n = e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
        return Number.isFinite(n) && n > 31 ? String.fromCodePoint(n) : "";
      }
      return ENTITIES[e.toLowerCase()] ?? m;
    })
    .replace(/[\u0000-\u001f]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** The parts of a "Headline | fine print | Limited Time Only" title, without marketing filler or repeats. */
function parts(s: string): string[] {
  const out: string[] = [];
  for (const p of decode(s).split(/\s*\|\s*/)) {
    const t = p.replace(/^[-–—.\s]+$/, "").replace(/^\((.*)\)$/, "$1").trim();
    if (!t || /^limited time( only)?!?$/i.test(t)) continue;
    if (!out.some((o) => o.toLowerCase() === t.toLowerCase())) out.push(t);
  }
  return out;
}

const plain = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** A store's name and "- Store Name" / "at Store.com" tails add nothing on that store's own page. */
function trimStore(s: string, store: string): string {
  const name = plain(store).split(/\s+/).map(escape).join("\\s*");
  const tail = new RegExp(`\\s*(?:[-–—]\\s*|\\b(?:at|from|with)\\s+)(?:the\\s+)?${name}(?:\\s*(?:uk|us|au))?(?:\\.(?:com|co\\.uk|com\\.au))?\\s*$`, "i");
  const mid = new RegExp(`\\s+(?:at|from)\\s+(?:the\\s+)?${name}(?:\\.(?:com|co\\.uk|com\\.au))?(?=\\s)`, "gi");
  return plain(s).replace(tail, "").replace(mid, "").trim();
}

/** Shouting and run-together words from the feed, in plain case: "10% OFF" → "10% off", "UpTo" → "Up to". */
function tidy(s: string): string {
  return s
    .replace(/([\d%$£€]\s*)OFF\b/g, "$1off")
    .replace(/\bup\s?to\b/gi, (m) => (m[0] === "U" ? "Up to" : "up to"))
    .replace(/&/g, "and")
    .replace(/^for\s+/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** "10% off with code SUM26", "Use code V26." say the code again: the page shows it in its own box. */
function trimCode(s: string, code: string | null): string {
  if (!code) return s;
  const c = escape(code);
  return s
    .replace(new RegExp(`\\s*[-,(]?\\s*\\b(?:use|with|enter|apply)?\\s*(?:the\\s+)?(?:promo\\s+|discount\\s+|voucher\\s+)?code:?\\s*${c}\\b\\)?\\.?`, "gi"), "")
    .replace(new RegExp(`^${c}\\s*[-–—:]\\s*`, "i"), "")
    .replace(/\s+/g, " ")
    .trim();
}

/** The title and fine print a shopper reads, from the advertiser's own words. */
export function wording(p: Pick<AwinPromotionIn, "title" | "description">, store: string, code: string | null = null): { title: string; terms?: string } {
  const clean = (x: string) => tidy(trimCode(trimStore(x, store), code));
  const t = parts(p.title).map(clean).filter(Boolean);
  const d = parts(p.description ?? "").map(clean).filter(Boolean);
  let first = t[0] ?? d[0] ?? "";
  // "10% off" with a description "10% off orders $50 and up": the description is the better headline.
  for (const x of [...t.slice(1), ...d]) if (x.length > first.length && x.length <= 90 && x.toLowerCase().startsWith(first.toLowerCase())) first = x;
  const title = first.charAt(0).toUpperCase() + first.slice(1);
  const seen = new Set([title.toLowerCase()]);
  const rest: string[] = [];
  for (const x of [...t.slice(1), ...d]) {
    const k = x.toLowerCase();
    if (seen.has(k) || title.toLowerCase().includes(k) || (k.length > 8 && k.includes(title.toLowerCase()))) continue;
    seen.add(k);
    rest.push(x);
  }
  const terms = rest.join(". ").slice(0, 220);
  return { title: title.slice(0, 120), ...(terms ? { terms } : {}) };
}

/** A code a shopper can type: letters, digits and a few joiners, 2 to 32 long. Anything else is not a code. */
export function cleanCode(c: string | undefined): string | null {
  const t = decode(c ?? "").trim();
  return /^[A-Za-z0-9][A-Za-z0-9_\-.]{1,31}$/.test(t) ? t : null;
}

const day = (ms: number) => new Date(ms).toISOString().slice(0, 10);

/**
 * Today's file from yesterday's and today's Awin promotions. `stores` maps an Awin advertiser id to its slug and name.
 * `refuse` drops an offer the site itself would never list (a tester on ScentCompare). Pure: the same inputs give the same file.
 */
export function mergeCodes(prev: CodesFile | null, promos: AwinPromotionIn[], stores: { awin: number; slug: string; name: string }[], now: number, refuse: (text: string) => boolean = () => false): CodesFile {
  const today = day(now);
  const out: CodesFile = { updatedAt: new Date(now).toISOString(), stores: {} };
  for (const s of stores) {
    const before = prev?.stores[s.slug] ?? { live: [], ended: [] };
    const seenOn = new Map(before.live.map((c) => [c.id, c.seen]));
    const live: StoreCode[] = [];
    const ids = new Set<string>();
    for (const p of promos) {
      if (p.advertiserId !== s.awin) continue;
      const start = Date.parse(p.start);
      const end = Date.parse(p.end);
      if (!Number.isFinite(start) || !Number.isFinite(end) || start > now || end - now < END_MARGIN_MS) continue;
      const code = p.type === "voucher" ? cleanCode(p.code) : null;
      if (p.type === "voucher" && !code) continue; // a voucher with no usable code is neither
      const w = wording(p, s.name, code);
      if (!w.title || refuse(`${w.title} ${w.terms ?? ""}`)) continue;
      const id = `aw-${p.id}`;
      if (ids.has(id)) continue;
      ids.add(id);
      const regions = p.regions === "all" ? "all" : [...new Set(p.regions.filter((r) => /^[A-Z]{2}$/.test(r)))];
      if (regions !== "all" && regions.length === 0) continue;
      live.push({ id, ...(code ? { code } : {}), title: w.title, ...(w.terms ? { terms: w.terms } : {}), start: p.start, end: p.end, regions, seen: seenOn.get(id) ?? today });
    }
    // Two vouchers with the same code are one code: keep the newest published.
    const byCode = new Map<string, StoreCode>();
    const deals: StoreCode[] = [];
    for (const c of live) {
      if (!c.code) {
        deals.push(c);
        continue;
      }
      const k = c.code.toUpperCase();
      const had = byCode.get(k);
      if (!had || c.start > had.start) byCode.set(k, had ? { ...c, seen: had.seen < c.seen ? had.seen : c.seen } : c);
    }
    const kept = [...byCode.values(), ...deals].sort(order);
    const keptIds = new Set(kept.map((c) => c.id));
    const cutoff = day(now - ENDED_DAYS * 86_400_000);
    const ended = [
      ...before.live.filter((c) => !keptIds.has(c.id) && c.code && !kept.some((k) => k.code?.toUpperCase() === c.code!.toUpperCase())).map((c) => ({ ...c, ended: today })),
      ...before.ended.filter((c) => (c.ended ?? today) >= cutoff && !keptIds.has(c.id)),
    ]
      .filter((c, i, a) => a.findIndex((x) => x.id === c.id) === i)
      .sort((a, b) => (b.ended ?? "").localeCompare(a.ended ?? "") || a.id.localeCompare(b.id))
      .slice(0, 20);
    out.stores[s.slug] = { live: kept, ended };
  }
  return out;
}

/** Codes before deals, then newest published first, then by id: never by votes or commission. */
export function order(a: StoreCode, b: StoreCode): number {
  return Number(!a.code) - Number(!b.code) || b.start.localeCompare(a.start) || a.id.localeCompare(b.id);
}

/** True when the end date is the network's placeholder for "until further notice". */
export function openEnded(c: Pick<StoreCode, "end">, now: number): boolean {
  return Date.parse(c.end) - now > OPEN_ENDED_YEARS * 365 * 86_400_000;
}

const COUNTRY: Record<string, string> = { US: "US", GB: "UK", CA: "Canada", AU: "Australia", NZ: "New Zealand", DE: "Germany", FR: "France", IE: "Ireland" };

/** "All regions", "US only", "UK and Ireland". */
export function regionLabel(r: StoreCode["regions"]): string {
  if (r === "all") return "All regions";
  const names = r.map((c) => COUNTRY[c] ?? c);
  return names.length === 1 ? `${names[0]} only` : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

/** "Ends 30 Nov", "Ends 31 Jan 2027", or null for an open-ended code. */
export function endLabel(c: Pick<StoreCode, "end">, now: number): string | null {
  if (openEnded(c, now)) return null;
  const d = new Date(c.end);
  const sameYear = d.getUTCFullYear() === new Date(now).getUTCFullYear();
  return `Ends ${d.toLocaleDateString("en-GB", { day: "numeric", month: "short", ...(sameYear ? {} : { year: "numeric" }), timeZone: "UTC" })}`;
}

/** The votes a code shows: worked share and how many voted, or null before anyone has. */
export function voteSummary(t: { worked: number; failed: number } | undefined): { share: number; total: number } | null {
  const total = (t?.worked ?? 0) + (t?.failed ?? 0);
  return t && total > 0 ? { share: t.worked / total, total } : null;
}

/** "just now", "3 hours ago", "2 days ago" (client-side, from the vote's ISO time). */
export function ago(iso: string, now: number): string {
  const s = Math.max(0, (now - Date.parse(iso)) / 1000);
  if (s < 90) return "just now";
  const m = s / 60;
  if (m < 60) return `${Math.round(m)} minutes ago`;
  const h = m / 60;
  if (h < 36) return `${Math.round(h)} hour${Math.round(h) === 1 ? "" : "s"} ago`;
  const d = h / 24;
  return d < 60 ? `${Math.round(d)} days ago` : `${Math.round(d / 30)} months ago`;
}

/** The short face of a code's ticket, read from its own title: "10%", "$15", "Free delivery", or "Deal". Display only. */
export function valueTag(title: string): { pre?: string; big: string; small: string } {
  const t = title.toLowerCase();
  const pct = /(\d{1,2})\s?%/.exec(title);
  const cash = /([$£€]\s?\d{1,4})(?![\d%])/.exec(title);
  const upTo = /\bup\s?to\b/i.test(title);
  if (pct && (!cash || title.indexOf(pct[0]) < title.indexOf(cash[0]))) return { ...(upTo ? { pre: "up to" } : {}), big: `${pct[1]}%`, small: "off" };
  if (cash && /\boff\b/i.test(t)) return { big: cash[1].replace(/\s/, ""), small: "off" };
  if (/free (tracked )?(shipping|delivery)/.test(t)) return { big: "Free", small: "delivery" };
  if (/gift/.test(t)) return { big: "Gift", small: "with order" };
  return { big: "Deal", small: "" };
}

/** The biggest "N% off" a store's live codes and deals name, for the hub card ("Up to 70% off"). */
export function bestPercent(codes: Pick<StoreCode, "title">[]): number | null {
  let best = 0;
  for (const c of codes) for (const m of c.title.matchAll(/(\d{1,2})\s?%/g)) best = Math.max(best, Number(m[1]));
  return best || null;
}
