// The daily import's partner-feed step (import.yml, after the stores): each partner retailer with a feed
// secret (PARTNERS[].feedEnv, e.g. AWIN_FEED_STYLEVANA: the download URL from Awin's Create-a-Feed) is
// streamed once, kept only where its barcode is a product we compare and its price is sane
// (lib/partner-feed.ts keepRow), and written to data/public/partners.json. A partner without a secret is
// skipped quietly (its row stays a tracked search). A failed read keeps yesterday's prices for up to
// PARTNER_KEEP_DAYS and records the error for the ops monitor; this step never fails the import.
import fs from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import { createGunzip } from "node:zlib";
import { PARTNERS } from "@/lib/affiliate";
import { unpackProducts } from "@/lib/products-file";
import { feedHeader, keepRow, splitCells, type PartnerFeedRow, type PartnerPricesFile, type PartnerRegionPrices } from "@/lib/partner-feed";
import type { RegionCode } from "@/site";

const DATA = path.join(process.cwd(), "data/public");
const readJson = <T>(f: string, fallback: T): T => {
  try {
    return JSON.parse(fs.readFileSync(path.join(DATA, f), "utf8")) as T;
  } catch {
    return fallback;
  }
};

async function* lines(body: ReadableStream<Uint8Array>): AsyncGenerator<string> {
  const [probe, rest] = body.tee();
  const reader = probe.getReader();
  const { value: head } = await reader.read();
  void reader.cancel();
  let stream = Readable.fromWeb(rest as import("node:stream/web").ReadableStream);
  if (head?.[0] === 0x1f && head[1] === 0x8b) stream = stream.pipe(createGunzip());
  let buf = "";
  for await (const chunk of stream.setEncoding("utf8")) {
    buf += chunk;
    let i: number;
    while ((i = buf.indexOf("\n")) >= 0) {
      yield buf.slice(0, i).replace(/\r$/, "");
      buf = buf.slice(i + 1);
    }
  }
  if (buf) yield buf;
}

async function readFeed(url: string, storePrices: (r: RegionCode, ean: string) => number[]) {
  const res = await fetch(url, { headers: { "User-Agent": "KaeYoung/1.0 (+https://kaeyoung.com)" }, signal: AbortSignal.timeout(600_000) });
  if (!res.ok || !res.body) throw new Error(`feed answered HTTP ${res.status}`);
  const out: Partial<Record<RegionCode, PartnerRegionPrices>> = {};
  let header: ReturnType<typeof feedHeader> | null = null;
  let delim = ",";
  let pending = "";
  let rows = 0;
  let kept = 0;
  for await (const raw of lines(res.body)) {
    if (!header) {
      if (!raw.trim()) continue;
      if (/^\s*</.test(raw)) throw new Error("feed is XML: choose CSV in Create-a-Feed");
      delim = raw.includes("\t") ? "\t" : raw.includes("|") && !raw.includes(",") ? "|" : ",";
      header = feedHeader(splitCells(raw, delim).cells);
      if (![...header.values()].includes("ean")) throw new Error("feed has no ean column: add ean (and product_GTIN) in Create-a-Feed");
      continue;
    }
    pending = pending ? `${pending}\n${raw}` : raw;
    const { cells, open } = splitCells(pending, delim);
    if (open) continue;
    pending = "";
    rows++;
    const row: PartnerFeedRow = {};
    for (const [i, f] of header) row[f] = cells[i]?.trim();
    const k = keepRow(row, storePrices);
    if (!k) continue;
    const reg = (out[k.region] ??= {});
    // A barcode listed twice (two colours of one listing): the cheaper wins.
    if (!reg[k.ean] || k.p < reg[k.ean][0]) {
      if (!reg[k.ean]) kept++;
      reg[k.ean] = [k.p, k.u];
    }
  }
  if (!header) throw new Error("feed was empty");
  return { prices: out, rows, kept };
}

async function main() {
  const products = unpackProducts(readJson<Parameters<typeof unpackProducts>[0]>("products.json", null));
  const byEan = new Map(products.map((f) => [f.ean, f]));
  const storePrices = (region: RegionCode, ean: string) => (byEan.get(ean)?.offers[region] ?? []).filter((o) => o.st !== "out").map((o) => o.p);
  const prev = readJson<PartnerPricesFile>("partners.json", { v: 1, feeds: {}, prices: {} });
  const next: PartnerPricesFile = { v: 1, feeds: {}, prices: {} };
  for (const p of PARTNERS) {
    if (!p.feedEnv) continue;
    const url = process.env[p.feedEnv];
    if (!url) {
      console.log(`- ${p.key}: no ${p.feedEnv} secret yet (its row stays a tracked search)`);
      continue;
    }
    try {
      const r = await readFeed(url, storePrices);
      next.feeds[p.key] = { at: new Date().toISOString(), rows: r.rows, kept: r.kept };
      next.prices[p.key] = r.prices;
      console.log(`✓ ${p.key}: ${r.rows} feed rows, ${r.kept} prices kept (${Object.entries(r.prices).map(([k, v]) => `${k} ${Object.keys(v ?? {}).length}`).join(", ")})`);
    } catch (e) {
      // Never print the URL: it carries the network API key.
      const error = (e as Error).message.replace(/https?:\/\/\S+/g, "<feed url>").slice(0, 200);
      next.feeds[p.key] = { ...prev.feeds[p.key], error };
      if (prev.prices[p.key]) next.prices[p.key] = prev.prices[p.key];
      console.log(`✗ ${p.key}: ${error}`);
    }
  }
  fs.writeFileSync(path.join(DATA, "partners.json"), JSON.stringify(next) + "\n");
}

main().catch((e) => {
  console.error(`partner feeds: ${(e as Error).message.replace(/https?:\/\/\S+/g, "<feed url>")}`);
});
