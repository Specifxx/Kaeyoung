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
  /** The brand's own store (official prices): compared like any store, and
   *  counted apart in the "brand stores vs K-beauty shops" post. */
  official?: boolean;
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
  // 2026-10-30 rounds 3-4 (project files next-niche/skincare-store-probe-round3*, round4-partial*): brands' own
  // US shops (official prices) and web-searched K-beauty shops with readable 880 barcodes.
  { id: "anua", name: "Anua US", region: "US", base: "https://anua.us", platform: "shopify", official: true },
  { id: "axisy", name: "AXIS-Y", region: "US", base: "https://axis-y.com", platform: "shopify", official: true },
  { id: "beautyofjoseon", name: "Beauty of Joseon", region: "US", base: "https://beautyofjoseon.com", platform: "shopify", official: true },
  { id: "celimax", name: "celimax US", region: "US", base: "https://celimax.us", platform: "shopify", official: true },
  { id: "cosrx", name: "COSRX Official", region: "US", base: "https://cosrx.com", platform: "shopify", official: true },
  { id: "fwee", name: "fwee US", region: "US", base: "https://fwee.us", platform: "shopify", official: true },
  { id: "heimish", name: "heimish US", region: "US", base: "https://heimish.us", platform: "shopify", official: true },
  { id: "jumiso", name: "Jumiso USA", region: "US", base: "https://jumiso.us", platform: "shopify", official: true },
  { id: "klairs", name: "Dear, Klairs", region: "US", base: "https://klairs.com", platform: "shopify", official: true },
  { id: "koreanbeauty", name: "Korean Beauty Canada", region: "CA", base: "https://koreanbeauty.ca", platform: "shopify" },
  { id: "koreanskincareuk", name: "Korean Skincare UK", region: "UK", base: "https://koreanskincare.co.uk", platform: "shopify", mixed: true },
  { id: "manyo", name: "manyo US", region: "US", base: "https://manyo.us", platform: "shopify", official: true },
  { id: "mixsoon", name: "mixsoon", region: "US", base: "https://mixsoon.us", platform: "shopify", official: true },
  { id: "neogenlab", name: "NEOGENLAB US", region: "US", base: "https://neogenlab.us", platform: "shopify", official: true },
  { id: "rovectin", name: "Rovectin", region: "US", base: "https://rovectin.com", platform: "shopify", official: true },
  { id: "skin1004", name: "SKIN1004", region: "US", base: "https://skin1004.com", platform: "shopify", official: true },
  { id: "tirtir", name: "TIRTIR Official", region: "US", base: "https://tirtir.us", platform: "shopify", official: true },
  { id: "tocobo", name: "TOCOBO US", region: "US", base: "https://tocobo.us", platform: "shopify", official: true },
  { id: "tonymoly", name: "TONYMOLY USA", region: "US", base: "https://tonymoly.us", platform: "shopify", official: true },
  { id: "torriden", name: "Torriden", region: "US", base: "https://torriden.us", platform: "shopify", official: true },
  { id: "aurak", name: "AuraK K Beauty", region: "UK", base: "https://aurak.co.uk", platform: "shopify" },
  { id: "beyondrx", name: "beyondRx", region: "CA", base: "https://beyondrx.ca", platform: "shopify", mixed: true },
  { id: "cosmadic", name: "Cosmadic", region: "EU", base: "https://cosmadic.de", platform: "shopify" },
  { id: "deiji", name: "Deiji", region: "NZ", base: "https://deiji.co.nz", platform: "shopify", mixed: true },
  { id: "dramabeauty", name: "Drama Beauty", region: "US", base: "https://dramabeauty.com", platform: "shopify", mixed: true },
  { id: "glowiss", name: "Glowiss", region: "US", base: "https://glowiss.com", platform: "shopify", mixed: true },
  { id: "helloseoul", name: "Hello Seoul", region: "UK", base: "https://helloseoul.co.uk", platform: "shopify", mixed: true },
  { id: "holyskin", name: "Holy Skin", region: "EU", base: "https://holyskin.fr", platform: "shopify" },
  { id: "itsglowy", name: "itsglowy", region: "EU", base: "https://itsglowy.de", platform: "shopify" },
  { id: "jessicanailsupply", name: "Jessica Nail & Beauty Supply", region: "CA", base: "https://jessicanailsupply.ca", platform: "shopify", mixed: true },
  { id: "kbeautyave", name: "K-BEAUTY AVE", region: "US", base: "https://kbeautyave.com", platform: "shopify" },
  { id: "kbeautyshop", name: "KBeauty NZ", region: "NZ", base: "https://kbeautyshop.co.nz", platform: "shopify" },
  { id: "korean", name: "Korean.lt", region: "EU", base: "https://korean.lt", platform: "shopify" },
  { id: "koreancare", name: "Koreancare", region: "EU", base: "https://koreancare.net", platform: "shopify", mixed: true },
  { id: "kosbeauty", name: "KosBeauty", region: "US", base: "https://kosbeauty.com", platform: "shopify" },
  { id: "kosmosbeauty", name: "Kosmos Beauty Lab", region: "EU", base: "https://kosmosbeauty.com", platform: "shopify", mixed: true },
  { id: "kskinaura", name: "K Skin Aura", region: "UK", base: "https://kskinaura.co.uk", platform: "shopify" },
  { id: "mcgorisks", name: "McGorisks Health & Beauty", region: "EU", base: "https://mcgorisks.ie", platform: "shopify", mixed: true },
  { id: "pasteurpharmacy", name: "Pasteur Pharmacy", region: "US", base: "https://pasteurpharmacy.com", platform: "shopify", mixed: true },
  { id: "purida", name: "Purida", region: "EU", base: "https://purida.de", platform: "shopify" },
  { id: "sk1ntro", name: "Sk1ntro", region: "CA", base: "https://sk1ntro.com", platform: "shopify", mixed: true },
  { id: "skinorea", name: "SKINOREA", region: "EU", base: "https://skinorea.com", platform: "shopify" },
  { id: "skinshop", name: "SkinShop", region: "EU", base: "https://skinshop.ie", platform: "shopify", mixed: true },
  { id: "yepposoonsoo", name: "Yeppo Soonsoo", region: "EU", base: "https://yepposoonsoo.de", platform: "shopify", mixed: true },
  { id: "koreanskincare-nl", name: "Korean Skincare NL", region: "EU", base: "https://koreanskincare.nl", platform: "shopify", mixed: true },
  { id: "usinnisfree", name: "innisfree US", region: "US", base: "https://us.innisfree.com", platform: "shopify", official: true },
];

export const STORE_BY_ID: Record<string, Store> = Object.fromEntries(STORES.map((s) => [s.id, s]));
