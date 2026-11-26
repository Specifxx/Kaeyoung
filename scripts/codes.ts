/**
 * Daily, in import.yml: today's discount codes for the stores in src/content/code-stores.ts → data/public/codes.json
 * (src/lib/codes.ts). The codes are the stores' own, from Compare Empire's public data/awin/promotions.json (its daily
 * Awin Offers API read). Never fatal: on any error the committed file stays as it was and the pages show yesterday's.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { CODE_STORES } from "../src/content/code-stores";
import { mergeCodes, type AwinPromotionIn, type CodesFile } from "../src/lib/codes";

const SRC = "https://raw.githubusercontent.com/Specifxx/compareempiretake2/HEAD/data/awin/promotions.json";
const OUT = "data/public/codes.json";

async function main() {
  const res = await fetch(SRC, { signal: AbortSignal.timeout(20_000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const f = (await res.json()) as { publisherId?: unknown; promotions?: unknown };
  if (f.publisherId !== 3144410 || !Array.isArray(f.promotions)) throw new Error("unexpected shape");
  const promos = (f.promotions as AwinPromotionIn[]).filter(
    (p) => p && typeof p.id === "number" && typeof p.advertiserId === "number" && (p.type === "voucher" || p.type === "promotion") && typeof p.title === "string" && typeof p.start === "string" && typeof p.end === "string" && (p.regions === "all" || Array.isArray(p.regions)),
  );
  const prev = existsSync(OUT) ? (JSON.parse(readFileSync(OUT, "utf8")) as CodesFile) : null;
  // The site never lists testers, samples, short-dated or damaged stock (CLAUDE.md, lib/title.ts): nor does a deal page.
  const REFUSE = /\b(testers?|samples?|short[- ]dated|pre-?owned|damaged)\b/i;
  const next = mergeCodes(prev, promos, CODE_STORES.filter((s) => !s.retired), Date.now(), (t) => REFUSE.test(t));
  // A retired store keeps its last file so its page still renders.
  for (const s of CODE_STORES) if (s.retired && prev?.stores[s.slug]) next.stores[s.slug] = prev.stores[s.slug];
  writeFileSync(OUT, JSON.stringify(next, null, 1) + "\n");
  const n = Object.values(next.stores).reduce((a, s) => a + s.live.length, 0);
  console.log(`Codes: ${n} live codes and deals across ${CODE_STORES.length} stores.`);
}

main().catch((e) => console.warn(`Codes not refreshed (${(e as Error).message}); yesterday's stay.`));
