// Shop by need (lib/needs.ts, DECISIONS.md 2026-11-08): hubs read a product's own name, never guess.
import { test } from "node:test";
import assert from "node:assert/strict";
import { CONCERNS, INGREDIENTS, NEED_INDEX_MIN, needIndexable, needPath, needsOfName } from "../src/lib/needs";

const slugs = (name: string) => needsOfName(name).map((n) => `${n.kind}:${n.slug}`);

test("real store titles land in the hubs their names say", () => {
  assert.ok(slugs("COSRX Advanced Snail 96 Mucin Power Essence 100ml").includes("ingredient:snail-mucin"));
  assert.ok(slugs("SKIN1004 Madagascar Centella Ampoule 100ml").includes("ingredient:centella"));
  assert.ok(slugs("SKIN1004 Madagascar Centella Ampoule 100ml").includes("concern:redness-sensitive"));
  assert.ok(slugs("COSRX AHA/BHA Clarifying Treatment Toner 150ml").includes("ingredient:aha-bha"));
  assert.ok(slugs("COSRX AHA/BHA Clarifying Treatment Toner 150ml").includes("concern:acne-blemishes"));
  assert.ok(slugs("Anua Heartleaf Pore Control Cleansing Oil 200ml").includes("concern:pores-oily-skin"));
  assert.ok(slugs("Beauty of Joseon Relief Sun: Rice + Probiotics 50ml").includes("ingredient:rice"));
});

test("words inside other words never match", () => {
  assert.deepEqual(slugs("Laneige Water Sleeping Mask Price Pack 70ml").filter((s) => s === "ingredient:rice"), []);
  assert.deepEqual(slugs("Round Lab Dokdo Toner 200ml"), []);
  assert.ok(!slugs("Beauty of Joseon Dynasty Cream 50ml").includes("ingredient:aha-bha"));
});

test("hub slugs are unique per kind, concerns point at real ingredient hubs", () => {
  for (const list of [INGREDIENTS, CONCERNS]) assert.equal(new Set(list.map((n) => n.slug)).size, list.length);
  const ing = new Set(INGREDIENTS.map((n) => n.slug));
  for (const c of CONCERNS) for (const s of c.ingredients ?? []) assert.ok(ing.has(s), `${c.slug} -> ${s}`);
  assert.equal(needPath(INGREDIENTS[0]), `/ingredients/${INGREDIENTS[0].slug}`);
  assert.equal(needPath(CONCERNS[0]), `/skin-concerns/${CONCERNS[0].slug}`);
});

test("a hub is indexed only with 3+ products (owner, 2026-11-08)", () => {
  assert.equal(NEED_INDEX_MIN, 3);
  assert.equal(needIndexable(2), false);
  assert.equal(needIndexable(3), true);
});
