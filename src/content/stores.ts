// Every store K Young reads. Real shops only, never marketplaces (fakes are
// common in K-beauty). Each one is read through its public Shopify
// products.json, two at a time at most, about a request a second, and a store
// that keeps answering 403/429 is skipped for the run (never worked around).
// From the 2026-10-30 store probes (project files:
// next-niche/skincare-store-probe-round2-2026-10-30.md): the readable Shopify
// K-beauty shops whose barcodes we can read, one per stock (boniik.com.au is
// boniik.com, sentisenti.com is oo35mm.com, kiyoko.ca is kiyokobeauty.com).
// Left out: shops with no readable barcode (Mirai Skin, RoseRoseShop, Olive
// Kollection, Korean Beauty Australia, Lewkin, AmiGlow) and shops that charge
// CHF or DKK (Niasha, Derma Space).
import type { RegionCode } from "@/site";

export interface Store {
  id: string;
  name: string;
  region: RegionCode;
  /** https://host, no trailing slash */
  base: string;
  platform: "shopify";
  /** Sells more than K-beauty: only products of known Korean brands get a
   *  barcode lookup (the 880 barcode still decides). */
  mixed?: boolean;
  /** Pays us a commission (shown as "Paid link"): the query parameter and the
   *  env var holding our code, set once the store's program accepts us. */
  affiliate?: { param: string; envVar: string };
}

export const STORES: Store[] = [
  { id: "althea", name: "Althea", region: "US", base: "https://us.althea.kr", platform: "shopify" },
  { id: "bemusedkorea", name: "Be Mused Korea", region: "US", base: "https://bemusedkorea.com", platform: "shopify" },
  { id: "beautywithin", name: "Beauty Within", region: "US", base: "https://beautywithin.com", platform: "shopify", mixed: true },
  { id: "cupidrop", name: "Cupidrop", region: "US", base: "https://cupidrop.com", platform: "shopify" },
  { id: "dodoskin", name: "DODOSKIN", region: "US", base: "https://dodoskin.com", platform: "shopify", mixed: true },
  { id: "stylekorean", name: "Hola StyleKorean", region: "US", base: "https://holastylekorean.com", platform: "shopify" },
  { id: "moida", name: "MOIDA", region: "US", base: "https://bloomingkoco.com", platform: "shopify" },
  { id: "ohlolly", name: "Ohlolly", region: "US", base: "https://ohlolly.com", platform: "shopify" },
  { id: "sentisenti", name: "Senti Senti", region: "US", base: "https://oo35mm.com", platform: "shopify" },
  { id: "sokoglam", name: "Soko Glam", region: "US", base: "https://sokoglam.com", platform: "shopify" },
  { id: "songofskin", name: "Song of Skin", region: "US", base: "https://songofskin.com", platform: "shopify" },
  { id: "wishtrend", name: "Wishtrend", region: "US", base: "https://wishtrend.com", platform: "shopify" },
  { id: "glamtouch", name: "Glam Touch", region: "UK", base: "https://glamtouch.co.uk", platform: "shopify" },
  { id: "justmylook", name: "Justmylook", region: "UK", base: "https://justmylook.com", platform: "shopify", mixed: true },
  { id: "pureseoul", name: "PureSeoul", region: "UK", base: "https://pureseoul.co.uk", platform: "shopify" },
  { id: "skincupid", name: "Skin Cupid", region: "UK", base: "https://skincupid.co.uk", platform: "shopify" },
  { id: "skin2seoul", name: "Skin2Seoul", region: "UK", base: "https://skin2seoul.co.uk", platform: "shopify" },
  { id: "innerbeauty", name: "Inner Beauty", region: "CA", base: "https://kbeautycanada.com", platform: "shopify" },
  { id: "kbeautyoutlet", name: "K-Beauty Outlet", region: "CA", base: "https://kbeautyoutlet.ca", platform: "shopify" },
  { id: "kiokii", name: "Kiokii", region: "CA", base: "https://kiokii.com", platform: "shopify" },
  { id: "kiyoko", name: "Kiyoko Beauty", region: "CA", base: "https://kiyokobeauty.com", platform: "shopify" },
  { id: "koreanskincare-ca", name: "Korean Skincare Canada", region: "CA", base: "https://koreanskincare.ca", platform: "shopify" },
  { id: "lakinza", name: "Lakinza", region: "CA", base: "https://lakinza.ca", platform: "shopify" },
  { id: "lamour", name: "LAMOUR Beauty", region: "CA", base: "https://lamourlife.com", platform: "shopify", mixed: true },
  { id: "moonmoon", name: "Moonmoon Cosmetics", region: "CA", base: "https://moonmooncosmetics.ca", platform: "shopify" },
  { id: "onesplus", name: "Ones+", region: "CA", base: "https://onesplus.ca", platform: "shopify", mixed: true },
  { id: "oomomo", name: "Oomomo", region: "CA", base: "https://oomomostore.com", platform: "shopify", mixed: true },
  { id: "sukoshi", name: "Sukoshi Mart", region: "CA", base: "https://sukoshimart.com", platform: "shopify", mixed: true },
  { id: "thekshop", name: "The K Shop", region: "CA", base: "https://thekshop.ca", platform: "shopify" },
  { id: "uniquebunny", name: "Unique Bunny", region: "CA", base: "https://uniquebunny.com", platform: "shopify", mixed: true },
  { id: "boniik", name: "BONIIK", region: "AU", base: "https://boniik.com", platform: "shopify" },
  { id: "heartdrops", name: "Heartdrops", region: "AU", base: "https://heartdrops.com.au", platform: "shopify" },
  { id: "kanvas", name: "Kanvas Beauty", region: "AU", base: "https://kanvasbeauty.com.au", platform: "shopify" },
  { id: "lila", name: "Lila Beauty", region: "AU", base: "https://lilabeauty.com.au", platform: "shopify" },
  { id: "makeup2beauty", name: "Makeup2Beauty", region: "AU", base: "https://makeup2beauty.com.au", platform: "shopify" },
  { id: "nudieglow", name: "Nudie Glow", region: "AU", base: "https://nudieglow.com", platform: "shopify" },
  { id: "wcosmetics", name: "W Cosmetics", region: "AU", base: "https://wcosmetics.com.au", platform: "shopify", mixed: true },
  { id: "hikoco", name: "HIKOCO", region: "NZ", base: "https://hikoco.co.nz", platform: "shopify" },
  { id: "cosmeticstore-nz", name: "The Cosmetic Store", region: "NZ", base: "https://thecosmeticstore.co.nz", platform: "shopify", mixed: true },
  { id: "boozyshop", name: "Boozyshop", region: "EU", base: "https://boozyshop.com", platform: "shopify", mixed: true },
  { id: "glowstation", name: "GlowStation", region: "EU", base: "https://glowstation.com", platform: "shopify" },
  { id: "korean-skincare-nl", name: "Korean-Skincare.nl", region: "EU", base: "https://korean-skincare.nl", platform: "shopify" },
  { id: "lovemycosmetic", name: "LoveMyCosmetic", region: "EU", base: "https://lovemycosmetic.de", platform: "shopify" },
  { id: "mimomimo", name: "Mimo Mimo", region: "EU", base: "https://mimo-mimo.com", platform: "shopify" },
  { id: "yeppo", name: "Yeppo&Soonsoo", region: "EU", base: "https://yeppo.fi", platform: "shopify" },
];

export const STORE_BY_ID: Record<string, Store> = Object.fromEntries(STORES.map((s) => [s.id, s]));
