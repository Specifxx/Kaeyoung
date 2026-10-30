// Draws the price guides' share cards to PNGs for a look before a Reddit or X
// post (they keep a post's thumbnail forever): the same code the build runs.
//   npx tsx scripts/og/guide-cards.mts <out-dir> [guide-slug ...]   (no slug: every guide)
import fs from "node:fs";
import path from "node:path";
import React from "react";
import * as M from "@/app/guides/[slug]/opengraph-image";
import { GUIDES } from "@/lib/guides";

// The build's JSX runtime is automatic; tsx's is classic.
(globalThis as unknown as { React: typeof React }).React = React;
type Draw = (p: { params: { slug: string } }) => Response;
const mod = M as unknown as { default: Draw | { default: Draw } };
const draw: Draw = typeof mod.default === "function" ? mod.default : mod.default.default;

const [out = "og-preview", ...asked] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
for (const slug of asked.length ? asked : GUIDES.map((g) => g.slug)) {
  const buf = Buffer.from(await draw({ params: { slug } }).arrayBuffer());
  fs.writeFileSync(path.join(out, `${slug}.png`), buf);
  console.log(`${slug}.png ${Math.round(buf.length / 1024)} KB`);
}
