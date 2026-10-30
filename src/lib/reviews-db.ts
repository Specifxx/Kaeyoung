// The reviews table: the one database K Young has (DECISIONS.md "Ratings and
// reviews"). Written only by POST /api/reviews, moderated only through POST
// /api/reviews/admin, read for the public only by scripts/reviews-export.ts in
// GitHub Actions. No page, layout or build step imports this file
// (tests/cost-rules.test.ts): pages read data/public/reviews.json.
//
// Private columns: ip_key (an HMAC of the visitor's IP, never the IP) and
// flags. They never leave this file except as counts.
import { createHmac } from "node:crypto";
import { neon } from "@neondatabase/serverless";
import { reviewFlags, type CleanReview } from "./reviews";

export const reviewsUrl = () => (process.env.REVIEWS_DATABASE_URL || process.env.DATABASE_URL || "").trim();
export const reviewsConfigured = () => Boolean(reviewsUrl());

/** Per visitor (hashed IP): reviews in a day, and one per product ever. */
export const PER_IP_PER_DAY = 8;
/** Every visitor together, a day: past it the form says "try tomorrow" (a flood, not shoppers). */
export const ALL_PER_DAY = 400;

type Sql = ReturnType<typeof neon>;
let sql: Sql | null = null;
let ready: Promise<unknown> | null = null;

function db(): Sql {
  const url = reviewsUrl();
  if (!url) throw new Error("the reviews database is not set");
  sql ??= neon(url, { fetchOptions: { cache: "no-store" } });
  return sql;
}

const DDL = [
  `CREATE TABLE IF NOT EXISTS reviews (
    id bigserial primary key,
    created_at timestamptz not null default now(),
    ean text not null,
    stars smallint not null check (stars between 1 and 5),
    title text,
    body text,
    name text,
    skin text,
    ip_key text not null,
    status text not null default 'published' check (status in ('published', 'held', 'hidden')),
    flags text not null default ''
  )`,
  "CREATE INDEX IF NOT EXISTS reviews_ean ON reviews (ean)",
  "CREATE INDEX IF NOT EXISTS reviews_ip ON reviews (ip_key, created_at)",
  "CREATE INDEX IF NOT EXISTS reviews_status ON reviews (status, created_at)",
];

async function schema(s: Sql) {
  ready ??= (async () => {
    for (const q of DDL) await s.query(q);
  })().catch((e) => {
    ready = null;
    throw e;
  });
  return ready;
}

export function ipKey(ip: string): string {
  const salt = process.env.REVIEWS_SALT || reviewsUrl();
  return createHmac("sha256", salt).update(ip).digest("hex").slice(0, 32);
}

export type AddResult = { ok: true; status: "published" | "held" } | { ok: false; error: string; code: number };

export async function addReview(r: CleanReview, ip: string): Promise<AddResult> {
  const s = db();
  await schema(s);
  const key = ipKey(ip);
  const [mine, all, same] = (await Promise.all([
    s.query("SELECT count(*)::int AS n FROM reviews WHERE ip_key = $1 AND created_at > now() - interval '1 day'", [key]),
    s.query("SELECT count(*)::int AS n FROM reviews WHERE created_at > now() - interval '1 day'"),
    s.query("SELECT count(*)::int AS n FROM reviews WHERE ip_key = $1 AND ean = $2", [key, r.ean]),
  ])) as { n: number }[][];
  if (same[0].n > 0) return { ok: false, code: 409, error: "You've already rated this product. Thank you!" };
  if (mine[0].n >= PER_IP_PER_DAY || all[0].n >= ALL_PER_DAY) return { ok: false, code: 429, error: "We've had a lot of reviews today. Please try again tomorrow." };
  const flags = reviewFlags(r);
  // The same words on another product, from anyone: copy-paste spam.
  if (r.body) {
    const dup = (await s.query("SELECT count(*)::int AS n FROM reviews WHERE body = $1", [r.body])) as { n: number }[];
    if (dup[0].n > 0) flags.push("copied text");
  }
  const status = flags.length ? "held" : "published";
  await s.query("INSERT INTO reviews (ean, stars, title, body, name, skin, ip_key, status, flags) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)", [
    r.ean,
    r.stars,
    r.title,
    r.body,
    r.name,
    r.skin,
    key,
    status,
    flags.join(", "),
  ]);
  return { ok: true, status };
}

export interface ExportRow {
  id: number;
  ean: string;
  stars: number;
  title: string | null;
  body: string | null;
  name: string | null;
  skin: string | null;
  created: string;
}

/** Every published rating, for the daily export. */
export async function publishedReviews(): Promise<{ rows: ExportRow[]; held: number }> {
  const s = db();
  await schema(s);
  const rows = (await s.query(
    "SELECT id::int AS id, ean, stars::int AS stars, title, body, name, skin, to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD\"T\"HH24:MI:SS') AS created FROM reviews WHERE status = 'published' ORDER BY id",
  )) as ExportRow[];
  const held = (await s.query("SELECT count(*)::int AS n FROM reviews WHERE status = 'held'")) as { n: number }[];
  return { rows, held: held[0].n };
}

export interface AdminRow extends ExportRow {
  status: string;
  flags: string;
}

/** The owner's moderation list: everything held, then the newest published. */
export async function adminList(): Promise<AdminRow[]> {
  const s = db();
  await schema(s);
  return (await s.query(
    `(SELECT id::int AS id, ean, stars::int AS stars, title, body, name, skin, status, flags, to_char(created_at, 'YYYY-MM-DD HH24:MI') AS created FROM reviews WHERE status = 'held' ORDER BY id DESC LIMIT 200)
     UNION ALL
     (SELECT id::int AS id, ean, stars::int AS stars, title, body, name, skin, status, flags, to_char(created_at, 'YYYY-MM-DD HH24:MI') AS created FROM reviews WHERE status <> 'held' AND body IS NOT NULL ORDER BY id DESC LIMIT 100)`,
  )) as AdminRow[];
}

export async function setStatus(id: number, status: "published" | "hidden"): Promise<boolean> {
  const s = db();
  await schema(s);
  const r = (await s.query("UPDATE reviews SET status = $1 WHERE id = $2 RETURNING id", [status, id])) as unknown[];
  return r.length > 0;
}
