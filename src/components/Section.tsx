import Link from "next/link";
import type { ReactNode } from "react";

export function Section({ title, href, more, sub, children }: { title: string; href?: string; more?: string; sub?: string; children: ReactNode }) {
  return (
    <section className="mt-12">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="h-display text-2xl">{title}</h2>
          {sub && <p className="mt-1 text-sm text-soft">{sub}</p>}
        </div>
        {href && (
          <Link prefetch={false} href={href} className="text-sm font-semibold text-accent-deep underline-offset-4 hover:underline">
            {more ?? "See all"} →
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

export function PageHead({ title, sub, eyebrow, art }: { title: string; sub?: ReactNode; eyebrow?: string; art?: ReactNode }) {
  return (
    <header className="wash relative mb-8 mt-6 overflow-hidden rounded-3xl border border-line px-5 py-7 sm:px-8 sm:py-9">
      <div className="relative z-10 max-w-2xl">
        {eyebrow && <p className="eyebrow mb-2 text-accent-deep">{eyebrow}</p>}
        <h1 className="h-display text-3xl leading-tight sm:text-4xl">{title}</h1>
        {sub && <div className="mt-3 text-[15px] leading-relaxed text-soft">{sub}</div>}
      </div>
      {art && <div className="pointer-events-none absolute -right-2 bottom-0 hidden opacity-90 sm:block">{art}</div>}
    </header>
  );
}

/** Numbered page links for a paged hub. */
export function Pager({ pages, page, href }: { pages: number; page: number; href: (p: number) => string }) {
  if (pages <= 1) return null;
  return (
    <nav aria-label="Pages" className="mt-10 flex flex-wrap justify-center gap-1.5">
      {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
        <Link
          prefetch={false}
          key={p}
          href={href(p)}
          aria-current={p === page ? "page" : undefined}
          className={`grid h-9 min-w-9 place-items-center rounded-full border px-3 text-sm font-medium ${p === page ? "border-accent bg-accent text-white" : "border-line bg-card hover:border-accent/40"}`}
        >
          {p}
        </Link>
      ))}
    </nav>
  );
}
