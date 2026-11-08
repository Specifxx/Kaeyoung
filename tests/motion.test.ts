// The motion layer (src/lib/motion.ts, globals.css "motion" block; owner, 2026-11-06): it must never
// hide what is on screen, never run for prefers-reduced-motion, and never change the server HTML's words or layout.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { MOTION_BOOT, MOTION_SCRIPT } from "../src/lib/motion";

function boot(reduced: boolean, search = "") {
  const attrs: Record<string, string> = {};
  const documentElement = { setAttribute: (k: string, v: string) => (attrs[k] = v) };
  const ctx: Record<string, unknown> = {
    document: { documentElement },
    location: { search },
    matchMedia: () => ({ matches: reduced }),
    IntersectionObserver: function () {},
  };
  ctx.window = ctx;
  vm.runInNewContext(MOTION_BOOT, ctx);
  return "data-motion" in attrs;
}

test("motion is on by default, off for prefers-reduced-motion and ?motion=off", () => {
  assert.equal(boot(false), true);
  assert.equal(boot(true), false);
  assert.equal(boot(false, "?motion=off"), false);
  assert.doesNotThrow(() => vm.runInNewContext(MOTION_BOOT, {}));
  assert.doesNotThrow(() => vm.runInNewContext(MOTION_SCRIPT, {}));
});

test("the reveal script shows what is on screen before the CSS may hide anything", () => {
  const scan = MOTION_SCRIPT.indexOf("scan(true)");
  const on = MOTION_SCRIPT.indexOf('setAttribute("data-reveal-on"');
  assert.ok(scan > 0 && on > scan, "data-reveal-on is stamped after the first scan");
  const css = readFileSync("src/app/globals.css", "utf8");
  const block = css.slice(css.indexOf("motion:start"), css.indexOf("motion:end"));
  // Only data-reveal-on hides; only data-motion animates.
  assert.match(block, /html\[data-reveal-on\] \[data-reveal\]:not\(\[data-reveal="stagger"\]\):not\(\[data-in\]\)/);
  // Nothing in the block moves layout: no width/height/margin/top animation, only opacity and transform keyframes.
  for (const kf of block.match(/@keyframes [\s\S]*?\n\}/g) ?? []) assert.doesNotMatch(kf, /\b(width|height|margin|padding|top|left|right|bottom):/, kf);
  assert.match(block, /@media print/);
});

test("the layout runs the boot in <head> and the reveal script at the end of <body>", () => {
  const layout = readFileSync("src/app/layout.tsx", "utf8");
  assert.ok(layout.indexOf("__html: MOTION_BOOT") < layout.indexOf("<body"));
  assert.ok(layout.indexOf("__html: MOTION_SCRIPT") > layout.indexOf("<ShareArrival"));
});
