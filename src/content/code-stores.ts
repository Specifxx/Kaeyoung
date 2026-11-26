// DISCOUNT-CODE PAGES (owner, 2026-11-26; OzBargain study, move 3): the stores that pay us commission through Awin and
// get a /codes/<slug> page. Only a store that accepted us on Awin (Compare Empire's data/awin/programmes.json) belongs
// here: its codes come from its own affiliate feed, so every code on the page is one the store published.
// A slug is kept forever once given (the URL is frozen): never rename or remove an entry, set `retired` instead.
export interface CodeStore {
  /** the store's Awin advertiser id */
  awin: number;
  slug: string;
  name: string;
  /** the store's own home page, where the paid link lands */
  home: string;
  /** where the store ships from, for the page's facts line */
  region: "US" | "UK" | "CA" | "AU" | "NZ" | "EU";
  /** our own store id in src/content/stores.ts, when we also compare its prices */
  storeId?: string;
  /** kept for its URL, no longer shown in the hub */
  retired?: boolean;
}

export const CODE_STORES: CodeStore[] = [{ awin: 90791, slug: "stylevana", name: "Stylevana", home: "https://www.stylevana.com/", region: "US" }];
