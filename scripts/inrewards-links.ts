// The daily import's InRewards step (import.yml, after the stores): turns each InRewards partner's search URL for a
// product into its tracked inrwd.me short link through the Open API, once, and keeps it in data/public/inrewards.json
// (lib/inrewards.ts). A no-op until the INREWARDS_API_KEY secret exists. Products sold by the most stores in a paying
// region go first; at most INREWARDS_MAX_CALLS a run (default 600), spaced so two sites sharing the one key stay under
// InRewards' 60 requests a minute. A refused URL waits a week. Never prints the key; never fails the import.
import fs from "node:fs";
import path from "node:path";
import { PARTNERS, inrewardsUrl, searchQuery } from "@/lib/affiliate";
import { INREWARDS_API, emptyInrewards, mayRetry, shortLinkFrom, type InrewardsFile } from "@/lib/inrewards";
import { unpackProducts } from "@/lib/products-file";

const DATA = path.join(process.cwd(), "data/public");
const FILE = path.join(DATA, "inrewards.json");
const GAP_MS = 2_200; // ~27 a minute: KaeYoung and ScentCompare share the key's 60.
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function read(): InrewardsFile {
  try {
    const f = JSON.parse(fs.readFileSync(FILE, "utf8")) as InrewardsFile;
    return { ...emptyInrewards(), ...f };
  } catch {
    return emptyInrewards();
  }
}

async function convert(key: string, originalUrl: string): Promise<{ link: string | null; status: number; message?: string }> {
  const res = await fetch(INREWARDS_API, {
    method: "POST",
    headers: { "x-ir-authorization": `Bearer ${key}`, "Content-Type": "application/json", "User-Agent": "KaeYoung/1.0 (+https://kaeyoung.com)" },
    body: JSON.stringify({ originalUrl }),
    signal: AbortSignal.timeout(30_000),
  });
  const body = (await res.json().catch(() => null)) as { message?: unknown; msg?: unknown } | null;
  const message = String(body?.message ?? body?.msg ?? "").slice(0, 160) || undefined;
  return { link: res.ok ? shortLinkFrom(body) : null, status: res.status, message };
}

async function main() {
  const key = process.env.INREWARDS_API_KEY?.trim();
  if (!key) {
    console.log("InRewards: no INREWARDS_API_KEY secret yet; nothing to do.");
    return;
  }
  const max = Math.max(0, Number(process.env.INREWARDS_MAX_CALLS ?? 600) || 0);
  const file = read();
  const today = new Date().toISOString().slice(0, 10);
  const products = unpackProducts(JSON.parse(fs.readFileSync(path.join(DATA, "products.json"), "utf8")));
  const partners = PARTNERS.filter((p) => p.inrewards?.length);
  // Every URL a page would show, best-stocked products first.
  const wanted: { url: string; score: number }[] = [];
  for (const f of products) {
    for (const p of partners) {
      const score = Math.max(0, ...p.inrewards!.map((r) => (f.offers[r] ?? []).filter((o) => o.st !== "out").length));
      if (score > 0) wanted.push({ url: inrewardsUrl(p, searchQuery(f)), score });
    }
  }
  wanted.sort((a, b) => b.score - a.score);
  const todo = [...new Set(wanted.map((w) => w.url))].filter((u) => !file.links[u] && mayRetry(file.refused[u], today));
  let asked = 0;
  let made = 0;
  let refused = 0;
  let error: string | undefined;
  const refusedNow: string[] = [];
  for (const url of todo.slice(0, max)) {
    if (asked) await sleep(GAP_MS);
    asked++;
    try {
      const r = await convert(key, url);
      if (r.link) {
        file.links[url] = r.link;
        delete file.refused[url];
        made++;
      } else if (r.status === 401 || r.status === 403) {
        error = `key refused (HTTP ${r.status}${r.message ? `: ${r.message}` : ""})`;
        break;
      } else if (r.status === 429 || r.status >= 500) {
        error = `InRewards busy (HTTP ${r.status}); the rest wait for tomorrow`;
        break;
      } else {
        file.refused[url] = today;
        refusedNow.push(url);
        refused++;
        if (refused === 1) console.log(`InRewards refused a URL (HTTP ${r.status}${r.message ? `: ${r.message}` : ""})`);
      }
    } catch (e) {
      error = (e as Error).message.slice(0, 160);
      break;
    }
    // Five refusals and nothing made: the request shape is wrong, not the URLs. Stop and say so.
    if (refused >= 5 && made === 0) {
      error = "the first five URLs were all refused: check the request format";
      for (const u of refusedNow) delete file.refused[u];
      break;
    }
  }
  file.run = { at: new Date().toISOString(), asked, made, refused, pending: Math.max(0, todo.length - made - refused), ...(error ? { error } : {}) };
  fs.writeFileSync(FILE, JSON.stringify(file) + "\n");
  console.log(`InRewards: asked ${asked}, made ${made}, refused ${refused}, ${file.run.pending} waiting, ${Object.keys(file.links).length} links kept${error ? `; stopped: ${error}` : ""}`);
}

main().catch((e) => console.error(`InRewards links: ${(e as Error).message}`));
