import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("a guide page carries the page's one native ad block (eBay and Amazon tiles), after its content", () => {
  const s = readFileSync(new URL("../src/app/guides/[slug]/page.tsx", import.meta.url), "utf8");
  assert.equal(s.match(/<InlineAds /g)?.length, 1);
  assert.ok(s.indexOf("<InlineAds") > s.indexOf("Every price is the store"));
});
