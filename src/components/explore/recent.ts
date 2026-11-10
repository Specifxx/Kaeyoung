// Recently viewed (2026-11-10, the PriceRunner-style redesign): the visitor's own last
// product pages, kept in THEIR browser only (localStorage), never sent anywhere. The
// product page records a visit (TrackView); the home page and product pages show the
// list (RecentlyViewed), with the lowest store price the visitor saw, so a return visit
// starts where the last one ended. Byte-identical in KaeYoung and ScentCompare; each
// passes its own key prefix (the one its region and theme keys use).
export const RECENT_MAX = 12;

export interface RecentItem {
  /** slug */
  s: string;
  /** name, brand, photo */
  n: string;
  b: string;
  i: string | null;
  /** the lowest in-stock store price per region when seen, minor units */
  p: Record<string, number>;
  /** when seen, ms */
  t: number;
}

export function recentKey(prefix: string): string {
  return `${prefix}-recent`;
}

/** The stored list, newest first; anything malformed is dropped, never trusted. */
export function readRecent(prefix: string): RecentItem[] {
  try {
    const raw = JSON.parse(localStorage.getItem(recentKey(prefix)) || "[]");
    if (!Array.isArray(raw)) return [];
    return raw
      .filter((x) => x && typeof x.s === "string" && typeof x.n === "string" && typeof x.t === "number")
      .slice(0, RECENT_MAX);
  } catch {
    return [];
  }
}

/** Puts `item` first, removing its older copy, keeping RECENT_MAX. */
export function pushRecent(list: RecentItem[], item: RecentItem): RecentItem[] {
  return [item, ...list.filter((x) => x.s !== item.s)].slice(0, RECENT_MAX);
}

export function writeRecent(prefix: string, list: RecentItem[]): void {
  try {
    localStorage.setItem(recentKey(prefix), JSON.stringify(list));
  } catch {
    /* private mode or full storage: the feature just stays empty */
  }
}
