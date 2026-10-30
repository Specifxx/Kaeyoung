"use client";
// The desktop side panel (lg and up; owner, 2026-10-30: "a side panel like
// DexCompare, so it's easily navigable"): every routine step, the deal pages,
// the top brands and the rest (lib/nav.ts), sticky under the header. Plain
// links in the static HTML; the current page is marked in the browser.
import Link from "next/link";
import { usePathname } from "next/navigation";
import { isActive, type NavGroup } from "@/lib/nav";
import { CAT_TINT, CatIcon } from "./Art";

export function SideNav({ groups }: { groups: NavGroup[] }) {
  const pathname = usePathname() || "/";
  return (
    <aside className="wash hidden w-64 shrink-0 border-r border-line lg:block">
      <nav aria-label="Browse" className="sticky top-[4.25rem] max-h-[calc(100dvh-4.25rem)] overflow-y-auto overscroll-contain py-6 pl-4 pr-3 [scrollbar-width:thin]">
        {groups.map((g) => (
          <div key={g.title} className="mb-6">
            <h2 className="eyebrow mb-1.5 px-2">{g.title}</h2>
            <ul>
              {g.links.map((l) => {
                const active = isActive(pathname, l.href);
                return (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      prefetch={false}
                      aria-current={active ? "page" : undefined}
                      className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-[14px] transition ${active ? "bg-card font-semibold text-ink shadow-card ring-1 ring-line" : "text-soft hover:bg-card/70 hover:text-ink"}`}
                    >
                      {l.cat && (
                        <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg ${CAT_TINT[l.cat]}`}>
                          <CatIcon cat={l.cat} size={20} />
                        </span>
                      )}
                      <span className="flex-1 truncate">{l.label}</span>
                      {l.count != null && <span className="text-xs tabular-nums text-soft">{l.count.toLocaleString("en-US")}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
