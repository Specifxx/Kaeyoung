import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";

// Owner, 2026-11-17: the quick view opens from EVERY product link. The handler takes any /product/<slug> link, not only tiles with data-qv.
test("the quick view handles every plain product link, not only data-qv tiles", () => {
  const s = readFileSync(new URL("../src/components/QuickView.tsx", import.meta.url), "utf8");
  assert.match(s, /function productLink\(/);
  assert.match(s, /\^\\\/product\\\//);
  assert.ok(!/closest\?\.\("a\[data-qv\]"\)/.test(s), "no handler may filter on data-qv alone");
});

test("the quick view is mounted in the root layout", () => {
  assert.match(readFileSync(new URL("../src/app/layout.tsx", import.meta.url), "utf8"), /<QuickView \/>/);
});

test("no product link opens in a new tab or sets target (it would bypass the quick view)", () => {
  const bad: string[] = [];
  const walk = (d: string) => {
    for (const f of readdirSync(d)) {
      const p = join(d, f);
      if (statSync(p).isDirectory()) walk(p);
      else if (/\.tsx$/.test(f)) {
        const t = readFileSync(p, "utf8");
        for (const m of t.matchAll(/<(?:Link|a)\b[^>]*href=\{`\/product\/[^>]*>/g)) if (/target=/.test(m[0])) bad.push(`${p}: ${m[0].slice(0, 80)}`);
      }
    }
  };
  walk(new URL("../src", import.meta.url).pathname);
  assert.deepEqual(bad, []);
});
