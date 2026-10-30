// Draws the site's icons and link preview from src/app/icon.svg and the brand
// card below: src/app/favicon.ico (Vercel's dashboard reads it),
// src/app/apple-icon.png and src/app/opengraph-image.jpg. Run by hand
// (`node scripts/og/render.mjs`) and look at every image before committing:
// Reddit and X keep a post's thumbnail forever. Text only, no product art.
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const here = path.dirname(fileURLToPath(import.meta.url));
const app = path.join(here, "../../src/app");
const svg = readFileSync(path.join(app, "icon.svg"), "utf8");

const browser = await chromium.launch();
async function png(size) {
  const page = await browser.newPage({ viewport: { width: size, height: size } });
  await page.setContent(`<html><body style="margin:0;background:transparent">${svg.replace("<svg ", `<svg width="${size}" height="${size}" `)}</body></html>`);
  const buf = await page.screenshot({ omitBackground: true });
  await page.close();
  return buf;
}
const apple = await browser.newPage({ viewport: { width: 180, height: 180 } });
await apple.setContent(`<html><body style="margin:0;background:#1c1b1f">${svg.replace("<svg ", '<svg width="180" height="180" ')}</body></html>`);
await apple.screenshot({ path: path.join(app, "apple-icon.png") });

// favicon.ico: one 32x32 PNG inside an ICO container.
const p32 = await png(32);
const head = Buffer.alloc(22);
head.writeUInt16LE(0, 0);
head.writeUInt16LE(1, 2);
head.writeUInt16LE(1, 4);
head.writeUInt8(32, 6);
head.writeUInt8(32, 7);
head.writeUInt16LE(1, 10);
head.writeUInt16LE(32, 12);
head.writeUInt32LE(p32.length, 14);
head.writeUInt32LE(22, 18);
writeFileSync(path.join(app, "favicon.ico"), Buffer.concat([head, p32]));

const og = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await og.setContent(`<!doctype html><html><head><style>
@import url("https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,500;1,9..144,500&family=Inter:wght@400;500;600&display=block");
body{margin:0;width:1200px;height:630px;background:#faf9f7;font-family:Inter,sans-serif;color:#1c1b1f;display:flex;flex-direction:column;justify-content:center;padding:0 96px;box-sizing:border-box}
.brand{display:flex;align-items:center;gap:20px;margin-bottom:56px}.brand span{font-family:Fraunces,serif;font-size:44px;font-weight:500}
h1{font-family:Fraunces,serif;font-weight:500;font-size:104px;line-height:1;margin:0;letter-spacing:-2px}h1 i{color:#a02c56}
p{font-size:30px;color:#68646e;margin:36px 0 0;max-width:900px;line-height:1.35}
.rule{position:absolute;left:96px;right:96px;bottom:64px;border-top:1px solid #e8e4e0;padding-top:20px;font-size:20px;color:#68646e;letter-spacing:3px;text-transform:uppercase}
</style></head><body>
<div class="brand">${svg.replace("<svg ", '<svg width="72" height="72" ')}<span>K Young</span></div>
<h1>Stay young. <i>Pay less.</i></h1>
<p>Korean skincare prices from real K-beauty stores, side by side. Matched by the barcode on the box.</p>
<div class="rule">US · UK · Canada · Australia · New Zealand · Europe</div>
</body></html>`);
await og.evaluate(() => document.fonts.ready);
await og.waitForTimeout(800);
await og.screenshot({ path: path.join(app, "opengraph-image.jpg"), type: "jpeg", quality: 90 });
await browser.close();
console.log("icons and share image written");
