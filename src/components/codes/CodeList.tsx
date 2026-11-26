"use client";

// A store's discount codes (lib/codes.ts): each code as a ticket with a copy button, the store's paid link, and a
// "did it work?" vote kept by RiftCompare for every site (riftcompare.com/api/code-votes, CDN six hours).
//
// • The code is shown in full: no "reveal" gate, no new tab or pop-up on copy. Copy only copies; the store link only
//   opens the store (CLAUDE.md, no surprise navigation).
// • After a copy, that one card asks inline whether the code worked, once per visit (sessionStorage): never a modal.
// • Votes order nothing. The tally is read once per page view (sessionStorage keeps it an hour); a visitor's own vote
//   and the fresh tally its POST returns are kept in localStorage, so their vote still shows tomorrow.
// • Without JavaScript, or if RiftCompare is unreachable, the codes, terms and links all still work.

import { track } from "@vercel/analytics";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ago, endLabel, regionLabel, valueTag, voteSummary, type StoreCode } from "@/lib/codes";
import { OutLink } from "@/components/OutLink";

export const CODE_VOTES_API = "https://riftcompare.com/api/code-votes";

type Tally = { worked: number; failed: number; expired: number; lastWorked: string | null };
type Mine = { vote: 1 | -1 | 0; expired: boolean };
const TALLY_KEY = "cv_tally";
const MINE_KEY = "cv_mine";
const NUDGE_KEY = "cv_nudged";

function readJson<T>(store: Storage | undefined, key: string): T | null {
  try {
    const raw = store?.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}
function writeJson(store: Storage | undefined, key: string, v: unknown) {
  try {
    store?.setItem(key, JSON.stringify(v));
  } catch {}
}
const ss = () => (typeof window === "undefined" ? undefined : window.sessionStorage);
const ls = () => (typeof window === "undefined" ? undefined : window.localStorage);

function useVotes(ids: string[]) {
  const [tallies, setTallies] = useState<Record<string, Tally>>({});
  const [mine, setMine] = useState<Record<string, Mine>>({});
  const key = ids.join(",");

  useEffect(() => {
    setMine(readJson<Record<string, Mine & { t?: Tally }>>(ls(), MINE_KEY) ?? {});
    if (!key) return;
    const cached = readJson<{ at: number; k: string; t: Record<string, Tally> }>(ss(), TALLY_KEY);
    if (cached && cached.k === key && Date.now() - cached.at < 3_600_000) {
      setTallies(cached.t);
      return;
    }
    const ctl = new AbortController();
    fetch(`${CODE_VOTES_API}?ids=${encodeURIComponent(key)}`, { signal: ctl.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((j: { tallies?: Record<string, Tally> } | null) => {
        if (!j?.tallies) return;
        setTallies(j.tallies);
        writeJson(ss(), TALLY_KEY, { at: Date.now(), k: key, t: j.tallies });
      })
      .catch(() => {});
    return () => ctl.abort();
  }, [key]);

  const vote = useCallback(async (id: string, action: "worked" | "failed" | "expired"): Promise<boolean> => {
    try {
      const r = await fetch(CODE_VOTES_API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: id, action }) });
      const j = (await r.json().catch(() => null)) as { mine?: Mine; tally?: Tally } | null;
      if (!r.ok || !j?.mine || !j.tally) return false;
      const m = j.mine;
      const t = j.tally;
      setMine((prev) => {
        const next = { ...prev, [id]: m };
        writeJson(ls(), MINE_KEY, next);
        return next;
      });
      setTallies((prev) => {
        const next = { ...prev, [id]: t };
        const cached = readJson<{ at: number; k: string; t: Record<string, Tally> }>(ss(), TALLY_KEY);
        if (cached) writeJson(ss(), TALLY_KEY, { ...cached, t: { ...cached.t, [id]: t } });
        return next;
      });
      track("code_vote", { action, code: id });
      return true;
    } catch {
      return false;
    }
  }, []);

  return { tallies, mine, vote };
}

