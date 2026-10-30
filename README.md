# K Young

**Stay young.** Compare Korean skincare and K-beauty prices across real K-beauty stores in the US, UK, Canada,
Australia, New Zealand and Europe. Matched by the barcode on the box, size by size, checked every day.
Live at **kaeyoung.com**.

## How it works

```
GitHub Actions, daily 06:11 UTC (import.yml)
  every store in src/content/stores.ts (Shopify products.json, 2 at a time, ~1 request a second)
  → one listing per variant with a Korean EAN-13 (880…) (src/lib/ean.ts, src/lib/import/shopify.ts)
  → refuse testers, short-dated, damaged, bundles (src/lib/title.ts); category, size, brand
  → one product per barcode, kept when 2+ stores in a region sell it (src/lib/merge.ts)
  → eBay Browse by GTIN, budgeted (scripts/ebay-import.ts; 2,500 calls a day, off until the keyset exists)
  → data/public/{products,history,ebay,meta}.json, data/state/*
  → commit to main with "[deploy]" in the subject → one Vercel build a day → IndexNow ping
```

* **No database, no functions for visitors, no accounts.** Every page is prerendered at the daily build from the
  committed JSON; search is a static `/search-index.json`. The visitor's region is picked in the browser.
* **Deploys are gated** (`scripts/vercel-ignore-build.sh`): production builds only for `[deploy]` in the subject.
* **Barcodes**: `fill-barcodes.yml` (16 runners) does big barcode fills after stores are added; the daily import
  then looks up only new products (2,400 a run).
* **More stores**: add hosts to `probe/candidates.txt` on a `claude/*` branch; `probe-stores.yml` reads them and
  commits `probe/results.json` and `probe/summary.md`.
* **Monitoring**: `ops-monitor.yml` every three hours; a failure emails the owner through GitHub.

## Pages

Home, `/product/<slug>` (every store's price per region, pinned eBay/Amazon/retailer rows, price history, FAQ,
Product + FAQ JSON-LD, phone buy bar), `/<category>` (cleansers, toners, serums, moisturisers, sunscreen, masks,
eye-care, lip-care, makeup, body-hair, other; paged), `/brands`, `/brands/<slug>`, `/guides` and
`/guides/<slug>` (live-data price guides per category and per country), `/deals`, `/new`, `/stores`, `/search`,
`/about`, `/disclosure`, `/privacy`, `/terms`, `sitemap.xml`, `robots.txt`.

## Run locally

```
npm install
KY_DATA_DIR=tests/fixtures/data npm run dev        # synthetic fixture (npx tsx tests/fixtures/make-fixture.ts)
STORES=nudieglow npx tsx scripts/import.ts         # a real import of one store
```

Checks: `npm run typecheck`, `npm run lint`, `npm test`. Going live: the Chrome setup prompt in the project files
(`kyoung/chrome-prompt-setup.md`).
