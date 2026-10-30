// The reviews store: one JSON file in a PRIVATE GitHub repository
// (DECISIONS.md "Reviews move from Neon to a private GitHub repo"). Written only
// by POST /api/reviews, moderated only through POST /api/reviews/admin, read for
// the public only by scripts/reviews-export.ts in GitHub Actions. No page,
// layout or build step imports this file (tests/cost-rules.test.ts): pages
// read data/public/reviews.json.
//
// Why a private repo and not this one: Kaeyoung is public, so anything committed
// here (a held spam review, a hashed IP) would be public before anyone looked.
// The token (REVIEWS_GITHUB_TOKEN) is a fine-grained one that can only read and
// write the contents of that one repo; it lives in Vercel and GitHub secrets
// and never leaves the server.
//
// Private fields: ip (an HMAC of the visitor's IP, never the IP), status and
// flags. They never leave the store except as counts.
import { createHmac } from "node:crypto";
import { reviewFlags, type CleanReview } from "./reviews";

export const reviewsToken = () => (process.env.REVIEWS_GITHUB_TOKEN || "").trim();
export const reviewsRepo = () => (process.env.REVIEWS_REPO || "Specifxx/kaeyoung-reviews").trim();
export const reviewsConfigured = () => Boolean(reviewsToken());
const FILE = "reviews.json";

/** Per visitor (hashed IP): reviews in a day, and one per product ever. */
export const PER_IP_PER_DAY = 8;
/** Every visitor together, a day: past it the form says "try tomorrow" (a flood, not shoppers). */
export const ALL_PER_DAY = 400;

export type Status = "published" | "held" | "hidden";

export interface StoredReview {
  id: number;
  /** ISO time, UTC */
  at: string;
  ean: string;
  stars: number;
  title: string | null;
  body: string | null;
  name: string | null;
  skin: string | null;
  /** HMAC of the IP */
  ip: string;
  status: Status;
  flags: string;
}

export interface Store {
  reviews: StoredReview[];
}

export function ipKey(ip: string): string {
  const salt = process.env.REVIEWS_SALT || reviewsToken();
  return createHmac("sha256", salt).update(ip).digest("hex").slice(0, 32);
}

export type AddResult = { ok: true; status: "published" | "held" } | { ok: false; error: string; code: number };

/** The limits and rules for one new review against everything stored. Pure:
 *  returns the row to append, or why not. */
export function decide(store: Store, r: CleanReview, key: string, now = new Date()): { ok: true; row: StoredReview } | { ok: false; error: string; code: number } {
  const dayAgo = now.getTime() - 86_400_000;
  let mine = 0;
  let all = 0;
  let copied = false;
  for (const x of store.reviews) {
    if (x.ip === key && x.ean === r.ean) return { ok: false, code: 409, error: "You've already rated this product. Thank you!" };
    if (Date.parse(x.at) > dayAgo) {
      all++;
      if (x.ip === key) mine++;
    }
    if (r.body && x.body === r.body) copied = true;
  }
  if (mine >= PER_IP_PER_DAY || all >= ALL_PER_DAY) return { ok: false, code: 429, error: "We've had a lot of reviews today. Please try again tomorrow." };
  const flags = reviewFlags(r);
  // The same words on another product, from anyone: copy-paste spam.
  if (copied) flags.push("copied text");
  const id = store.reviews.reduce((m, x) => Math.max(m, x.id), 0) + 1;
  return {
    ok: true,
    row: { id, at: now.toISOString().slice(0, 19), ean: r.ean, stars: r.stars, title: r.title, body: r.body, name: r.name, skin: r.skin, ip: key, status: flags.length ? "held" : "published", flags: flags.join(", ") },
  };
}

// ---- GitHub contents API ----------------------------------------------------

type Fetch = typeof fetch;
export interface Loaded {
  store: Store;
  /** blob sha of the file, null before the first review */
  sha: string | null;
  /** when the token stops working (GitHub's header), if it expires */
  tokenExpires?: string;
}