export interface CodeListProps {
  store: { slug: string; name: string };
  /** the store's paid link, built at release time */
  href: string;
  codes: StoreCode[];
  /** the release time, so the server and the browser draw the same end dates */
  builtAt: number;
  region: string;
}

export function CodeList({ store, href, codes, builtAt, region }: CodeListProps) {
  const ids = useMemo(() => codes.map((c) => c.id), [codes]);
  const { tallies, mine, vote } = useVotes(ids);
  const [now, setNow] = useState(builtAt);
  const [copied, setCopied] = useState<string | null>(null);
  const [nudge, setNudge] = useState<string | null>(null);
  useEffect(() => setNow(Date.now()), []);

  const onCopy = (c: StoreCode) => {
    setCopied(c.id);
    window.setTimeout(() => setCopied((x) => (x === c.id ? null : x)), 2400);
    if (!readJson<boolean>(ss(), NUDGE_KEY) && !mine[c.id]?.vote) {
      writeJson(ss(), NUDGE_KEY, true);
      setNudge(c.id);
    }
    try {
      track("code_copy", { store: store.slug, code: c.id });
    } catch {}
  };

  return (
    <ol className="space-y-3 sm:space-y-4">
      {codes.map((c) => (
        <li key={c.id}>
          <CodeCard
            c={c}
            store={store}
            href={href}
            now={now}
            region={region}
            tally={tallies[c.id]}
            mine={mine[c.id]}
            copied={copied === c.id}
            asking={nudge === c.id}
            onCopy={() => onCopy(c)}
            onVote={async (a) => {
              const ok = await vote(c.id, a);
              if (ok && nudge === c.id) setNudge(null);
              return ok;
            }}
          />
        </li>
      ))}
    </ol>
  );
}

function CodeCard({
  c,
  store,
  href,
  now,
  region,
  tally,
  mine,
  copied,
  asking,
  onCopy,
  onVote,
}: {
  c: StoreCode;
  store: { slug: string; name: string };
  href: string;
  now: number;
  region: string;
  tally?: Tally;
  mine?: Mine;
  copied: boolean;
  asking: boolean;
  onCopy: () => void;
  onVote: (a: "worked" | "failed" | "expired") => Promise<boolean>;
}) {
  const tag = valueTag(`${c.title} ${c.terms ?? ""}`);
  const end = endLabel(c, now);
  const ended = Date.parse(c.end) <= now;
  const soon = !ended && Date.parse(c.end) - now < 3 * 86_400_000;
  const isCode = !!c.code;

  return (
    <article
      id={c.id}
      className={`card group relative overflow-hidden transition-shadow duration-300 ${asking ? "ring-2 ring-accent/60 shadow-[0_8px_30px_-12px_rgb(var(--accent)/0.45)]" : "hover:shadow-[0_6px_24px_-14px_rgb(var(--ink)/0.35)]"} ${ended ? "opacity-60" : ""}`}
      aria-label={`${isCode ? `Code ${c.code}` : "Deal"}: ${c.title}`}
    >
      <div className="grid grid-cols-[4.25rem_1fr] gap-x-3.5 gap-y-3 p-3.5 sm:grid-cols-[5.25rem_1fr_auto] sm:gap-x-5 sm:p-5">
        {/* The ticket's face: the value, read from the store's own title. */}
        <div
          aria-hidden
          className={`relative row-span-2 flex aspect-square flex-col items-center justify-center rounded-xl text-center sm:row-span-1 ${isCode ? "bg-accent-pale text-accent-deep" : "tint-mint text-save"}`}
        >
          {tag.pre && <span className="mb-0.5 text-[9.5px] font-semibold uppercase tracking-[0.08em] opacity-80">{tag.pre}</span>}
          <span className="font-display text-[1.35rem] font-semibold leading-none tracking-tight sm:text-[1.6rem]">{tag.big}</span>
          {tag.small && <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.08em] opacity-80">{tag.small}</span>}
          <span className="absolute -right-[7px] top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full bg-card sm:hidden" />
        </div>

        <div className="min-w-0">
          <p className="mb-1 flex flex-wrap items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.07em] text-soft">
            <span className={isCode ? "text-accent-deep" : "text-save"}>{isCode ? "Code" : "Deal · no code needed"}</span>
            <span aria-hidden>·</span>
            <span>{regionLabel(c.regions)}</span>
            {end && (
              <>
                <span aria-hidden>·</span>
                <span className={soon ? "text-[#c2410c] dark:text-[#fb923c]" : ""}>{ended ? "Ended" : end}</span>
              </>
            )}
          </p>
          <h3 className="text-[15.5px] font-semibold leading-snug text-ink sm:text-[17px]">{c.title}</h3>
          {c.terms && <p className="mt-1 text-[13px] leading-relaxed text-soft">{c.terms}</p>}
        </div>

        <div className={`col-span-2 grid gap-2 sm:col-span-1 sm:w-[13.5rem] sm:grid-cols-1 sm:content-center ${isCode ? "grid-cols-[1fr_auto]" : "grid-cols-1"}`}>
          {isCode ? <CopyTicket code={c.code!} copied={copied} disabled={ended} onCopy={onCopy} /> : null}
          <OutLink
            href={href}
            paid
            title={`Go to ${store.name}`}
            className={`inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl px-4 text-sm font-semibold transition ${isCode ? "border border-line bg-card text-ink hover:border-accent/50 hover:text-accent-deep" : "btn-pop btn-buy"}`}
            event={{ source: store.slug, region, placement: isCode ? "codes-store" : "codes-deal" }}
          >
            {isCode ? (
              <>
                <span className="sm:hidden">Shop</span>
                <span className="hidden sm:inline">Go to {store.name}</span>
              </>
            ) : (
              `Get deal at ${store.name}`
            )}
            <svg aria-hidden viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M7 13 13 7M8 7h5v5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </OutLink>
        </div>
      </div>

      {isCode && <VoteBar tally={tally} mine={mine} asking={asking} now={now} onVote={onVote} ended={ended} />}
    </article>
  );
}

