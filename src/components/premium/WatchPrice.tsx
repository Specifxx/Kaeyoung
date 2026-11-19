"use client";

// "Email me when the price drops" / "when it's back in stock" on a product's page (owner, 2026-11-19: accounts and Premium with
// alerts on every site). One per region block (the page draws every region and CSS shows the visitor's). Posts to the shared alert
// service with only the site key, the barcode, the region, the price and the address; a signed-in member's account names the address
// instead (no confirmation email). The service reads this site's /alert-feed.json once a day. Inline under a quiet link, no pop-up.
import { useEffect, useState, type FormEvent } from "react";
import { readStored, saveAlert } from "@/lib/premium-member";

const SYMBOL: Record<string, string> = { US: "US$", CA: "CA$", AU: "A$", NZ: "NZ$", UK: "£", EU: "€" };

/** 10% under today's price, rounded down to a whole unit. */
export function suggestTarget(cents: number): number {
  return Math.max(100, Math.floor((cents * 0.9) / 100) * 100);
}

/** "12.5" / "12,50" / "£12" → 1250; null when it isn't a positive amount. */
export function parseAmount(s: string): number | null {
  const t = s.replace(/[^\d.,]/g, "").replace(/,(\d{1,2})$/, ".$1").replace(/,/g, "");
  if (!/^\d+(\.\d{1,2})?$/.test(t)) return null;
  const c = Math.round(Number(t) * 100);
  return c > 0 && c < 100_000_000 ? c : null;
}

type State = { s: "idle" | "sending" } | { s: "done"; active: boolean } | { s: "error"; message: string; signIn?: boolean };

const field = "mt-1 w-full rounded-lg border border-line bg-card px-3 py-2 text-base text-ink";

export function WatchPrice({ productId, region, priceCents }: { productId: string; region: string; priceCents: number | null }) {
  const restock = priceCents == null;
  const [open, setOpen] = useState(false);
  const [member, setMember] = useState(false);
  const [state, setState] = useState<State>({ s: "idle" });
  useEffect(() => setMember(!!readStored()), [open]);
  const start = priceCents ? (suggestTarget(priceCents) / 100).toFixed(0) : "";

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    if (String(f.get("website") ?? "")) return setState({ s: "done", active: false });
    const stored = readStored();
    let targetCents: number | undefined;
    if (!restock) {
      const t = parseAmount(String(f.get("target") ?? ""));
      if (!t) return setState({ s: "error", message: "Enter the price you want, like 45 or 45.50." });
      targetCents = t;
    }
    setState({ s: "sending" });
    const r = await saveAlert({
      productId,
      region,
      kind: restock ? "restock" : "price",
      targetCents,
      ...(stored ? { token: stored.t } : { email: String(f.get("email") ?? "") }),
      weekly: f.get("weekly") === "on" || undefined,
    });
    setState(r.ok ? { s: "done", active: r.active } : { s: "error", message: r.message, signIn: r.signIn });
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-accent underline-offset-2 hover:underline">
        <svg aria-hidden viewBox="0 0 20 20" className="h-4 w-4 fill-none stroke-current" strokeWidth="1.7"><path d="M10 3a4.5 4.5 0 0 0-4.5 4.5c0 4-1.8 5.3-1.8 5.3h12.6s-1.8-1.3-1.8-5.3A4.5 4.5 0 0 0 10 3zM8.3 15.8a1.9 1.9 0 0 0 3.4 0" strokeLinecap="round" strokeLinejoin="round" /></svg>
        {restock ? "Email me when it’s back in stock" : "Email me when the price drops"}
      </button>
    );
  }
  if (state.s === "done") {
    return (
      <div className="mt-3 rounded-xl border border-line bg-subtle p-4 text-sm" role="status">
        <p className="font-semibold">{state.active ? (restock ? "Done. We’ll email you when it’s back." : "Done. Your alert is on.") : "Check your inbox to confirm."}</p>
        <p className="mt-1 text-soft">
          {state.active ? "We check every store once a day after the price update." : "One click in the email we just sent and your alert starts."}{" "}
          {member ? <a className="underline" href="/watches">See my watch list</a> : <a className="underline" href="/account?next=/watches">Sign in to keep a watch list</a>}
        </p>
      </div>
    );
  }
  return (
    <form onSubmit={submit} className="mt-3 rounded-xl border border-line bg-subtle p-4 text-sm">
      <p className="font-semibold">{restock ? "Get an email when a store has it in stock again" : "Email me when the price drops"}</p>
      {!restock && (
        <label className="mt-3 block">
          <span className="font-medium">When a {region} store has it for {SYMBOL[region] ?? ""} or less</span>
          <input name="target" inputMode="decimal" required defaultValue={start} placeholder={start || "45"} autoComplete="off" className={field} />
        </label>
      )}
      {!member && (
        <label className="mt-3 block">
          <span className="font-medium">Your email</span>
          <input name="email" type="email" required autoComplete="email" placeholder="Your email address" className={field} />
        </label>
      )}
      <label className="mt-3 flex cursor-pointer items-start gap-2">
        <input type="checkbox" name="weekly" className="mt-1" />
        <span>Also email me the week&rsquo;s biggest K-beauty price drops</span>
      </label>
      <div className="absolute -left-[10000px] h-px w-px overflow-hidden" aria-hidden="true">
        <label>
          Website <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <button type="submit" disabled={state.s === "sending"} className="btn-pop btn-buy mt-3">
        {state.s === "sending" ? "Saving…" : restock ? "Email me" : "Set price alert"}
      </button>
      {state.s === "error" && (
        <p role="alert" className="mt-2 text-red-600">
          {state.message} {state.signIn && <a className="underline" href="/account">Sign in</a>}
        </p>
      )}
      <p className="mt-3 text-xs text-soft">
        {member
          ? "Saved to your account’s watch list. "
          : "Free, no account needed: we email you once to confirm, then only when a store reaches it. "}
        Every email has a stop link and alerts end after six months. <a className="underline" href="/privacy#alerts">Privacy</a>
        {!member && (
          <>
            {" · "}
            <a className="underline" href="/account">Sign in</a> to keep them on a watch list
          </>
        )}
      </p>
    </form>
  );
}
