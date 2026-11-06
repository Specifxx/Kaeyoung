// The family's Vercel cost rules, pinned (DECISIONS.md "A fully static site").
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

function walk(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]));
}
const src = walk("src").filter((f) => /\.(ts|tsx)$/.test(f));
const read = (f: string) => fs.readFileSync(f, "utf8");

test("no page reads the request (cookies, headers, searchParams) or opts out of static", () => {
  for (const f of src.filter((f) => f.startsWith("src/app") && !f.includes("api/ebay/marketplace-deletion") && !f.includes("src/app/api/reviews/") && !f.includes("src/app/api/report/") && !f.includes("src/app/api/forum/"))) {
    const s = read(f);
    assert.doesNotMatch(s, /from "next\/headers"|unstable_noStore|force-dynamic|cache: "no-store"/, f);
    assert.doesNotMatch(s, /export const revalidate/, `${f}: pages are static until the next release, no ISR timers`);
    assert.doesNotMatch(s, /searchParams/, `${f}: a page reading ?query renders per request`);
  }
});

// Product pages and their quick-view files are the one exception (DECISIONS.md 2026-11-06): the build writes the top
// 500, the rest render on first visit and are kept until the next release, never on a timer.
const ON_FIRST_VISIT = ["src/app/product/[slug]/page.tsx", "src/app/q/[slug]/route.ts"];
test("every dynamic route is fully prerendered (dynamicParams = false), except product pages", () => {
  for (const f of src.filter((f) => /src\/app\/.*\[[^\]]+\]\/page\.tsx$/.test(f) && !ON_FIRST_VISIT.includes(f))) {
    assert.match(read(f), /export const dynamicParams = false/, f);
  }
});

test("product pages: top products at build, the rest on first visit with their data traced in", () => {
  for (const f of ON_FIRST_VISIT) {
    const s = read(f);
    assert.match(s, /export const dynamicParams = true/, f);
    assert.match(s, /prebuiltProducts\(getProducts\(\)\)/, `${f}: prerender only the top products`);
    assert.doesNotMatch(s, /export const revalidate/, f);
  }
  // A missing product must stay a real 404: the page streams behind loading.tsx, so only the layout can set the status.
  assert.match(read("src/app/product/[slug]/layout.tsx"), /if \(!getProduct\(params\.slug\)\) notFound\(\);/);
  const cfg = read("next.config.js");
  for (const r of ["/product/[slug]", "/q/[slug]"]) {
    assert.ok(cfg.includes(`"${r}": ["./data/public/**", "./data/amazon-live/**"]`), `${r}: its function must carry data/`);
  }
});

test("no middleware, no database client, no unstable_cache", () => {
  assert.equal(fs.existsSync("src/middleware.ts"), false);
  for (const f of src) assert.doesNotMatch(read(f), /@prisma\/client|unstable_cache/, f);
  // No database at all (DECISIONS.md "Reviews move from Neon to a private GitHub
  // repo", then "…public repo's reviews branch"): reached only from lib/reviews-store.ts.
  for (const f of src) assert.doesNotMatch(read(f), /@neondatabase|from "pg"|postgres:\/\//, f);
  assert.doesNotMatch(read("package.json"), /@neondatabase|"pg"/);
});

test("only the two review routes, the export and the monitor reach the reviews store; the token stays there", () => {
  const users = [...src, ...walk("scripts").filter((f) => f.endsWith(".ts"))].filter((f) => /reviews-store"|reviews-store'/.test(read(f)));
  assert.deepEqual(users.sort(), ["scripts/ops-monitor.ts", "scripts/reviews-export.ts", "src/app/api/reviews/admin/route.ts", "src/app/api/reviews/route.ts"]);
  // ratings.ts only asks whether the token exists at build (to show the form); nothing else names it.
  assert.deepEqual(src.filter((f) => /REVIEWS_GITHUB_TOKEN/.test(read(f))).sort(), ["src/lib/ratings.ts", "src/lib/reviews-store.ts"]);
  for (const f of ["src/app/api/reviews/route.ts", "src/app/api/reviews/admin/route.ts"]) {
    assert.doesNotMatch(read(f), /export (async )?function GET/, `${f}: POST only, nothing a crawler or a page load can run`);
  }
});

test("every next/link has prefetch={false} (prefetch renders pages nobody opened)", () => {
  for (const f of src.filter((f) => f.endsWith(".tsx"))) {
    const s = read(f);
    const links = s.match(/<Link\b[^>]*>/gs) ?? [];
    for (const l of links) assert.match(l, /prefetch=\{false\}/, `${f}: ${l.slice(0, 80)}`);
  }
});

test("image optimisation stays off; only eBay's hook and the review form are functions", () => {
  assert.match(read("next.config.js"), /unoptimized: true/);
  const routes = src.filter((f) => /route\.ts$/.test(f));
  const dynamic = routes.filter((f) => !/force-static/.test(read(f)));
  // + the visitor report form's POST-only route (DECISIONS.md, 2026-10-31).
  assert.deepEqual(dynamic.sort(), ["src/app/api/ebay/marketplace-deletion/route.ts", "src/app/api/forum/route.ts", "src/app/api/report/route.ts", "src/app/api/reviews/admin/route.ts", "src/app/api/reviews/route.ts"]);
  assert.doesNotMatch(read("src/app/api/report/route.ts"), /export (async )?function GET/);
});

test("the eBay keys never reach the website", () => {
  for (const f of src) assert.doesNotMatch(read(f), /EBAY_CLIENT_(ID|SECRET)|api\.ebay\.com/, f);
});

test("claude/* branches never deploy", () => {
  const v = JSON.parse(read("vercel.json"));
  assert.equal(v.git.deploymentEnabled["claude/**"], false);
  assert.equal(v.ignoreCommand, "bash scripts/vercel-ignore-build.sh");
});
