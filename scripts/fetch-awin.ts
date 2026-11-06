/**
 * First in every build: copy the Awin programmes that accepted the family (Compare Empire's public
 * data/awin/programmes.json, refreshed each morning from the Awin publisher API) into src/lib/awin-programmes.json,
 * which src/lib/awin.ts reads to turn those stores' links into tracked Awin deep links. Never fatal: on any error
 * the committed copy (an empty list) stays and links are simply untracked for that build.
 */
import { writeFileSync } from "node:fs";

const SRC = "https://raw.githubusercontent.com/Specifxx/compareempiretake2/HEAD/data/awin/programmes.json";
const OUT = "src/lib/awin-programmes.json";

async function main() {
  const res = await fetch(SRC, { signal: AbortSignal.timeout(15_000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const f = (await res.json()) as { publisherId?: unknown; updatedAt?: unknown; joined?: unknown };
  if (f.publisherId !== 3144410 || !Array.isArray(f.joined)) throw new Error("unexpected shape");
  const joined = f.joined
    .filter((p): p is { id: number; name: string; domains: string[]; region?: string; currency?: string } =>
      !!p && typeof p.id === "number" && typeof p.name === "string" && Array.isArray(p.domains) && p.domains.every((d: unknown) => typeof d === "string"))
    .map((p) => ({ id: p.id, name: p.name, domains: p.domains, ...(p.region ? { region: p.region } : {}), ...(p.currency ? { currency: p.currency } : {}) }));
  writeFileSync(OUT, JSON.stringify({ publisherId: 3144410, updatedAt: typeof f.updatedAt === "string" ? f.updatedAt : null, joined }, null, 2) + "\n");
  console.log(`Awin: ${joined.length} joined programmes copied.`);
}

/** The joined programmes' live offers and vouchers (Compare Empire's data/awin/promotions.json, 2026-11-06), shown as a
 *  note beside that retailer's row until their end date (src/lib/promos.ts). On any error the committed empty list stays. */
const PROMOS_SRC = "https://raw.githubusercontent.com/Specifxx/compareempiretake2/HEAD/data/awin/promotions.json";
const PROMOS_OUT = "src/lib/awin-promotions.json";
const str = (x: unknown, n: number) => (typeof x === "string" ? x.slice(0, n) : "");

async function promotions() {
  const res = await fetch(PROMOS_SRC, { signal: AbortSignal.timeout(15_000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const f = (await res.json()) as { publisherId?: unknown; promotions?: unknown };
  if (f.publisherId !== 3144410 || !Array.isArray(f.promotions)) throw new Error("unexpected shape");
  const promotions = (f.promotions as Record<string, unknown>[])
    .filter((p) => p && typeof p.id === "number" && typeof p.advertiserId === "number" && (p.type === "promotion" || p.type === "voucher") && str(p.title, 120) && !Number.isNaN(Date.parse(str(p.start, 40))) && !Number.isNaN(Date.parse(str(p.end, 40))) && (p.regions === "all" || (Array.isArray(p.regions) && p.regions.every((c) => typeof c === "string" && /^[A-Z]{2}$/.test(c)))))
    .map((p) => ({ id: p.id, advertiserId: p.advertiserId, type: p.type, title: str(p.title, 120), description: str(p.description, 240), start: str(p.start, 40), end: str(p.end, 40), regions: p.regions, ...(str(p.code, 40) ? { code: str(p.code, 40) } : {}) }));
  writeFileSync(PROMOS_OUT, JSON.stringify({ publisherId: 3144410, promotions }, null, 2) + "\n");
  console.log(`Awin: ${promotions.length} live offers copied.`);
}

promotions().catch((e) => console.warn(`Awin offers not fetched (${(e as Error).message}); none shown this build.`));

main().catch((e) => console.warn(`Awin list not fetched (${(e as Error).message}); links stay untracked this build.`));
