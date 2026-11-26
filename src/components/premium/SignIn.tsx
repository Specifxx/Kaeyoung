"use client";

import { useEffect, useRef, useState } from "react";
import { GOOGLE_CLIENT_ID, emailSignInLink, readStored, signInWithGoogle, untilLine, writeStored } from "@/lib/premium-member";
import { OAuthButtons } from "./OAuthButtons";
import { usePremium } from "./usePremium";
import { MemberRewards } from "@/components/account/MemberRewards";

// /account: sign in ON KaeYoung (owner, 2026-11-10). "Continue with Google" is Google Identity Services: Google's own button and
// account chooser, in this page, for KaeYoung's own client; the ID token goes to RiftCompare's API, which checks it with Google and
// answers with this site's sign-in token. Or an emailed 20-minute link from our alert sender. Nothing here needs a password.

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize(o: { client_id: string; callback: (r: { credential?: string }) => void; ux_mode?: "popup"; auto_select?: boolean; itp_support?: boolean; context?: string }): void;
          renderButton(el: HTMLElement, o: Record<string, unknown>): void;
        };
      };
    };
  }
}

const GSI_SRC = "https://accounts.google.com/gsi/client";

/** Where to go after signing in: a same-site path from ?next=, else /premium. */
function nextPath(): string {
  try {
    const n = new URLSearchParams(location.search).get("next") || "";
    return /^\/(?!\/)[\w\-/?=&.]*$/.test(n) ? n : "/account";
  } catch {
    return "/premium";
  }
}

/** /account once signed in (owner, 2026-11-19): the account hub. Who, Premium or not, and the way to everything an account holds. */
function AccountHub() {
  const v = usePremium();
  if (v.status !== "member" && v.status !== "free") return null;
  const member = v.status === "member";
  return (
    <>
      <div className="card mx-auto max-w-md p-6 sm:p-8">
        <h1 className="h-display text-3xl">My account</h1>
        <p className="mt-1 text-sm text-soft">
          {v.info.who ? `Signed in as ${v.info.who}` : "Signed in"}
          {member ? ` · Premium${untilLine(v.info.until) ? ` until ${untilLine(v.info.until)}` : ""}` : " · free account"}
        </p>
        <ul className="mt-6 grid gap-2">
          <li><a href="/watches" className="btn-pop btn-buy w-full justify-center">My watch list and price alerts</a></li>
          <li><a href="/deals" className="btn-pop border border-line bg-card text-ink hover:border-soft w-full justify-center">Today&rsquo;s deals</a></li>
        </ul>
        {member ? (
          <p className="mt-6 text-sm"><a href="/premium" className="font-semibold underline">Premium and billing</a></p>
        ) : (
          <a href="/premium" className="mt-6 block rounded-xl bg-gradient-to-br from-[#d03872] to-[#7a1f45] p-4 text-white">
            <span className="block text-xs font-bold uppercase tracking-widest text-amber-300">★ Premium · 14 days free</span>
            <span className="mt-1 block text-sm">No banner ads and up to 200 price and restock alerts. Start the free trial →</span>
          </a>
        )}
        <button type="button" className="mt-6 text-sm text-soft underline" onClick={() => { writeStored(null); location.reload(); }}>
          Sign out
        </button>
      </div>
      <div className="mx-auto max-w-md">
        <MemberRewards token={v.info.t} />
      </div>
    </>
  );
}

export function SignIn() {
  const v = usePremium();
  if (v.status === "loading") return <div className="mx-auto min-h-[24rem] max-w-md" aria-busy="true" />;
  if (v.status === "member" || v.status === "free") return <AccountHub />;
  return <SignInForm />;
}

function SignInForm() {
  const btn = useRef<HTMLDivElement>(null);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    if (readStored()) setSignedIn(true);
    if (!GOOGLE_CLIENT_ID || !btn.current) return;
    const el = btn.current;
    const draw = () => {
      if (!window.google) return;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        ux_mode: "popup",
        itp_support: true,
        context: "signin",
        callback: async (r) => {
          if (!r.credential) return;
          setBusy(true);
          setMsg({ ok: true, text: "Signing you in…" });
          const res = await signInWithGoogle(r.credential);
          setBusy(false);
          if (res.ok) location.replace(nextPath());
          else setMsg({ ok: false, text: res.message });
        },
      });
      window.google.accounts.id.renderButton(el, { type: "standard", theme: "outline", size: "large", text: "continue_with", shape: "pill", width: Math.min(360, el.clientWidth || 320) });
    };
    if (window.google) draw();
    else {
      const s = document.createElement("script");
      s.src = GSI_SRC;
      s.async = true;
      s.onload = draw;
      document.head.appendChild(s);
    }
  }, []);

  // A Google or Discord round trip that failed comes back here with ?error= (RiftCompare's sister sign-in).
  useEffect(() => {
    try {
      const e = new URLSearchParams(location.search).get("error");
      if (e) setMsg({ ok: false, text: e === "oauth_unverified" || e === "oauth_noemail" ? "That account has no verified email address. Verify it there, or use the email link." : "That sign-in didn't finish. Try again, or use the email link." });
    } catch {
      /* nothing to show */
    }
  }, []);

  async function sendLink(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const r = await emailSignInLink(email.trim());
    setBusy(false);
    setMsg({ ok: r.ok, text: r.message });
  }

  return (
    <div className="card mx-auto max-w-md p-6 sm:p-8">
      <h1 className="h-display text-3xl">Sign in or create a free account</h1>
      <p className="mt-1 text-sm text-soft">No password needed. A free account gets you:</p>
      <ul className="mt-3 grid gap-1.5 text-sm">
        <li>✓ A watch list: every product you&rsquo;re waiting on, with today&rsquo;s lowest price</li>
        <li>✓ Price-drop and back-in-stock emails, on any device</li>
        <li>✓ Premium&rsquo;s 14-day free trial when you want more</li>
      </ul>
      {signedIn && (
        <p className="mt-4 rounded-lg bg-accent-pale p-3 text-sm">
          You&rsquo;re already signed in on this device. <a className="font-semibold underline" href="/watches">My watches</a>
        </p>
      )}
      {GOOGLE_CLIENT_ID && <div ref={btn} className="mt-6 flex min-h-[44px] justify-center" />}
      <OAuthButtons site="kaeyoung" google={!GOOGLE_CLIENT_ID} className={GOOGLE_CLIENT_ID ? "mt-3" : "mt-6"} />
      <div className="my-5 flex items-center gap-3 text-xs text-soft">
        <span className="h-px flex-1 bg-line" />
        or
        <span className="h-px flex-1 bg-line" />
      </div>
      <form onSubmit={sendLink}>
        <label htmlFor="signin-email" className="text-sm font-semibold">Email me a sign-in link</label>
        <input
          id="signin-email"
          type="email"
          required
          autoComplete="email"
          inputMode="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Your email address"
          className="mt-2 w-full rounded-lg border border-line bg-card px-3 py-2.5 text-base"
        />
        <button type="submit" disabled={busy || !email} className="btn-pop btn-buy mt-3 w-full justify-center">
          {busy ? "Sending…" : "Email me a link"}
        </button>
      </form>
      {msg && (
        <p className={`mt-4 text-sm ${msg.ok ? "text-ink" : "text-red-600"}`} aria-live="polite">
          {msg.text}
        </p>
      )}
      <p className="mt-6 text-xs text-soft">
        By signing in you agree to our{" "}
        <a className="underline" href="/terms">terms</a> and <a className="underline" href="/privacy">privacy policy</a>.
      </p>
    </div>
  );
}
