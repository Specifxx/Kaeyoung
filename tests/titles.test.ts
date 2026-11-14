// Product page titles fit 60 characters and stay unique (2026-11-14, DECISIONS.md "Product titles fit 60").
// The same file runs on KaeYoung and ScentCompare: the first half pins the trimming order on made-up names, the second
// measures the real titles of every product page in the committed data.
import { test } from "node:test";
import assert from "node:assert/strict";
import { productTitles, renderTitle, titleCandidates, TITLE_MAX, type TitleInput } from "@/lib/titles";
import { getProducts, productTitle, storeCount } from "@/lib/data";
import { SITE } from "@/site";

const SITE_NAME = "Site"; // " | Site": 7 characters
const p = (name: string, extra: Partial<TitleInput> = {}): TitleInput => ({
  slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
  name,
  brand: name.split(" ")[0],
  size: name.match(/\d+(?:\.\d+)?\s?(?:ml|g|oz)\b/i)?.[0] ?? null,
  stores: 9,
  ean: "8801234567893",
  first: "2026-11-01",
  ...extra,
});
const one = (f: TitleInput) => renderTitle(productTitles([f], SITE_NAME).get(f.slug)!, SITE_NAME);

test("a name that fits keeps the hook and the site name; the site name goes before the name is touched", () => {
  assert.equal(one(p("Acme Toner 150ml")), "Acme Toner 150ml price: compare 9 stores | Site");
  const mid = p("Acme Heartleaf Pore Control Cleansing Oil Mild 200ml"); // 51: "<name> price" fits only alone
  assert.equal(one(mid), "Acme Heartleaf Pore Control Cleansing Oil Mild 200ml price");
});

test("then the brand said twice, the size in the other unit, filler, EDP, gender, in that order", () => {
  const f = p("Givenchy Gentleman Society by Givenchy Eau De Parfum Spray 3.4 oz for Men 100ml", { brand: "Givenchy", size: "100ml" });
  const steps = titleCandidates(f, SITE_NAME).slice(8).map((c) => renderTitle(c.title, SITE_NAME));
  assert.deepEqual(steps.slice(0, 5), [
    "Givenchy Gentleman Society Eau De Parfum Spray 3.4 oz for Men 100ml price",
    "Givenchy Gentleman Society Eau De Parfum Spray for Men 100ml price",
    "Givenchy Gentleman Society Eau De Parfum for Men 100ml price",
    "Givenchy Gentleman Society EDP for Men 100ml price",
    "Givenchy Gentleman Society EDP 100ml price",
  ]);
  assert.equal(one(f), "Givenchy Gentleman Society Eau De Parfum for Men 100ml price"); // the first that fits
});

test("the last resort cuts words, keeping the brand, what it is, the size and the shade, and says so with …", () => {
  const f = p("Acme Skinny Mes Super Long Lasting Waterproof Brow Mascara 3.5g (#02 Medium Brown)", { size: "3.5g" });
  const t = one(f);
  assert.ok(t.length <= TITLE_MAX, t);
  assert.match(t, /^Acme /);
  assert.match(t, /… Mascara 3\.5g \(#02 Medium Brown\) price$/);
  for (const w of t.replace(/[…()]/g, " ").split(/\s+/).filter(Boolean)) assert.ok(f.name.includes(w) || w === "price", `${w} is not in the name`);
});

test("titles stay unique: sizes stay, the older page keeps a shared title, the same name gets its barcode's last digits", () => {
  const long = "Acme Madagascar Centella Hyalu-Cica Water-Fit Sun Serum";
  const a = p(`${long} 50ml`, { slug: "a", ean: "8800000000011", first: "2026-10-01" });
  const b = p(`${long} 25ml`, { slug: "b", ean: "8800000000028" });
  const c = p(`${long} 50ml`, { slug: "c", ean: "8800000000035" });
  const m = productTitles([c, b, a], SITE_NAME);
  const t = (x: TitleInput) => renderTitle(m.get(x.slug)!, SITE_NAME);
  assert.match(t(a), /50ml price$/);
  assert.match(t(b), /25ml price$/);
  assert.match(t(c), /50ml price · …0035$/);
  assert.equal(new Set([t(a), t(b), t(c)]).size, 3);
  // Deterministic: the same titles whatever order the products come in.
  assert.deepEqual([...productTitles([a, b, c], SITE_NAME)].sort(), [...m].sort());
});

const pct = (n: number, d: number) => Math.round((1000 * n) / d) / 10;

test("on the committed data: most titles fit 60, none repeats, the name leads, the size stays", () => {
  const products = getProducts();
  if (products.length < 50) return; // a fixture, not the catalogue
  const titles = products.map((f) => renderTitle(productTitle(f), SITE.name));
  const lengths = titles.map((t) => t.length).sort((a, b) => a - b);
  const over = lengths.filter((n) => n > TITLE_MAX).length;
  assert.ok(pct(over, titles.length) <= 2, `${pct(over, titles.length)}% of ${titles.length} titles run past ${TITLE_MAX}`);
  assert.ok(lengths[lengths.length >> 1] <= TITLE_MAX, `median ${lengths[lengths.length >> 1]}`);
  const seen = new Map<string, string>();
  for (const [i, t] of titles.entries()) {
    const k = t.toLowerCase();
    assert.ok(!seen.has(k), `"${t}" on ${products[i].slug} and ${seen.get(k)}`);
    seen.set(k, products[i].slug);
  }
  const firstWord = products.filter((f, i) => titles[i].startsWith(f.name.split(/\s+/)[0])).length;
  assert.equal(firstWord, products.length, "every title starts with its product's name");
  const squash = (s: string) => s.toLowerCase().replace(/[\s.]/g, "");
  const sized = products.filter((f) => f.size && squash(f.name).includes(squash(f.size)));
  const kept = sized.filter((f) => squash(titles[products.indexOf(f)]).includes(squash(f.size!))).length;
  assert.ok(pct(kept, sized.length) >= 99, `size kept in ${pct(kept, sized.length)}%`);
  // The store count is only a hook: the same product's title never depends on anything but its own data and names.
  const again = productTitles(products.map((f) => ({ slug: f.slug, name: f.name, brand: f.brand, size: f.size, stores: storeCount(f), ean: f.ean, first: f.first })), SITE.name);
  assert.ok(products.every((f) => renderTitle(again.get(f.slug)!, SITE.name) === titles[products.indexOf(f)]));
});
