import test from "node:test";
import assert from "node:assert/strict";
import { buyLink } from "@/lib/affiliate";
import { STORES } from "@/content/stores";

// The buy button goes straight to the store's checkout (owner, 2026-11-06), only where nothing is lost by it.
const store = STORES.find((s) => !s.affiliate)!;
const page = `${store.base}/products/a-mask`;

test("an in-stock Shopify offer with its variant opens the store's checkout with one of it", () => {
  const l = buyLink({ s: store.id, p: 1800, st: "in", u: page, v: "44876543210987" });
  assert.equal(l.to, "checkout");
  const u = new URL(l.href);
  assert.equal(u.origin, new URL(store.base).origin);
  assert.equal(u.pathname, "/cart/44876543210987:1");
  assert.equal(u.searchParams.get("utm_source"), "kaeyoung.com");
  assert.equal(u.searchParams.get("utm_campaign"), "checkout");
});

test("sold out, no variant, or a bad variant: the product page as before", () => {
  for (const o of [
    { s: store.id, p: 1800, st: "out" as const, u: page, v: "123" },
    { s: store.id, p: 1800, st: "in" as const, u: page },
    { s: store.id, p: 1800, st: "in" as const, u: page, v: "12a/../x" },
    { s: "no-such-store", p: 1800, st: "in" as const, u: "https://elsewhere.example/p/1", v: "123" },
  ]) {
    const l = buyLink(o);
    assert.equal(l.to, "product");
    assert.ok(!l.href.includes("/cart/"), l.href);
  }
});

test("a store that pays us keeps its product page, where its tracking script runs", () => {
  const paying = STORES[1] as (typeof STORES)[number] & { affiliate?: { envVar: string; param: string } };
  const before = paying.affiliate;
  paying.affiliate = { envVar: "TEST_CHECKOUT_AFF", param: "ref" };
  process.env.TEST_CHECKOUT_AFF = "our-code";
  try {
    const l = buyLink({ s: paying.id, p: 1800, st: "in", u: `${paying.base}/products/x`, v: "123" });
    assert.equal(l.to, "product");
    assert.equal(new URL(l.href).searchParams.get("ref"), "our-code");
  } finally {
    paying.affiliate = before;
    delete process.env.TEST_CHECKOUT_AFF;
  }
});
