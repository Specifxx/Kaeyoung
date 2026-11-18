import { SEASON_BOOT_SCRIPT } from "@/lib/season";
import localFont from "next/font/local";
import { MOTION_BOOT, MOTION_SCRIPT } from "@/lib/motion";
import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/react";
import { ShareArrival } from "@/components/ShareArrival";
import "./globals.css";
// The cart list's styles (components/cart): imported here, never from a component, so node tests can load them.
import "@/components/cart/cart.css";
import "@/components/cart/cart-drawer.css";
import "@/components/site-reviews/site-reviews.css";
import { SITE } from "@/site";
import { ACTIVE_REGIONS } from "@/lib/regions";
import { Header } from "@/components/Header";
import { HolidayStrip } from "@/components/HolidayStrip";
import { Footer } from "@/components/Footer";
import { IconSprite } from "@/components/IconSprite";
import { QuickView } from "@/components/QuickView";
import { RailDock } from "@/components/InlineAds";
import { RateCard } from "@/components/site-reviews/RateCard";
import { headerMenus, navGroups, quickLinks } from "@/lib/nav";
import { menuFacts } from "@/lib/menu-facts";
import { CategoryStrip } from "@/components/CategoryStrip";
import { catCounts, getBrands, getMeta } from "@/lib/data";
import { niceDate } from "@/lib/format";
import { BottomNav } from "@/components/BottomNav";
import { BOTTOM_NAV } from "@/lib/bottom-nav";


// Fonts (2026-11-18, "Speed up sites on mobile"): the latin files of the same variable fonts, bundled through next/font
// (OFL, src/app/fonts) instead of @fontsource's CSS. next/font preloads them and draws the first paint in a fallback
// sized to match, and display "optional" never swaps a face in after the text is laid out: with @fontsource's swap,
// the text re-wrapped when the font landed and moved everything below it (Lighthouse mobile layout shift 0.07 to 0.13,
// live). The card sites made the same choice for the same reason (0.209 measured there with swap).
const inter = localFont({ src: "./fonts/Inter-latin.woff2", weight: "100 900", style: "normal", display: "optional", variable: "--font-inter", adjustFontFallback: "Arial" });
const fraunces = localFont({ src: [{ path: "./fonts/Fraunces-latin.woff2", weight: "100 900", style: "normal" }, { path: "./fonts/Fraunces-latin-italic.woff2", weight: "100 900", style: "italic" }], display: "optional", variable: "--font-fraunces", adjustFontFallback: "Times New Roman" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: `${SITE.name}: ${SITE.tagline}`, template: `%s | ${SITE.name}` },
  description: SITE.description,
  openGraph: { siteName: SITE.name, type: "website", locale: "en" },
  twitter: { card: "summary_large_image" },
  verification: process.env.GOOGLE_SITE_VERIFICATION ? { google: process.env.GOOGLE_SITE_VERIFICATION } : undefined,
};

export const viewport: Viewport = {
  themeColor: [
    { color: "#18121a" },
  ],
};

// Runs before paint: the visitor's saved region (else one guessed from their
// time zone) and theme, so the right prices show with no flash and no cookie.
const zones = JSON.stringify(ACTIVE_REGIONS.map((r) => [r.code, r.zones]));
const BOOT = `(function(){var d=document.documentElement;try{var r=localStorage.getItem("ky-region");if(!r){var z=Intl.DateTimeFormat().resolvedOptions().timeZone||"",b="US",l=0;${zones}.forEach(function(e){e[1].forEach(function(p){if(z.indexOf(p)===0&&p.length>l){b=e[0];l=p.length}})});r=b}d.dataset.region=r;var t=localStorage.getItem("ky-theme");d.dataset.theme=t==="day"?"day":"night"}catch(e){d.dataset.region="US"}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const meta = getMeta();
  const groups = navGroups(
    catCounts(),
    getBrands()
      .slice(0, 5)
      .map((b) => ({ slug: b.slug, name: b.name })),
  );
  return (
    <html className={`${inter.variable} ${fraunces.variable}`} lang="en" data-theme="night" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: BOOT }} />
        {/* The holiday look (1 November to Boxing Day): data-season on <html> from the visitor's own date. lib/season.ts. */}
        <script dangerouslySetInnerHTML={{ __html: SEASON_BOOT_SCRIPT }} />
        {/* The motion layer (lib/motion.ts): data-motion before paint, unless the visitor prefers reduced motion. */}
        <script dangerouslySetInnerHTML={{ __html: MOTION_BOOT }} />
        {/* Impact (affiliate network) site check, in the exact form Impact gives: a `value` attribute. */}
        <meta {...({ name: "impact-site-verification", value: "59ec5beb-7403-4ebf-8dc5-d42ff5b432ce" } as object)} />
        {/* This site's own Impact property (account 7385758, 2026-11-17). */}
        <meta {...({ name: "impact-site-verification", value: "3dc15489-cc1c-475f-8858-7872044a60c2" } as object)} />
        {/* Pinterest domain claim (owner, 2026-10-30). */}
        <meta name="p:domain_verify" content="c38a5bd57e1125d042a13aff9cee0d97" />
      </head>
      <body className="min-h-screen font-sans antialiased">
        <IconSprite />
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded-md focus:bg-card focus:px-3 focus:py-1">
          Skip to content
        </a>
        <Header groups={groups} menus={headerMenus(groups, menuFacts())} />
        {/* Below lg: the sections one swipe away (the side panel carries them from lg). */}
        <CategoryStrip links={quickLinks(groups)} />
        <HolidayStrip />
        <div className="flex">
          <main id="main" className="min-w-0 flex-1 pb-6">
            {children}
          </main>
        </div>
        <Footer updated={meta ? niceDate(meta.updatedAt) : null} />
        <QuickView />
        {/* Rate us (owner, 2026-11-03): the corner card, asking only after real use; the ratings are kept by the shared review service. */}
        <RateCard />
        {/* Phones: the eBay tiles in the phone dock, after a scroll, never on a product page. */}
        <RailDock />
        <Analytics />
        <ShareArrival />
        {/* Scroll reveals: shows what is on screen, then lets the rest ease in as it scrolls into view. */}
        <script dangerouslySetInnerHTML={{ __html: MOTION_SCRIPT }} />
        {/* The phone bottom nav (components/BottomNav.tsx, lib/bottom-nav.ts): browser only, phones only, BOTTOM_NAV is its switch. */}
        {BOTTOM_NAV !== "off" && <BottomNav mode={BOTTOM_NAV} />}
      </body>
    </html>
  );
}
