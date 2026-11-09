// Navigation (Bill, 2026-11-09): the sections one swipe away below lg, the brand row on a section, the niche's own filters.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { CATEGORIES, type CatKey } from "../src/site";
import { navGroups, quickLinks } from "../src/lib/nav";
import { FACETS } from "../src/content/facets";
import { applyFilters, NO_FILTERS, type IndexRow } from "../src/lib/browse";

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");
const FACET_SAMPLE = { key: "size", yes: "COSRX Advanced Snail 96 Mucin Power Essence 100ml", cat: "serums", value: "60 to 119 ml/g" };
const counts = Object.fromEntries(CATEGORIES.map((c) => [c.key, 1])) as Record<CatKey, number>;

test("the quick row names only places the side panel and phone menu list, sections first, Brands last", () => {
  const groups = navGroups(counts, [{ slug: "x", name: "X" }]);
  const quick = quickLinks(groups);
  const all = new Set(groups.flatMap((g) => g.links.map((l) => l.href)));
  for (const l of quick) assert.ok(all.has(l.href), l.href);
  assert.equal(quick[quick.length - 1].href, "/brands");
  assert.deepEqual(quick.slice(0, groups[0].links.length).map((l) => l.href), groups[0].links.map((l) => l.href));
  assert.ok(quick.length <= 14, "a row, not a second menu");
  assert.match(read("src/app/layout.tsx"), /<CategoryStrip links=\{quickLinks\(groups\)\} \/>/);
  assert.match(read("src/components/CategoryStrip.tsx"), /lg:hidden/);
});

test("a section page links its biggest brands, each a real brand page", () => {
  const hub = read("src/components/CatHub.tsx");
  assert.match(hub, /brandPages\(\)/);
  assert.match(hub, /href=\{`\/brands\/\$\{slug\}`\}/);
});

test("every niche facet is pure on a name, and a filter by it keeps only the rows that say it", () => {
  assert.ok(FACETS.length >= 1);
  const row = (slug: string, name: string, cat: string): IndexRow => [slug, name, cat, "", { US: 1000 }, "", "", 0, 0, 0, "2026-01-01"];
  for (const f of FACETS) {
    assert.deepEqual(f.of("zzz nothing", "other"), [], `${f.key}: a name that does not say has no value`);
    assert.ok(f.label && f.any);
  }
  const rows = [row("a", FACET_SAMPLE.yes, FACET_SAMPLE.cat), row("b", "zzz nothing", "other")];
  const f = FACETS.find((x) => x.key === FACET_SAMPLE.key)!;
  assert.deepEqual(f.of(FACET_SAMPLE.yes, FACET_SAMPLE.cat), [FACET_SAMPLE.value]);
  const out = applyFilters(rows, { ...NO_FILTERS, facets: { [f.key]: FACET_SAMPLE.value } }, "US");
  assert.deepEqual(out.map((r) => r[0]), ["a"]);
  assert.equal(applyFilters(rows, NO_FILTERS, "US").length, 2);
});

test("header mega menus: built from the nav groups, every link a place the groups reach, empty markets dropped, no side panel", async () => {
  const { headerMenus } = await import("../src/lib/nav");
  const groups = navGroups(counts, [{ slug: "x", name: "X" }]);
  const menus = headerMenus(groups, {
    catRegions: { serums: ["US"], toners: [] },
    brands: [{ href: "/brands/x", label: "X" }, { href: "/brands/none", label: "None", regions: [] }],
    concerns: [{ href: "/skin-concerns/dry-skin", label: "Dry", regions: ["US", "UK"] }],
    ingredients: [],
  });
  assert.ok(menus.length <= 7);
  const flat = menus.flatMap((m) => m.columns.flatMap((c) => c.links));
  assert.ok(!flat.some((l) => l.href === "/brands/none" || l.href === "/toners"), "a link with no products anywhere is left out");
  assert.ok(flat.find((l) => l.href === "/serums")!.regions?.[0] === "US");
  for (const m of menus) assert.ok(m.all.href.startsWith("/"), `${m.label} has its All link`);
  const dest = new Set(groups.flatMap((g) => g.links.map((l) => l.href)));
  for (const m of menus) assert.ok(m.all.href === "/popular" || dest.has(m.all.href) || m.all.href === "/deals", m.all.href);
  const comp = read("src/components/HeaderMenus.tsx");
  assert.match(comp, /Escape/);
  assert.match(comp, /aria-expanded/);
  assert.match(comp, /rp-\$\{r\}/);
  assert.ok(!read("src/app/layout.tsx").includes("SideNav"), "the side panel is gone");
});