function CopyTicket({ code, copied, disabled, onCopy }: { code: string; copied: boolean; disabled: boolean; onCopy: () => void }) {
  const copy = async () => {
    let ok = false;
    try {
      await navigator.clipboard.writeText(code);
      ok = true;
    } catch {
      // Older browsers: select the code so a long-press or Ctrl+C takes it.
      const el = document.getElementById(`code-${code}`);
      const sel = window.getSelection();
      if (el && sel) {
        const r = document.createRange();
        r.selectNodeContents(el);
        sel.removeAllRanges();
        sel.addRange(r);
        ok = true;
      }
    }
    if (ok) onCopy();
  };
  return (
    <button
      type="button"
      onClick={copy}
      disabled={disabled}
      className="group/t relative flex min-h-[48px] w-full items-stretch overflow-hidden rounded-xl border-2 border-dashed border-accent/45 bg-accent-pale/40 text-left transition hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed"
      aria-label={copied ? `Copied ${code}` : `Copy code ${code}`}
    >
      <span id={`code-${code}`} className="flex flex-1 items-center truncate px-3 font-mono text-[15px] font-bold tracking-[0.06em] text-ink">
        {code}
      </span>
      <span
        aria-live="polite"
        className={`flex shrink-0 items-center gap-1 px-3.5 text-[13px] font-semibold text-white transition-colors dark:text-bg ${copied ? "bg-save" : "bg-accent group-hover/t:bg-accent-deep"}`}
      >
        {copied ? (
          <>
            <svg aria-hidden viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.4">
              <path d="m4.5 10.5 3.5 3.5 7.5-8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Copied
          </>
        ) : (
          <>
            <svg aria-hidden viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
              <rect x="6.5" y="6.5" width="9" height="10" rx="2" />
              <path d="M4.5 13V5.5a2 2 0 0 1 2-2H12" strokeLinecap="round" />
            </svg>
            Copy
          </>
        )}
      </span>
    </button>
  );
}

