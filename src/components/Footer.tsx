import Link from "next/link";
import { CATEGORIES, SISTER_SITES, SITE } from "@/site";
import { LogoMark } from "./Logo";

export function Footer({ updated }: { updated?: string | null }) {
  return (
    <footer className="mt-16 border-t border-line bg-card pt-12 text-sm">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 pb-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-2.5">
            <LogoMark size={30} />
            <span className="font-display text-xl font-semibold">K Young</span>
          </div>
          <p className="mt-3 text-soft">
            Korean skincare prices from real K-beauty stores, matched by the barcode on the box and checked every day. {SITE.slogan}
          </p>
          {updated && <p className="mt-3 text-xs text-soft">Prices updated {updated}.</p>}
          <p className="mt-3 text-xs text-soft">
            Contact: <a className="underline hover:text-ink" href={`mailto:${SITE.email}`}>{SITE.email}</a>
          </p>
        </div>
        <div>
          <h2 className="eyebrow mb-3">Shop</h2>
          <ul className="space-y-1.5">
            {CATEGORIES.filter((c) => c.key !== "other").map((c) => (
              <li key={c.key}>
                <Link prefetch={false} href={`/${c.key}`} className="text-soft hover:text-ink">
                  {c.plural.replace(/^./, (x) => x.toUpperCase())} prices
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="eyebrow mb-3">K Young</h2>
          <ul className="space-y-1.5">
            <li><Link prefetch={false} href="/deals" className="text-soft hover:text-ink">K-beauty deals today</Link></li>
            <li><Link prefetch={false} href="/brands" className="text-soft hover:text-ink">Korean skincare brands</Link></li>
            <li><Link prefetch={false} href="/guides" className="text-soft hover:text-ink">Price guides</Link></li>
            <li><Link prefetch={false} href="/stores" className="text-soft hover:text-ink">Where to buy K-beauty online</Link></li>
            <li><Link prefetch={false} href="/about" className="text-soft hover:text-ink">About &amp; how matching works</Link></li>
            <li><Link prefetch={false} href="/disclosure" className="text-soft hover:text-ink">Affiliate disclosure</Link></li>
            <li><Link prefetch={false} href="/privacy" className="text-soft hover:text-ink">Privacy</Link></li>
            <li><Link prefetch={false} href="/terms" className="text-soft hover:text-ink">Terms</Link></li>
          </ul>
        </div>
        <div>
          <h2 className="eyebrow mb-3">Sister sites</h2>
          <ul className="space-y-1.5">
            {SISTER_SITES.map((s) => (
              <li key={s.url}>
                <a href={s.url} className="text-soft hover:text-ink">
                  {s.anchor} · {s.name}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-line px-4 py-5 text-center text-xs text-soft">
        <p>
          Some links earn us a small commission at no cost to you; they never change the order of prices. Prices and stock change fast: the store&apos;s page is always right.
        </p>
        <p className="mt-1">
          K Young is an independent price guide, not affiliated with any brand or store. Product names and photos belong to their owners. Nothing here is medical advice.
        </p>
      </div>
    </footer>
  );
}
