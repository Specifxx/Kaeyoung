"use client";
// Rate and review a product, no account needed. Tap a star to start; words
// are optional. The review goes to POST /api/reviews and appears on the page
// after the next daily update (the page is a static file). This browser
// remembers what it sent so the shopper sees it straight away.
import { useEffect, useRef, useState } from "react";
import { BODY_MAX, BODY_MIN, NAME_MAX, SKIN_TYPES, TITLE_MAX } from "@/lib/reviews";
import { Stars } from "./Stars";

const LABELS = ["", "Didn't like it", "Not great", "It's okay", "Really good", "Love it"];
const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "";

type Sent = { stars: number; body?: string; status: string };
const memKey = (ean: string) => `ky-review-${ean}`;

declare global {
  interface Window {
    turnstile?: { render: (el: HTMLElement, o: { sitekey: string; callback: (t: string) => void; "expired-callback"?: () => void }) => string };
  }
}

export function ReviewForm({ ean, name }: { ean: string; name: string }) {
  const [stars, setStars] = useState(0);
  const [hover, setHover] = useState(0);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState<Sent | null>(null);
  const [token, setToken] = useState("");
  const started = useRef(0);
  const box = useRef<HTMLDivElement>(null);
  const [f, setF] = useState({ title: "", body: "", name: "", skin: "", website: "" });

  useEffect(() => {
    try {
      const s = localStorage.getItem(memKey(ean));
      if (s) setSent(JSON.parse(s));
    } catch {}
  }, [ean]);

  // Cloudflare Turnstile only when the site has a key; loaded on first use.
  useEffect(() => {
    if (!open || !SITE_KEY || !box.current) return;
    const el = box.current;
    const draw = () => window.turnstile?.render(el, { sitekey: SITE_KEY, callback: setToken, "expired-callback": () => setToken("") });
    if (window.turnstile) return void draw();
    const s = document.createElement("script");
    s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    s.async = true;
    s.onload = draw;
    document.head.appendChild(s);
  }, [open]);

  const pick = (n: number) => {
    setStars(n);
    if (!open) {
      setOpen(true);
      started.current = Date.now();
    }
  };

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!stars) return setError("Tap a star first.");
    const body = f.body.trim();
    if (body && body.length < BODY_MIN) return setError(`A few more words, please: at least ${BODY_MIN} characters, or leave it empty to just rate.`);
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ean, stars, ...f, body, elapsed: (Date.now() - started.current) / 1000, turnstile: token }),
      });
      const j = (await r.json().catch(() => ({}))) as { ok?: boolean; status?: string; error?: string };
      if (!j.ok) {
        setError(j.error || "Something went wrong. Please try again.");
      } else {
        const s: Sent = { stars, body: body || undefined, status: j.status || "published" };
        setSent(s);
        try {
          localStorage.setItem(memKey(ean), JSON.stringify(s));
        } catch {}
      }
    } catch {
      setError("We couldn't reach K Young. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <div className="rounded-2xl tint-mint p-5 text-sm">
        <p className="font-semibold text-ink">Thank you for rating this product!</p>
        <p className="mt-1 flex items-center gap-2 text-soft">
          You gave it <Stars value={sent.stars} size={15} />
        </p>
        {sent.body && <p className="mt-2 whitespace-pre-line text-ink">&ldquo;{sent.body}&rdquo;</p>}
        <p className="mt-2 text-soft">
          {sent.status === "held"
            ? "We read reviews like yours before they go up, so it may take a few days to appear."
            : "It appears here for everyone with tomorrow's price update."}
        </p>
      </div>
    );
  }

  const shown = hover || stars;
  return (
    <form onSubmit={send} className="relative rounded-2xl border border-line bg-card p-5" noValidate>
      <p className="font-display text-lg font-medium">Rate {name}</p>
      <p className="mt-0.5 text-sm text-soft">No account needed. Tap the stars; a written review is optional.</p>
      <div className="mt-3 flex items-center gap-3">
        <div role="radiogroup" aria-label="Your rating" className="flex" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={stars === n}
              aria-label={`${n} star${n > 1 ? "s" : ""}: ${LABELS[n]}`}
              onMouseEnter={() => setHover(n)}
              onFocus={() => setHover(n)}
              onBlur={() => setHover(0)}
              onClick={() => pick(n)}
              className="p-1 text-star transition-transform hover:scale-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
            >
              <svg width="30" height="30" viewBox="0 0 20 20" aria-hidden>
                <path d="M10 1.6l2.6 5.3 5.8.8-4.2 4.1 1 5.8L10 14.9l-5.2 2.7 1-5.8L1.6 7.7l5.8-.8z" fill={n <= shown ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
              </svg>
            </button>
          ))}
        </div>
        <span className="text-sm font-medium text-ink" aria-live="polite">{LABELS[shown]}</span>
      </div>

      {open && (
        <div className="mt-4 grid gap-3">
          <label className="grid gap-1 text-sm">
            <span className="font-medium">Your review <span className="font-normal text-soft">(optional)</span></span>
            <textarea
              value={f.body}
              maxLength={BODY_MAX}
              rows={4}
              onChange={(e) => setF({ ...f, body: e.target.value })}
              placeholder="How did it feel on your skin? Texture, scent, results, would you buy it again?"
              className="rounded-xl border border-line bg-bg px-3 py-2 focus:border-accent focus:outline-none"
            />
          </label>
          {f.body.trim() && (
            <label className="grid gap-1 text-sm">
              <span className="font-medium">Headline <span className="font-normal text-soft">(optional)</span></span>
              <input value={f.title} maxLength={TITLE_MAX} onChange={(e) => setF({ ...f, title: e.target.value })} className="rounded-xl border border-line bg-bg px-3 py-2 focus:border-accent focus:outline-none" />
            </label>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1 text-sm">
              <span className="font-medium">Name shown <span className="font-normal text-soft">(optional)</span></span>
              <input value={f.name} maxLength={NAME_MAX} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="e.g. Mina" autoComplete="given-name" className="rounded-xl border border-line bg-bg px-3 py-2 focus:border-accent focus:outline-none" />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="font-medium">Skin type <span className="font-normal text-soft">(optional)</span></span>
              <select value={f.skin} onChange={(e) => setF({ ...f, skin: e.target.value })} className="rounded-xl border border-line bg-bg px-3 py-2 focus:border-accent focus:outline-none">
                <option value="">Prefer not to say</option>
                {SKIN_TYPES.map((s) => (
                  <option key={s.key} value={s.key}>{s.label}</option>
                ))}
              </select>
            </label>
          </div>
          {/* A field people never see; bots fill it. */}
          <input tabIndex={-1} aria-hidden autoComplete="off" name="website" value={f.website} onChange={(e) => setF({ ...f, website: e.target.value })} className="absolute -left-[9999px] h-0 w-0 opacity-0" />
          {SITE_KEY && <div ref={box} />}
          {error && <p role="alert" className="text-sm font-medium text-accent-deep">{error}</p>}
          <div className="flex flex-wrap items-center gap-3">
            <button type="submit" disabled={busy} className="btn-pop btn-buy px-6 py-2 text-sm disabled:opacity-60">
              {busy ? "Sending…" : "Send rating"}
            </button>
            <p className="text-xs text-soft">Please don&apos;t include links or contact details. Reviews follow our <a href="/terms" className="underline underline-offset-2">terms</a>.</p>
          </div>
        </div>
      )}
    </form>
  );
}
