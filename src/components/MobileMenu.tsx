"use client";
// The menu button below lg: the same groups as the desktop side panel
// (lib/nav.ts), then every region. A full-height sheet; closes on a link, Escape or the backdrop.
// Drawn on <body>: inside the blurred header a fixed sheet would be clipped to it.
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { isActive, type NavGroup } from "@/lib/nav";
import { ACTIVE_REGIONS } from "@/lib/regions";
import { setRegion, useRegion } from "./RegionPicker";

export function MobileMenu({ groups }: { groups: NavGroup[] }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname() || "/";
  const region = useRegion();
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);
  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-expanded={open}
        aria-controls="site-menu"
        className="grid h-9 w-9 place-items-center rounded-full border border-line bg-card text-ink transition hover:border-soft"
      >
        <svg aria-hidden width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
        <span className="sr-only">Menu</span>
      </button>
      {open &&
        createPortal(
          <div
            className="fixed inset-0 z-50"
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            id="site-menu"
          >
            <button
              type="button"
              aria-label="Close menu"
              className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />
            <nav className="absolute inset-y-0 right-0 flex w-[min(22rem,88vw)] flex-col overflow-y-auto overscroll-contain border-l border-line bg-bg p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="font-display text-lg font-semibold text-ink">
                  Menu
                </p>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="grid h-9 w-9 place-items-center rounded-full border border-line bg-card text-ink hover:border-soft"
                  aria-label="Close menu"
                >
                  ✕
                </button>
              </div>
              <Link
                href="/"
                prefetch={false}
                className={`mb-3 flex items-center gap-2 rounded-lg px-2 py-2 text-base ${pathname === "/" ? "bg-subtle font-semibold" : "hover:bg-subtle"}`}
              >
                Home
              </Link>
              {groups.map((g) => (
                <div key={g.title} className="mb-4">
                  <h2 className="mb-1 px-2 eyebrow">
                    {g.title}
                  </h2>
                  <ul>
                    {g.links.map((l) => (
                      <li key={l.href}>
                        <Link
                          href={l.href}
                          prefetch={false}
                          aria-current={
                            isActive(pathname, l.href) ? "page" : undefined
                          }
                          className={`flex items-center gap-2 rounded-lg px-2 py-2 text-base text-ink ${isActive(pathname, l.href) ? "bg-subtle font-semibold" : "hover:bg-subtle"}`}
                        >
                          <span className="flex-1">{l.label}</span>
                          {l.count != null && (
                            <span className="text-xs text-soft">{l.count}</span>
                          )}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
              <div className="mb-4">
                <h2 className="mb-1 px-2 eyebrow">
                  Prices in
                </h2>
                <ul className="grid grid-cols-2 gap-1.5">
                  {ACTIVE_REGIONS.map((r) => (
                    <li key={r.code}>
                      <button
                        type="button"
                        onClick={() => setRegion(r.code)}
                        aria-pressed={region === r.code}
                        className={`w-full rounded-lg border px-2 py-1.5 text-left text-sm ${region === r.code ? "border-ink bg-ink text-bg" : "border-line bg-card text-ink hover:border-soft"}`}
                      >
                        {r.flag} {r.name}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </nav>
          </div>,
          document.body,
        )}
    </div>
  );
}