function VoteBar({ tally, mine, asking, now, ended, onVote }: { tally?: Tally; mine?: Mine; asking: boolean; now: number; ended: boolean; onVote: (a: "worked" | "failed" | "expired") => Promise<boolean> }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(false);
  const s = voteSummary(tally);
  const pct = s ? Math.round(s.share * 100) : null;
  const act = async (a: "worked" | "failed" | "expired") => {
    if (busy) return;
    setBusy(true);
    setErr(false);
    const ok = await onVote(a);
    setBusy(false);
    if (!ok) setErr(true);
  };
  const btn = (on: boolean, tone: "good" | "bad") =>
    `inline-flex min-h-[36px] items-center gap-1.5 rounded-full border px-3 text-[13px] font-semibold tabular-nums transition active:scale-[0.97] disabled:opacity-60 ${
      on ? (tone === "good" ? "border-save bg-save text-white dark:text-bg" : "border-[#b91c1c] bg-[#b91c1c] text-white dark:border-[#f87171] dark:bg-[#f87171] dark:text-bg") : "border-line bg-card text-ink hover:border-ink/30"
    }`;

  return (
    <div className={`flex flex-wrap items-center gap-x-3 gap-y-2 border-t px-3.5 py-2.5 transition-colors sm:px-5 ${asking ? "border-accent/30 bg-accent-pale/60" : "border-line bg-subtle/60"}`}>
      <span className={`text-[13px] font-semibold ${asking ? "w-full text-accent-deep sm:w-auto" : "text-soft"}`}>{asking ? "Used it? Tell everyone if it worked" : "Did it work?"}</span>
      <div className="flex items-center gap-1.5" role="group" aria-label="Did this code work?">
        <button type="button" disabled={busy || ended} aria-pressed={mine?.vote === 1} onClick={() => act("worked")} className={btn(mine?.vote === 1, "good")}>
          <svg aria-hidden viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.4">
            <path d="m4.5 10.5 3.5 3.5 7.5-8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Worked{tally?.worked ? <span className="opacity-80">{tally.worked}</span> : null}
        </button>
        <button type="button" disabled={busy || ended} aria-pressed={mine?.vote === -1} onClick={() => act("failed")} className={btn(mine?.vote === -1, "bad")}>
          <svg aria-hidden viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.4">
            <path d="m5.5 5.5 9 9m0-9-9 9" strokeLinecap="round" />
          </svg>
          Didn&apos;t{tally?.failed ? <span className="opacity-80">{tally.failed}</span> : null}
        </button>
      </div>
      <button
        type="button"
        disabled={busy}
        onClick={() => act("expired")}
        aria-pressed={!!mine?.expired}
        className={`ml-auto text-[12px] text-soft underline-offset-2 hover:underline ${mine?.expired ? "font-semibold text-ink" : ""}`}
      >
        {mine?.expired ? "Reported expired" : "Expired?"}
        {tally?.expired ? ` (${tally.expired})` : ""}
      </button>
      {s && pct != null && (
        <div className="flex w-full items-center gap-2.5" title={`${s.total} vote${s.total === 1 ? "" : "s"}`}>
          <div className="h-1.5 max-w-[14rem] flex-1 overflow-hidden rounded-full bg-line" aria-hidden>
            <div className={`h-full rounded-full ${pct >= 60 ? "bg-save" : pct >= 35 ? "bg-star" : "bg-[#dc2626]"}`} style={{ width: `${Math.max(6, pct)}%` }} />
          </div>
          <span className="whitespace-nowrap text-[12px] font-semibold tabular-nums text-soft">
            {pct}% of {s.total} worked
          </span>
          {tally?.lastWorked && <span className="truncate text-[12px] text-soft">· last {ago(tally.lastWorked, now)}</span>}
        </div>
      )}
      {err && <span className="w-full text-[12px] text-[#b91c1c] dark:text-[#f87171]">Couldn&apos;t save that just now. Try again in a minute.</span>}
    </div>
  );
}
