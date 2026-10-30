// Brands. A store's Shopify `vendor` field is the brand, written each store's
// own way ("COSRX", "Cosrx", "COSRX Inc."); they are folded into one key and
// shown with the spelling below, else the spelling most stores use. A vendor
// that is just the store's own name, or empty, falls back to a known brand
// at the start of the title.
import { slugify } from "./slug";

/** Display spellings for brands stores write many ways (key → name). */
const KNOWN: string[] = [
  "COSRX", "Beauty of Joseon", "Anua", "SKIN1004", "Round Lab", "Torriden", "Isntree", "Laneige", "innisfree", "ETUDE",
  "MISSHA", "SOME BY MI", "Klairs", "Purito", "medicube", "numbuzin", "ma:nyo", "mixsoon", "Abib", "AXIS-Y", "Haruharu Wonder",
  "Dr.Jart+", "Sulwhasoo", "TIRTIR", "BANILA CO", "Pyunkang Yul", "heimish", "Benton", "NEOGEN", "Illiyoon", "AESTURA",
  "Biodance", "Goodal", "d'Alba", "A'PIEU", "TONYMOLY", "Holika Holika", "SKINFOOD", "By Wishtrend", "iUNIK", "Cos De BAHA",
  "Elizavecca", "Mediheal", "Nacific", "Rovectin", "Aprilskin", "celimax", "VT Cosmetics", "Ample:N", "Jumiso", "beplain",
  "make p:rem", "Tocobo", "Thank You Farmer", "I'm from", "Papa Recipe", "Hanyul", "belif", "HERA", "peripera", "rom&nd",
  "CLIO", "3CE", "Amuse", "fwee", "Dear, Klairs", "Dr.G", "UIQ", "Zeroid", "Bring Green", "CNP Laboratory", "Daeng Gi Meo Ri",
  "Ryo", "Mise en Scène", "Skin&Lab", "Dr.Ceuracle", "Hince", "Espoir", "Sioris", "Huxley", "Manyo Factory", "Krave Beauty",
  "Mary&May", "Dr. Althea", "Real Barrier", "Atopalm", "Physiogel", "Missha", "Leegeehaam", "Logically, Skin", "Needly",
  "Ongredients", "Dr. Different", "Benton", "Pure Bio", "Frudia", "Secret Key", "It's Skin", "Nature Republic", "The Face Shop",
  "Banila Co", "Hyggee", "Unleashia", "Wakemake", "Glow Recipe", "Peach & Lily", "Then I Met You", "Kaine", "Dalba",
  "Commonlabs", "Skin Atelier", "Arencia", "House of Hur", "Haruharu", "Barulab", "Ma:nyo", "Lador", "Masil", "Holika",
  "Bioderma",
];

/** "Dr.Jart+" / "dr jart" → "drjart". */
export function brandKey(raw: string): string {
  return raw
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\b(co\.?,?\s*ltd|inc|ltd|official|cosmetics|cosmetic|korea|beauty)\b\.?$/g, "")
    .replace(/[^a-z0-9]+/g, "");
}

const KNOWN_BY_KEY = new Map<string, string>();
for (const name of KNOWN) if (!KNOWN_BY_KEY.has(brandKey(name))) KNOWN_BY_KEY.set(brandKey(name), name);
// One brand under two names.
const ALIAS: Record<string, string> = { dalba: "dalba", manyofactory: "manyo", haruharu: "haruharuwonder", holika: "holikaholika", dearklairs: "klairs", banila: "banilaco", cnp: "cnplaboratory", drjart: "drjart" };

export function canonicalKey(raw: string): string {
  const k = brandKey(raw);
  return ALIAS[k] ?? k;
}

/** The display name for a brand key, given the spellings stores used. */
export function brandName(key: string, spellings: string[]): string {
  const known = KNOWN_BY_KEY.get(key);
  if (known) return known;
  const c = new Map<string, number>();
  for (const s of spellings) c.set(s.trim(), (c.get(s.trim()) ?? 0) + 1);
  return [...c.entries()].sort((a, b) => b[1] - a[1] || (a[0] === a[0].toUpperCase() ? 1 : -1))[0]?.[0] ?? key;
}

const KNOWN_SORTED = [...KNOWN_BY_KEY.values()].sort((a, b) => b.length - a.length);

/** A known brand named at the start of a title ("COSRX Advanced Snail…"). */
export function brandFromTitle(title: string): string | null {
  const t = title.replace(/^\s*\[[^\]]*\]\s*/, "");
  for (const name of KNOWN_SORTED) {
    const re = new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s*")}(?![a-z0-9])`, "i");
    if (re.test(t)) return name;
  }
  return null;
}

/**
 * The brand of one listing: the vendor, unless it is empty or the store's own
 * name (some shops put themselves there), then a known brand at the start of
 * the title.
 */
export function listingBrand(vendor: string, title: string, storeName: string): string | null {
  const v = vendor.trim();
  const store = brandKey(storeName);
  if (v && brandKey(v) && brandKey(v) !== store && !/^(default|vendor|unknown|k-?beauty|korean)/i.test(v)) return v;
  return brandFromTitle(title);
}

export const brandSlug = (key: string, name: string) => slugify(name) || key;
