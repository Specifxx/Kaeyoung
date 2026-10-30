import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/react";
import "@fontsource-variable/inter";
import "@fontsource-variable/fraunces";
import "./globals.css";
import { SITE } from "@/site";
import { ACTIVE_REGIONS } from "@/lib/regions";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SideNav } from "@/components/SideNav";
import { navGroups } from "@/lib/nav";
import { catCounts, getBrands, getMeta } from "@/lib/data";
import { niceDate } from "@/lib/format";

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
    { color: "#fff8fa" },
  ],
};

// Runs before paint: the visitor's saved region (else one guessed from their
// time zone) and theme, so the right prices show with no flash and no cookie.
const zones = JSON.stringify(ACTIVE_REGIONS.map((r) => [r.code, r.zones]));
const BOOT = `(function(){var d=document.documentElement;try{var r=localStorage.getItem("ky-region");if(!r){var z=Intl.DateTimeFormat().resolvedOptions().timeZone||"",b="US",l=0;${zones}.forEach(function(e){e[1].forEach(function(p){if(z.indexOf(p)===0&&p.length>l){b=e[0];l=p.length}})});r=b}d.dataset.region=r;var t=localStorage.getItem("ky-theme");d.dataset.theme=t||"day"}catch(e){d.dataset.region="US"}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const meta = getMeta();
  const groups = navGroups(
    catCounts(),
    getBrands()
      .slice(0, 8)
      .map((b) => ({ slug: b.slug, name: b.name })),
  );
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: BOOT }} />
        {/* Impact (affiliate network) site check, in the exact form Impact gives: a `value` attribute. */}
        <meta {...({ name: "impact-site-verification", value: "59ec5beb-7403-4ebf-8dc5-d42ff5b432ce" } as object)} />
      </head>
      <body className="min-h-screen font-sans antialiased">
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded-md focus:bg-card focus:px-3 focus:py-1">
          Skip to content
        </a>
        <Header groups={groups} />
        <div className="flex">
          <SideNav groups={groups} />
          <main id="main" className="min-w-0 flex-1 pb-6">
            {children}
          </main>
        </div>
        <Footer updated={meta ? niceDate(meta.updatedAt) : null} />
        <Analytics />
      </body>
    </html>
  );
}
