"use client";
// The quick-jump row below the header, below lg (where the side panel is not drawn): the shop's sections, its second way in
// (lib/nav.ts quickLinks) and Brands, one thumb-swipe from the top of every page, so nobody opens the menu just to reach the
// section they came for (Bill, 2026-11-09). Plain links in the server's HTML; the current section is marked in the browser.
import Link from "next/link";
import { usePathname } from "next/navigation";
import { isActive, type NavItem } from "@/lib/nav";

export function CategoryStrip({ links }: { links: NavItem[] }) {
  const pathname = usePathname() || "/";
  return (
    <nav aria-label="Sections" className="border-b border-line bg-card/70 lg:hidden">
      <ul className="flex gap-1.5 overflow-x-auto whitespace-nowrap px-4 py-2 [scrollbar-width:none]">
        {links.map((l) => {
          const on = isActive(pathname, l.href);
          return (
            <li key={l.href}>
              <Link
                href={l.href}
                prefetch={false}
                aria-current={on ? "page" : undefined}
                className={`inline-flex min-h-9 items-center rounded-full border px-3.5 text-sm transition ${on ? "border-ink bg-ink font-semibold text-bg" : "border-line bg-card text-ink hover:border-soft"}`}
              >
                {l.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
