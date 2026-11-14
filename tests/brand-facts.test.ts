// The brand page's paragraph (2026-11-14): read from the day's offers, in-stock prices only, each region in its own currency.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { brandSentences } from "@/lib/brand-facts";
import type { Offer, Product } from "@/lib/types";

const o = (s: string, p: number, st: "in" | "out" = "in"): Offer => ({ s, p, st, u: "/x" });
const prod = (name: string, offers: Product["offers"]): Product => ({ ean: name, slug: name, name, brand: "Acme", b: "acme", cat: "other", size: null, img: null, first: "2026-11-01", offers }) as unknown as Product;

test("a brand's paragraph: most stocked product, the price range per region, the widest gap, the date", () => {
  const a = prod("Acme One", { US: [o("s1", 1000), o("s2", 1500), o("s3", 2000)], UK: [o("u1", 900)] });
  const b = prod("Acme Two", { US: [o("s1", 3000), o("s2", 500, "out")] });
  const c = prod("Acme Three", { UK: [o("u1", 700, "out")] });
  const text = brandSentences("Acme", [a, b, c], "2026-11-13T07:00:00Z");
  assert.equal(text[0], "The most widely stocked Acme product we compare is Acme One, listed by 4 stores.");
  assert.equal(text[1], "In the US, 2 of the 3 are in stock, and their lowest prices run from US$10.00 (Acme One at s1) to US$30.00 (Acme Two).");
  assert.equal(text[2], "In the UK, one is in stock: Acme One, from £9.00 at u1.", "a sold-out listing is never a price");
  assert.equal(text[3], "Stores in the US disagree most on Acme One: US$10.00 at s1 against US$20.00 at s3, with 3 stores holding stock.");
  assert.equal(text[4], "Prices are from our daily check on 13 November 2026.");
  assert.equal(text.length, 5);
});

test("no gap sentence under three stores in stock, no sentence at all for an empty brand", () => {
  const a = prod("Acme One", { US: [o("s1", 1000), o("s2", 2000)] });
  const b = prod("Acme Two", { US: [o("s1", 1000)] });
  const text = brandSentences("Acme", [a, b], undefined);
  assert.deepEqual(text.slice(1), ["In the US, 2 of the 2 are in stock, each from US$10.00."]);
  assert.deepEqual(brandSentences("Acme", [], undefined), []);
});

test("the brand page prints it as server HTML", () => {
  const page = readFileSync("src/app/brands/[slug]/page.tsx", "utf8");
  assert.match(page, /brandSentences\(b\.name, b\.products/);
  assert.doesNotMatch(readFileSync("src/lib/brand-facts.ts", "utf8"), /"use client"|fetch\(|sponsored|affiliate/);
});
