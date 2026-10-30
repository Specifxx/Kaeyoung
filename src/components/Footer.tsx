import Link from "next/link";
import { CATEGORIES, SITE } from "@/site";
import { POSTS, isLive } from "@/content/blog";
import { LogoMark } from "./Logo";

export function Footer({ updated }: { updated?: string | null }) {
  return (
    <footer className="wash mt-16 border-t border-line pt-12 text-sm">
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
            <Link prefetch={false} href="/contact" className="underline hover:text-ink">Contact us</Link>:{" "}
            <a className="underline hover:text-ink" href={`mailto:${SITE.email}`}>{SITE.email}</a>
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
            <li><Link prefetch={false} href="/blog" className="text-soft hover:text-ink">Blog</Link></li>
            <li><Link prefetch={false} href="/stores" className="text-soft hover:text-ink">Where to buy K-beauty online</Link></li>
            <li><Link prefetch={false} href="/about" className="text-soft hover:text-ink">About &amp; how matching works</Link></li>
            <li><Link prefetch={false} href="/basket" className="text-soft hover:text-ink">Compare a basket</Link></li>
            <li><Link prefetch={false} href="/disclosure" className="text-soft hover:text-ink">How we make money</Link></li>
            <li><Link prefetch={false} href="/privacy" className="text-soft hover:text-ink">Privacy</Link></li>
            <li><Link prefetch={false} href="/terms" className="text-soft hover:text-ink">Terms</Link></li>
            <li><Link prefetch={false} href="/contact" className="text-soft hover:text-ink">Contact us</Link></li>
          </ul>
        </div>
        <div>
          <h2 className="eyebrow mb-3">Read</h2>
          <ul className="space-y-1.5">
            {POSTS.filter((p) => isLive(p)).map((p) => (
              <li key={p.slug}>
                <Link prefetch={false} href={`/blog/${p.slug}`} className="text-soft hover:text-ink">
                  {p.short}
                </Link>
              </li>
            ))}
            <li>
              <Link prefetch={false} href="/blog" className="font-medium text-accent-deep hover:underline">
                All posts →
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line px-4 py-5 text-center text-xs text-soft">
        <p>
          Some links (eBay, Amazon and the labelled retailer rows) can earn us a commission at no cost to you; they never change the order of prices.{" "}
          <Link prefetch={false} href="/disclosure" className="underline hover:text-ink">How we make money</Link>. Prices are checked daily and can change between checks, so the store&apos;s checkout is always the final price; tell us about any
          mistake and we fix it.
        </p>
        <p className="mt-1">
          K Young is an independent price guide, not affiliated with any brand or store. Product names and photos belong to their owners. Nothing here is medical advice.
        </p>
      </div>
    </footer>
  );
}
