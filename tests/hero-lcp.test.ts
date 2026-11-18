// The hero holds the home page's largest paint (2026-11-18, "Speed up sites on mobile"). A browser does not count an
// element as painted while its opacity is 0, so the hero's old fade-in (mo-rise on .mo-enter) moved the largest paint
// from ~0.3 s to ~1.4 s unthrottled and Lighthouse's mobile figure to 4.0 s. The hero may slide, never fade.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";

const css = fs.readFileSync(path.join(__dirname, "../src/app/globals.css"), "utf8");

test("the hero's entrance never animates opacity", () => {
  const rule = css.match(/\.mo-enter\s*\{[^}]*\}/g) ?? [];
  assert.ok(rule.length > 0, ".mo-enter rule exists");
  for (const r of rule) {
    const anim = r.match(/animation:\s*([\w-]+)/)?.[1];
    if (!anim) continue;
    const kf = css.match(new RegExp(`@keyframes ${anim}\\s*\\{([\\s\\S]*?)\\n\\}`))?.[1] ?? "";
    assert.ok(kf, `keyframes ${anim} found`);
    assert.doesNotMatch(kf, /opacity/, `${anim} must not fade the hero (largest paint waits for opacity)`);
  }
});
