// Server-side helpers for the /codes pages: which stores show, their paid link, and the words their pages use.
import { CODE_STORES, type CodeStore } from "@/content/code-stores";
import { getCodes } from "./data";
import { awinDeepLink, clickref } from "./awin";
import { SITE } from "@/site";
import { bestPercent, type StoreCode } from "./codes";

export interface CodeStorePage {
  s: CodeStore;
  live: StoreCode[];
  ended: StoreCode[];
  codes: number;
  deals: number;
  best: number | null;
}

export function codeStorePages(): CodeStorePage[] {
  const f = getCodes();
  return CODE_STORES.map((s) => {
    const d = f.stores[s.slug] ?? { live: [], ended: [] };
    const codes = d.live.filter((c) => c.code).length;
    return { s, live: d.live, ended: d.ended, codes, deals: d.live.length - codes, best: bestPercent(d.live) };
  });
}

export function codeStorePage(slug: string): CodeStorePage | null {
  return codeStorePages().find((p) => p.s.slug === slug) ?? null;
}

/** The store's tracked Awin link to its home page: the code is used there, and the visit earns. */
export function codeStoreHref(s: CodeStore): string {
  return awinDeepLink(s.awin, s.home, clickref(SITE.key, "codes", s.slug));
}

/** When the codes were last read, as "26 Nov 2026"; null before the first run. */
export function codesCheckedOn(): string | null {
  const at = getCodes().updatedAt;
  return at ? new Date(at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }) : null;
}

export function codesMonth(): string {
  const at = getCodes().updatedAt || new Date().toISOString();
  return new Date(at).toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });
}

/** A page is worth Google's time only while it has something live. */
export function codeStoreIndexable(p: CodeStorePage): boolean {
  return p.live.length > 0 && !p.s.retired;
}
