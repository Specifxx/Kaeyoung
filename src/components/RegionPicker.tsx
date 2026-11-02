"use client";
// The visitor's region: picked from their time zone by the <head> script on
// the first visit, changed here, remembered in this browser only.
import { useEffect, useState } from "react";
import { REGIONS, type RegionCode } from "@/site";
import { ACTIVE_REGIONS } from "@/lib/regions";
import { Flag } from "./Flag";

export function setRegion(code: RegionCode) {
  document.documentElement.dataset.region = code;
  try {
    localStorage.setItem("ky-region", code);
  } catch {}
  window.dispatchEvent(new CustomEvent("ky-region", { detail: code }));
}

export function useRegion(): RegionCode {
  const [r, setR] = useState<RegionCode>("US");
  useEffect(() => {
    const read = () => setR((document.documentElement.dataset.region as RegionCode) || "US");
    read();
    window.addEventListener("ky-region", read);
    return () => window.removeEventListener("ky-region", read);
  }, []);
  return r;
}

// The header's region menu: the region's drawn flag and code, with a native
// select laid invisibly over them (keyboard- and screen-reader-friendly).
// Flags are Flag.tsx's inline SVG: an emoji flag is two letters on Windows
// (owner, 2026-11-02: flags on the region switcher).
export function RegionPicker({ compact = false }: { compact?: boolean }) {
  const region = useRegion();
  const current = REGIONS.find((r) => r.code === region);
  return (
    <label className="relative inline-flex items-center gap-1.5 rounded-full border border-line bg-card py-1.5 pl-3 pr-2.5 text-sm font-medium text-ink focus-within:ring-2 focus-within:ring-accent/40 hover:border-soft">
      <Flag code={region} />
      <span>{compact || !current ? region : current.name}</span>
      <span aria-hidden className="text-[9px] text-soft">▼</span>
      <select
        aria-label="Your region"
        value={region}
        onChange={(e) => setRegion(e.target.value as RegionCode)}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
      >
        {ACTIVE_REGIONS.map((r) => (
          <option key={r.code} value={r.code}>
            {r.name}
          </option>
        ))}
      </select>
    </label>
  );
}

/**
 * The home hero's region row (owner, 2026-11-02: "the region switcher must be
 * more prevalent … on the main home page hero … and have the flags as well"):
 * every region as a flag chip, the visitor's marked. Same choice as the
 * header. Codes, not names: the hero column is narrow; the name is the title.
 */
export function RegionChips({ className = "" }: { className?: string }) {
  const region = useRegion();
  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className}`} role="group" aria-label="Choose your region">
      <span className="mr-0.5 text-sm font-medium text-soft">Prices for</span>
      {ACTIVE_REGIONS.map((r) => {
        const on = region === r.code;
        return (
          <button
            key={r.code}
            type="button"
            aria-pressed={on}
            onClick={() => setRegion(r.code)}
            title={r.name}
            className={`inline-flex min-h-10 items-center gap-1.5 rounded-full border px-2.5 text-sm font-semibold transition ${on ? "border-accent bg-accent text-white" : "border-line bg-card text-ink hover:border-soft"}`}
          >
            <Flag code={r.code} />
            {r.code}
            <span className="sr-only"> {r.name}</span>
          </button>
        );
      })}
    </div>
  );
}

/** Buttons that switch region inside a page ("Prices in:" flag + code). */
export function RegionTabs({ available }: { available: RegionCode[] }) {
  const region = useRegion();
  return (
    <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Prices by region">
      {REGIONS.filter((r) => available.includes(r.code)).map((r) => (
        <button
          key={r.code}
          role="tab"
          aria-selected={region === r.code}
          onClick={() => setRegion(r.code)}
          className={`rounded-full border px-3 py-1 text-sm transition ${region === r.code ? "border-ink bg-ink text-bg" : "border-line bg-card text-ink hover:border-soft"}`}
        >
          <Flag code={r.code} /> {r.code}
        </button>
      ))}
    </div>
  );
}
