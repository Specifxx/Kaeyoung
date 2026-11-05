// Draws the site's icons from src/app/icon.svg: src/app/favicon.ico (Vercel's dashboard reads it) and
// src/app/apple-icon.png. Run by hand
// (`node scripts/og/render.mjs`) and look at every image before committing.
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
await apple.setContent(`<html><body style="margin:0;background:#fff">${svg.replace("<svg ", '<svg width="180" height="180" ')}</body></html>`);
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

// The share image is no longer drawn here: src/app/opengraph-image.tsx draws it at every build from the
// day's two hero products (src/lib/og/home-image.tsx).
await browser.close();
console.log("icons written");
