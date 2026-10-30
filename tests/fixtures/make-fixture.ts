// Writes a small, obviously synthetic dataset to tests/fixtures/data for local
// development and tests (KY_DATA_DIR=tests/fixtures/data). Never copied to
// data/public: the site only ever publishes prices a store showed.
import fs from "node:fs";
import path from "node:path";
import type { History, Meta, Product } from "@/lib/types";
import { CATEGORIES, type RegionCode } from "@/site";

const names = ["Sample Snail Essence", "Test Rice Toner", "Fixture Sun Cream", "Demo Cleansing Oil", "Example Ceramide Cream", "Mock Sheet Mask", "Placeholder Eye Cream", "Stub Lip Mask", "Dummy Cushion", "Trial Body Lotion", "Proto Serum", "Beta Gel Cream"];
const brands = ["Brand Alpha", "Brand Beta", "Brand Gamma"];
const stores: Record<RegionCode, string[]> = { US: ["us-a", "us-b", "us-c"], UK: ["uk-a", "uk-b"], CA: ["ca-a", "ca-b"], AU: ["au-a", "au-b", "au-c"], NZ: ["nz-a", "nz-b"], EU: ["eu-a", "eu-b"] };
const base: Record<RegionCode, number> = { US: 2199, UK: 1799, CA: 2899, AU: 3295, NZ: 3495, EU: 1999 };

function ean(prefix: string): string {
  const d = prefix.padEnd(12, "0").slice(0, 12);
  let s = 0;
  for (let i = 0; i < 12; i++) s += Number(d[i]) * (i % 2 ? 3 : 1);
  return d + ((10 - (s % 10)) % 10);
}

const products: Product[] = names.map((n, i) => {
  const brand = brands[i % 3];
  const name = `${brand} ${n} 100ml`;
  const offers: Product["offers"] = {};
  (Object.keys(stores) as RegionCode[]).forEach((r, k) => {
    if ((i + k) % 5 === 4) return;
    offers[r] = stores[r].map((s, j) => ({ s, p: base[r] + j * 300 - (i % 4) * 100, st: (i + j) % 7 === 3 ? "out" : "in", u: `https://example.com/${s}/${i}` }));
  });
  return {
    ean: ean(`88090000${String(i).padStart(4, "0")}`),
    slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    name,
    brand,
    b: brand.toLowerCase().replace(/\s+/g, "-"),
    cat: CATEGORIES[i % (CATEGORIES.length - 1)].key,
    size: "100ml",
    img: null,
    first: `2026-10-${String(10 + i).padStart(2, "0")}`,
    offers,
  };
});
const history: History = Object.fromEntries(products.map((f) => [f.ean, { US: [[20740, 2599], [20750, 2399], [20755, f.offers.US?.[0]?.p ?? 2199]] }]));
const meta: Meta = { updatedAt: "2026-10-30T08:00:00Z", products: products.length, stores: {} };
const dir = path.join(__dirname, "data");
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(path.join(dir, "products.json"), JSON.stringify({ products }, null, 1));
fs.writeFileSync(path.join(dir, "history.json"), JSON.stringify(history));
fs.writeFileSync(path.join(dir, "meta.json"), JSON.stringify(meta, null, 1));
console.log(`${products.length} fixture products`);