function api(path: string, init: RequestInit = {}, f: Fetch = fetch) {
  return f(`https://api.github.com/repos/${reviewsRepo()}${path}`, {
    ...init,
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
    headers: { Authorization: `Bearer ${reviewsToken()}`, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28", "User-Agent": "kaeyoung-reviews", ...(init.headers ?? {}) },
  });
}

export async function loadStore(f: Fetch = fetch): Promise<Loaded> {
  if (!reviewsConfigured()) throw new Error("the reviews store is not set (REVIEWS_GITHUB_TOKEN)");
  const r = await api(`/contents/${FILE}`, {}, f);
  const tokenExpires = r.headers.get("github-authentication-token-expiration") || undefined;
  if (r.status === 404) {
    // A missing file is an empty store; a missing repo or a token that can't see it is an error.
    const repo = await api("", {}, f);
    if (repo.ok) return { store: { reviews: [] }, sha: null, tokenExpires };
    throw new Error(`the reviews repo ${reviewsRepo()} can't be read (HTTP ${repo.status})`);
  }
  if (!r.ok) throw new Error(`reading the reviews store failed (HTTP ${r.status})`);
  const meta = (await r.json()) as { sha: string; content?: string; encoding?: string };
  let b64 = meta.encoding === "base64" ? meta.content ?? "" : "";
  if (!b64) {
    // Over 1 MB the contents API leaves the content out: read the blob instead.
    const blob = await api(`/git/blobs/${meta.sha}`, {}, f);
    if (!blob.ok) throw new Error(`reading the reviews store failed (HTTP ${blob.status})`);
    b64 = ((await blob.json()) as { content: string }).content;
  }
  const store = JSON.parse(Buffer.from(b64, "base64").toString("utf8")) as Store;
  if (!Array.isArray(store.reviews)) throw new Error("the reviews store is not a list");
  return { store, sha: meta.sha, tokenExpires };
}

/** Write the store back; false when someone else wrote it first (reload and retry). */
async function saveStore(store: Store, sha: string | null, message: string, f: Fetch): Promise<boolean> {
  const content = Buffer.from(JSON.stringify(store, null, 1) + "\n").toString("base64");
  const r = await api(`/contents/${FILE}`, { method: "PUT", body: JSON.stringify({ message, content, ...(sha ? { sha } : {}) }) }, f);
  if (r.ok) return true;
  if (r.status === 409 || r.status === 422) return false;
  throw new Error(`saving the reviews store failed (HTTP ${r.status})`);
}

/** Read, change, write; on a write race read again (two reviews in the same second). */
async function update<T>(change: (s: Store) => { save: false; out: T } | { save: true; out: T; message: string }, f: Fetch): Promise<T> {
  for (let attempt = 0; attempt < 4; attempt++) {
    const { store, sha } = await loadStore(f);
    const c = change(store);
    if (!c.save) return c.out;
    if (await saveStore(store, sha, c.message, f)) return c.out;
    await new Promise((res) => setTimeout(res, 300 * (attempt + 1) + Math.random() * 300));
  }
  throw new Error("the reviews store is busy");
}

export async function addReview(r: CleanReview, ip: string, f: Fetch = fetch): Promise<AddResult> {
  const key = ipKey(ip);
  return update<AddResult>((store) => {
    const d = decide(store, r, key);
    if (!d.ok) return { save: false, out: d };
    store.reviews.push(d.row);
    // The commit message says nothing a reader of the repo's history shouldn't see anyway.
    return { save: true, out: { ok: true, status: d.row.status as "published" | "held" }, message: `review ${d.row.id} (${d.row.status})` };
  }, f);
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

const exportRow = (x: StoredReview): ExportRow => ({ id: x.id, ean: x.ean, stars: x.stars, title: x.title, body: x.body, name: x.name, skin: x.skin, created: x.at });

/** Every published rating, for the daily export. */
export async function publishedReviews(f: Fetch = fetch): Promise<{ rows: ExportRow[]; held: number; tokenExpires?: string }> {
  const { store, tokenExpires } = await loadStore(f);
  const rows = store.reviews.filter((x) => x.status === "published").sort((a, b) => a.id - b.id).map(exportRow);
  return { rows, held: store.reviews.filter((x) => x.status === "held").length, tokenExpires };
}

export interface AdminRow extends ExportRow {
  status: string;
  flags: string;
}

/** The owner's moderation list: everything held, then the newest published with words. */
export async function adminList(f: Fetch = fetch): Promise<AdminRow[]> {
  const { store } = await loadStore(f);
  const row = (x: StoredReview): AdminRow => ({ ...exportRow(x), created: x.at.slice(0, 16).replace("T", " "), status: x.status, flags: x.flags });
  const newest = [...store.reviews].sort((a, b) => b.id - a.id);
  return [...newest.filter((x) => x.status === "held").slice(0, 200), ...newest.filter((x) => x.status !== "held" && x.body).slice(0, 100)].map(row);
}

export async function setStatus(id: number, status: "published" | "hidden", f: Fetch = fetch): Promise<boolean> {
  return update<boolean>((store) => {
    const x = store.reviews.find((r) => r.id === id);
    if (!x) return { save: false, out: false };
    if (x.status === status) return { save: false, out: true };
    x.status = status;
    return { save: true, out: true, message: `review ${id} ${status} by the owner` };
  }, f);
}
