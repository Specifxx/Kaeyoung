// Every place the site goes, grouped the way a shopper looks: the routine
// step, where the value is, brands and guides, and the rest. The header mega
// menus (components/HeaderMenus.tsx, lg up; they replaced the side panel, Bill
// 2026-11-09) and the phone menu (components/MobileMenu.tsx) draw this list,
// so they never disagree. Static links to pages that exist.
// No data import here: the client menus import isActive from this file.
import { saleStrip } from "@/lib/black-friday";
import { CAT_BY_KEY, STEP_MENU_ORDER, type CatKey } from "@/site";

export type NavItem = { href: string; label: string; count?: number; cat?: CatKey };
/** A header menu link; `regions` = the markets it has products in (absent: every market), drawn with the engine's rp-XX classes. */
export type MenuLink = { href: string; label: string; regions?: string[] };
export type HeaderMenu = { label: string; all: { href: string; label: string }; columns: { title?: string; links: MenuLink[] }[] };

/** What the header menus list beyond the groups: each already filtered to products and tagged with the markets that have them. */
export interface MenuFacts {
  catRegions: Partial<Record<CatKey, string[]>>;
  brands: MenuLink[];
  concerns: MenuLink[];
  ingredients: MenuLink[];
}
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
      // Shop by need (lib/needs.ts, owner 2026-11-08).
      title: "Shop by need",
      links: [
        { href: "/skin-concerns", label: "By skin concern" },
        { href: "/ingredients", label: "By ingredient" },
      ],
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

/**
 * The header's mega menus (components/HeaderMenus.tsx, lg up). The steps and the Save / site groups ARE the groups the side panel
 * and phone menu draw; concerns, ingredients and brands are the longer lists those link to, so a menu never names a place the
 * groups' own "All ..." links do not reach. A link with no products in any market is left out (regions: []).
 */
export function headerMenus(groups: NavGroup[], f: MenuFacts): HeaderMenu[] {
  const live = (l: MenuLink) => !l.regions || l.regions.length > 0;
  const steps: MenuLink[] = (groups[0]?.links ?? []).map((l) => ({ href: l.href, label: l.label, regions: l.cat ? f.catRegions[l.cat] : undefined })).filter(live);
  const group = (title: string) => groups.find((g) => g.title === title)?.links ?? [];
  return [
    { label: "Shop", all: { href: "/popular", label: "Popular right now" }, columns: [{ title: "By routine step", links: steps }] },
    {
      label: "Skin concern",
      all: { href: "/skin-concerns", label: "All skin concerns" },
      columns: [
        { title: "Concern", links: f.concerns.filter(live) },
        { title: "Ingredient", links: [...f.ingredients.filter(live), { href: "/ingredients", label: "All ingredients" }] },
      ],
    },
    { label: "Brands", all: { href: "/brands", label: "All brands" }, columns: [{ links: f.brands.filter(live) }] },
    {
      label: "Deals & more",
      all: { href: "/deals", label: "Deals today" },
      columns: [
        { title: "Save", links: group("Save") },
        { title: "KaeYoung", links: group("KaeYoung") },
      ],
    },
  ];
}

/**
 * The quick row under the header below lg (components/CategoryStrip.tsx): the sections as the first group lists them, this niche's
 * second way in, then Brands. A subset of the groups above, so the strip never names a place the menus do not.
 */
export function quickLinks(groups: NavGroup[]): NavItem[] {
  return [...(groups[0]?.links ?? []).map(({ href, label }) => ({ href, label })), { href: "/skin-concerns", label: "Skin concern" }, { href: "/brands", label: "Brands" }];
}

/** The current page is this link, or inside it ("/serums/page/2" is in Serums). */
export function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
