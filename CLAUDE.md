# Working in this repo

K Young (kaeyoung.com, tagline "Stay young.") compares Korean skincare and K-beauty prices across real K-beauty stores in the
US, UK, Canada, Australia, New Zealand and Europe. A sister site of RiftCompare (`Specifxx/TCGEmpire`) and FigureCompare,
built on FigureCompare's static engine, but carrying **no Compare branding** (owner, 2026-10-30). Read `README.md`, then
`DECISIONS.md`.

## A fully static site: data in GitHub, pages on Vercel's CDN

- The daily import (`.github/workflows/import.yml`: `scripts/import.ts`, then `scripts/ebay-import.ts`) writes
  `data/public/*.json` and commits it to `main` with `[deploy]` in the subject: the one production build a day.
- Every page is prerendered at that build (`generateStaticParams` + `dynamicParams = false`): a visit is a static
  file, never a function. No database, no middleware, no ISR timer, no page reads cookies, headers or `searchParams`,
  every `next/link` has `prefetch={false}`, image optimisation is off. `tests/cost-rules.test.ts` pins all of it.
- The only function is eBay's account-deletion hook (`src/app/api/ebay/marketplace-deletion`); keep it while an eBay
  keyset exists.
- Never write anything private to `data/`: it is public with the source. Never edit `data/` by hand.
- The visitor's region is chosen in the browser (time zone, then their own pick in localStorage) by the script in
  `src/app/layout.tsx`; every region's prices are in the HTML and CSS shows one (`.rp-XX` in `globals.css`).

## Deploys are gated: never add `[deploy]` to a commit subject

Production builds only a commit whose SUBJECT carries `[deploy]` (`scripts/vercel-ignore-build.sh`,
`tests/vercel-ignore-build.test.ts`). The daily data commit carries it. "Push to prod" means land on `main` and ride
the next release; use *Production deploy* (or `[deploy]`) only when the owner says it is urgent, and say so.
Previews build only with `[preview]`, when the owner asks. `claude/*` and `ccr-*` branches never deploy (`vercel.json`).

## Matching: the Korean barcode or nothing

- A listing is matched ONLY by its EAN-13 with Korea's GS1 prefix 880 (`src/lib/ean.ts`), read from the variant
  barcode, the SKU or a labelled "EAN:" in a single-variant description. No barcode, no listing. Never match on a
  title: sizes, refills, old and new packaging, a single sheet and a box of ten look alike.
- Every Shopify variant is its own listing (a 30 ml and a 100 ml are two products). `products.json` has no barcode,
  so `/products/<handle>.json` is read once per product and cached in `data/state/barcodes.json`
  (`fill-barcodes.yml` does big fills on 16 runners). In `mixed` stores only known Korean brands are looked up.
- The title decides only whether a listing belongs (`src/lib/title.ts`): testers, samples, short-dated, damaged,
  pre-owned, store-made bundles and mystery boxes are refused; it also gives the category and size. Every rule
  changed gets a store title in `tests/title.test.ts`. Never refuse " + " (real names: "Rice + Probiotics").
- A product gets a page only when 2+ stores in one region sell it (`SITE.minStoresPerRegion`). With 3+ stores,
  prices under 40% or over 250% of the median are dropped. Mirrors (one stock, two domains) count once.
- The brand is the Shopify vendor, folded by `src/lib/brand.ts` (a vendor that is the store's own name falls back
  to a known brand in the title).
- Real stores only, never marketplaces (counterfeits). Stores live in `src/content/stores.ts`; read two at a time;
  a 403, 429 or captcha stops that store (never worked around). Prices are never converted between currencies; a
  store whose own currency is not its region's is skipped. Slugs are kept forever (`data/state/slugs.json`).
- No Korea region (DECISIONS.md, 2026-10-30).

## Money

- Affiliate tags are added at build (`src/lib/affiliate.ts`): `ky-<region>-<placement>-<ean>` in EPN `customid`,
  Amazon `ascsubtag` and the retailers' `{sub}`; stores get `utm_source=kaeyoung.com`.
- **No banner ads** (owner, 2026-10-30: "cut down on the banner ads … a really nice website"): no eBay strips, no
  AdSense, no nav ad boxes. Paid links live only in a product's price table, pinned above the stores and labelled:
  eBay, Amazon (US `riftcompare-20`, AU `compareempire-22`, others by `AMAZON_TAG_<REGION>`), and the beauty
  retailers in `PARTNERS` (YesStyle, Stylevana, Olive Young Global, iHerb, LOOKFANTASTIC, Cult Beauty), each shown
  only once its `AFF_*` tracking template is set in Vercel. None is ever counted as a store or "the cheapest";
  commission never decides order. `tests/site.test.ts` pins it.
- eBay listings come only from `scripts/ebay-import.ts` in GitHub Actions (Browse API by GTIN, new, Buy It Now,
  never from CN/HK sellers, 60%–300% of the store median). K Young's keyset is the owner's new third one (pending
  eBay approval, 2026-10-30), shared with CamCompare: 2,500 calls a day each, so `EBAY_DAILY_CAP` defaults to
  2,500 and the pass is a no-op until `EBAY_CLIENT_ID`/`EBAY_CLIENT_SECRET` exist. Never point it at a sister's
  keyset or raise the cap without the owner.
- No pop-ups, no interstitials, no sign-up or accounts (owner, 2026-10-30).

## Design

Professional and calm (owner, 2026-10-30: "make the website very professional"): warm off-white, white cards with
hairline borders, near-black buttons, one berry accent (`--accent`), green only for savings, Fraunces headings and
Inter text, no emoji decoration. A DexCompare-style side panel from `lg` up (`SideNav`, `src/lib/nav.ts`), the same
groups in the phone menu. Product photos are the stores' own, hotlinked. Icons and the share image come from
`scripts/og/render.mjs`; look at them before committing.

## The site watches itself

`ops-monitor.yml` runs `scripts/ops-monitor.ts` every three hours; a failing check fails the run and GitHub emails
the owner. When you add a scheduled job, an external API or anything with a limit, add a check there.

## Checks

```
npm run typecheck
npm run lint
npm test
KY_DATA_DIR=tests/fixtures/data npx next build   # every page prerenders against the fixture
```

Record non-obvious decisions in `DECISIONS.md` (newest at the bottom).
