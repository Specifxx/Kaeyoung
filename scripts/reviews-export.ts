// The daily reviews export (import.yml, before the data commit): every
// published rating in the reviews table → data/public/reviews.json, which the
// day's build draws into the static product pages. Only products the site
// lists are written. No database configured: the file is left as it is.
// Database unreachable: the last good products stay and `error` is set, so the
// pages keep their reviews and ops-monitor warns; the import never fails on it.
import fs from "node:fs";
import path from "node:path";
import { summarize, type ReviewsFile } from "@/lib/reviews";
import { publishedReviews, reviewsConfigured, type ExportRow } from "@/lib/reviews-db";

const DATA = path.join(process.cwd(), "data/public");
const FILE = path.join(DATA, "reviews.json");

export function buildFile(rows: ExportRow[], held: number, eans: Set<string>, now = new Date()): ReviewsFile {
  const by = new Map<string, ExportRow[]>();
  for (const r of rows) {
    if (!eans.has(r.ean)) continue;
    const list = by.get(r.ean) ?? [];
    list.push(r);
    by.set(r.ean, list);
  }
  const products: ReviewsFile["products"] = {};
  for (const ean of [...by.keys()].sort()) products[ean] = summarize(by.get(ean)!);
  return { exportedAt: now.toISOString(), held, products };
}

async function main() {
  if (!reviewsConfigured()) {
    console.log("Reviews database not set (REVIEWS_DATABASE_URL): export skipped.");
    return;
  }
  const eans = new Set(
    (JSON.parse(fs.readFileSync(path.join(DATA, "products.json"), "utf8")) as { products: { ean: string }[] }).products.map((p) => p.ean),
  );
  let out: ReviewsFile;
  try {
    const { rows, held } = await publishedReviews();
    out = buildFile(rows, held, eans);
    console.log(`Reviews: ${rows.length} published ratings on ${Object.keys(out.products).length} products; ${held} waiting for the owner.`);
  } catch (e) {
    const last: ReviewsFile | null = fs.existsSync(FILE) ? JSON.parse(fs.readFileSync(FILE, "utf8")) : null;
    out = { exportedAt: new Date().toISOString(), held: last?.held ?? 0, error: (e as Error).message.slice(0, 200), products: last?.products ?? {} };
    console.log(`WARN reviews export failed, last good reviews kept: ${out.error}`);
  }
  fs.writeFileSync(FILE, JSON.stringify(out));
}

if (process.argv[1]?.endsWith("reviews-export.ts")) main();
