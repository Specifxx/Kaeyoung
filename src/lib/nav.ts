// Every place the site goes, grouped the way a shopper looks: the routine
// step, where the value is, brands and guides, and the rest. The desktop
// sidebar (components/SideNav.tsx, lg and up; owner, 2026-10-30: "a side panel
// like DexCompare") and the phone menu (components/MobileMenu.tsx) draw this
// one list, so the two never disagree. Static links to pages that exist.
// No data import here: the client menus import isActive from this file.
import { saleStrip } from "@/lib/black-friday";
import { CAT_BY_KEY, STEP_MENU_ORDER, type CatKey } from "@/site";

export type NavItem = { href: string; label: string; count?: number; cat?: CatKey };
export type NavGroup = { title: string; links: NavItem[] };

function saleLinks(): NavItem[] {
  const s = saleStrip(new Date().toISOString().slice(0, 10));
  return s ? [{ href: s.href, label: `${s.name} deals` }] : [];
}

export function navGroups(counts: Record<CatKey, number>, topBrands: { slug: string; name: string }[] = []): NavGroup[] {
  return [
    {
      title: "Shop by step",
      links: STEP_MENU_ORDER.map((k) => CAT_BY_KEY[k]).filter((c) => counts[c.key] > 0).map((c) => ({ href: `/${c.key}`, label: c.name, count: counts[c.key], cat: c.key })),
    },
    {
      title: "Save",
      links: [
        // Black Friday, then Cyber Monday, while the strip shows (lib/black-friday.ts saleStrip).
        ...saleLinks(),
        { href: "/popular", label: "Popular" },
        { href: "/deals", label: "Deals today" },
        { href: "/basket", label: "Basket compare" },
        { href: "/new", label: "New arrivals" },
        { href: "/guides", label: "Price guides" },
        { href: "/blog", label: "Blog" },
      ],
    },
    {
      title: "Brands",
      links: [...topBrands.map((b) => ({ href: `/brands/${b.slug}`, label: b.name })), { href: "/brands", label: "All brands" }],
    },
    {
      title: "KaeYoung",
      links: [
        { href: "/forum", label: "Community" },
        { href: "/creators", label: "Creators" },
        { href: "/stores", label: "Stores we compare" },
        { href: "/about", label: "How it works" },
        { href: "/disclosure", label: "How we make money" },
      ],
    },
  ];
}

/** The current page is this link, or inside it ("/serums/page/2" is in Serums). */
export function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
