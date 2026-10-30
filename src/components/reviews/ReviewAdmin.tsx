"use client";
import { useCallback, useEffect, useState } from "react";
import { skinLabel } from "@/lib/reviews";
import { Stars } from "./Stars";

type Row = { id: number; ean: string; stars: number; title: string | null; body: string | null; name: string | null; skin: string | null; status: string; flags: string; created: string };
const KEY = "ky-review-admin";

export function ReviewAdmin() {
  const [key, setKey] = useState("");
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState("");

  const call = useCallback(async (k: string, body: object) => {
    const r = await fetch("/api/reviews/admin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key: k, ...body }) });
    return (await r.json().catch(() => ({ ok: false, error: `HTTP ${r.status}` }))) as { ok: boolean; rows?: Row[]; error?: string };
  }, []);

  const load = useCallback(
    async (k: string) => {
      setError("");
      const j = await call(k, { action: "list" });
      if (!j.ok) return setError(j.error || "failed");
      setRows(j.rows ?? []);
      try {
        localStorage.setItem(KEY, k);
      } catch {}
    },
    [call],
  );

  useEffect(() => {
    try {
      const k = localStorage.getItem(KEY);
      if (k) {
        setKey(k);
        load(k);
      }
    } catch {}
  }, [load]);

  async function act(id: number, action: "publish" | "hide") {
    const j = await call(key, { action, id });
    if (!j.ok) return setError(j.error || "failed");
    setRows((rs) => rs?.map((r) => (r.id === id ? { ...r, status: action === "publish" ? "published" : "hidden" } : r)) ?? null);
  }

  if (!rows) {
    return (
      <form
        className="mt-6 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          load(key);
        }}
      >
        <input type="password" value={key} onChange={(e) => setKey(e.target.value)} placeholder="Admin key" className="flex-1 rounded-xl border border-line bg-card px-3 py-2" />
        <button className="btn-pop btn-buy px-5 py-2 text-sm">Open</button>
        {error && <p className="self-center text-sm text-accent-deep">{error}</p>}
      </form>
    );
  }
  return (
    <div className="mt-6 space-y-3">
      {error && <p className="text-sm text-accent-deep">{error}</p>}
      {!rows.length && <p className="text-soft">No reviews yet.</p>}
      {rows.map((r) => (
        <div key={r.id} className={`card p-4 text-sm ${r.status === "held" ? "ring-2 ring-star" : ""}`}>
          <div className="flex flex-wrap items-center gap-2">
            <Stars value={r.stars} />
            <span className="chip bg-subtle">{r.status}</span>
            {r.flags && <span className="chip bg-accent-pale text-accent-deep">{r.flags}</span>}
            <a href={`/search?q=${r.ean}`} className="text-soft underline">{r.ean}</a>
            <span className="text-soft">#{r.id} · {r.created}</span>
          </div>
          {r.title && <p className="mt-2 font-semibold">{r.title}</p>}
          {r.body && <p className="mt-1 whitespace-pre-line">{r.body}</p>}
          <p className="mt-1 text-xs text-soft">
            {r.name || "(no name)"}
            {r.skin ? ` · ${skinLabel(r.skin)} skin` : ""}
          </p>
          <div className="mt-2 flex gap-2">
            {r.status !== "published" && <button onClick={() => act(r.id, "publish")} className="rounded-full border border-line px-3 py-1 font-semibold">Publish</button>}
            {r.status !== "hidden" && <button onClick={() => act(r.id, "hide")} className="rounded-full border border-line px-3 py-1 font-semibold">Hide</button>}
          </div>
        </div>
      ))}
    </div>
  );
}
