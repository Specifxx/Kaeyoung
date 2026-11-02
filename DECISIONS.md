# Decisions

Newest at the bottom. Why K Young is the way it is.

## Launch shape — 2026-10-30

**Owner:** "a K-beauty price comparison website … use all the playbooks … you don't need that sign up feature …
it's gonna be K Young, stay young … no compare branding … as many stores in as possible … affiliate ads,
everything set up, eBay as well, and Amazon." Then: "make the website very professional … cut down on the banner
ads … a side panel like Dex Compare."

* **Why K-beauty and not all skincare** (research thread "Assess a global skincare compare site", 2026-10-30): the
  big beauty retailers sell at list price on custom sites (LOOKFANTASTIC's terms allow feeds only), so a general
  skincare comparison has little to compare. K-beauty is sold by dozens of independent Shopify shops in every
  English-speaking market, at very different prices, and every Korean product carries a barcode with Korea's GS1
  prefix 880. The store probe passed: 42 deep K-beauty shops with readable barcodes, hundreds of barcodes shared by
  2+ shops in each currency.
* **The FigureCompare engine**, adapted: fully static, one page per product (not per region), region chosen in the
  browser, prices never converted, barcode matching only, two stores in one region or no page.
* **Per-variant listings.** Unlike figures, a skincare product comes in sizes, shades and single/box packs, each
  with its own barcode. Every Shopify variant is read as its own listing with its own barcode (cached per product).
* **Categories from titles** (routine steps: cleansers → toners → serums → moisturisers → sunscreen, then masks,
  eye, lip, makeup, body and hair), majority vote across stores. **Brands from the Shopify vendor**, folded to one
  spelling; a brand gets a page at 3+ products.
* **No Korea region.** Shoppers in Korea buy at domestic prices from Olive Young, Coupang and the brands' own
  shops, none of which is readable, and no affiliate program we can join pays on Korean domestic sales. A Korean
  edition would also need a Korean-language site for a market we cannot compare. Korean-based shops that ship
  worldwide in US dollars (Althea, Be Mused Korea, StyleKorean) are in the US region. Revisit only if a readable
  Korean store set and a KRW affiliate program appear.
* **No sign-up, no accounts, no email** (owner).

## Money — 2026-10-30

* **No banner ads** (owner): no eBay strips, nav boxes or AdSense. Paid links sit only in the product price table,
  above the stores, labelled, `rel="sponsored"`, never counted as a store or the best price.
* **eBay**: pinned row per region (search, or the cheapest believable listing by GTIN once the eBay pass runs).
  Counterfeit K-beauty ships mostly from China and Hong Kong, so those sellers are skipped. EPN campaign
  5339155912, the one campaign every family site uses (hard-coded, owner 2026-10-30); the `ky-` customid separates it. K Young and
  CamCompare share the owner's third Browse keyset (pending eBay approval, owner 2026-10-30), 2,500 calls a day
  each: `EBAY_DAILY_CAP` defaults to 2,500 and can only lower it; the pass is a no-op until the keys exist.
* **Amazon**: US `riftcompare-20` and AU `compareempire-22` (the family's accounts; a US tag earns nothing on
  amazon.com.au). UK, CA and DE appear only once `AMAZON_TAG_UK/CA/EU` exist.
* **Beauty retailers** (rates from the research thread): YesStyle (~10%), Stylevana (FlexOffers), Olive Young
  Global (Involve Asia, 2.8–5.6%), iHerb, LOOKFANTASTIC (Awin, UK) and Cult Beauty (Awin, UK). None publishes a
  readable price feed, so each is a labelled search row, shown only once its `AFF_*` tracking-link template is set
  (`{q}`, `{url}` and `{sub}` placeholders fit any network's deep-link format).
* **Store programs**: a store's `affiliate` param is added when its env var is set and labelled "Paid link".

## Design — 2026-10-30

"Very professional" read as a calm beauty retailer rather than a deal site: warm off-white, white cards with
hairline borders, near-black pill buttons, one berry accent, green for savings, Fraunces headings with Inter text,
no emoji. The DexCompare-style side panel shows from 1024 px (lg), not 1280 px as on FigureCompare, because Bill
asked for it specifically; the phone menu draws the same groups.

## Stores — 2026-10-30

45 Shopify stores from the probe rounds: US 12, CA 13, AU 7, UK 5, EU 6, NZ 2. Left out: shops with no readable
barcode (Mirai Skin, RoseRoseShop, Olive Kollection, Korean Beauty Australia, Lewkin, AmiGlow), mirrors
(boniik.com.au, sentisenti.com, kiyoko.ca) and shops pricing in CHF or DKK. Shops that also sell other beauty
(Justmylook, Boozyshop, DODOSKIN …) are `mixed`: only known Korean brands get a barcode lookup there.

## 2026-10-30: kaeyoung.com, and eBay and Amazon as the top two price rows

* **Domain** (owner): the site lives at kaeyoung.com (the brand stays "K Young").
* **Pinned rows** (owner): eBay and Amazon take the first two rows of every product's price table, in their own
  button colours (eBay blue, Amazon yellow) with a "Shown first" chip, so they are seen first; otherwise they are
  drawn exactly like a store row (same card, border and type). The beauty retailers follow, then the stores in
  price order. Still labelled "Paid link", never counted as a store, never the cheapest.

## One eBay campaign for every Compare site, hard-coded — 2026-10-30

**Decided (owner).** Every Compare site now sends eBay clicks to ONE EPN campaign, 5339155912 (RiftCompare's,
already set up), hard-coded in the code: no variable overrides it any more, so a forgotten secret or Vercel
value can't split the sites again. The sites are told apart by the `customid` prefix alone, which comes first
in every tag; this site's is `ky-<region>`. 
Replaced: 5339155911 (WargameCompare, FigureCompare, Compare Empire, K Young), 5339231473 (Lorcana),
5339231474 (Gundam), 5339234013 (YGO). Old secrets/variables (`EBAY_AFFILIATE_CAMPAIGN`,
`NEXT_PUBLIC_EBAY_CAMPAIGN_ID`, `EBAY_CAMPAIGN_ID`) are no longer read and can be deleted.
## 2026-10-30: 90 stores (owner: "we need more stores … over 150")

Rounds 3 and 4 of the store probe added 45 shops with readable Korean barcodes: 20 brands' own US shops (COSRX,
Beauty of Joseon, Anua, SKIN1004, TIRTIR, Torriden, Klairs, innisfree…, their official prices) and web-searched
specialists and pharmacies in every region. A shop passes with a region currency, 15+ K-beauty products and 10+
880 barcodes in the probe sample; shops whose K-beauty is under 60% of their catalogue are `mixed`. Same stock on
two domains is added once (yepposoonsoo.de is yeppo.fi; koreanskincare.nl is korean-skincare.nl). Round 4 was cut
short at 103 of 298 candidates to free runners for the first import; the rest are probed next.

## 2026-10-30: a prettier, standalone K Young, with a blog

* **Look** (owner: "make this site look a lot better … more colorful and pretty … light themed"): pastel palette,
  drawn product illustrations in the hero, step tiles and post cards, a rose-to-peach logo, washes behind page
  heads; light unless the visitor chooses night (the OS setting no longer decides).
* **Side panel** flush to the window's left edge (owner: "there's a big gap"), the page no longer centred in 1440px.
* **No sister sites** (owner: "this is just Korean beauty"): the footer's family list is gone and a test keeps it out.
  This is the one exception to the family-links rule.
* **Blog**: six posts written around live price blocks (brand stores vs shops, a priced routine, sunscreen, the
  biggest gaps, three bestseller brands, avoiding fakes). Stores gain `official` for the brands' own shops.

## 2026-10-30: 138 stores (probe round 4b)

The other 195 round-4 candidates were probed: 48 shops passed the same rule (region currency, 15+ K-beauty
products, 10+ 880 barcodes; `mixed` under 60% K-beauty) and were added, with MISSHA, LANEIGE, Sulwhasoo and haruharu
US as official brand shops. Australia goes from 7 to 17 stores and New Zealand from 4 to 5. Left out as the same stock as a listed
shop or another candidate: hikoco.com (hikoco.co.nz), kiyoko.com (kiyokobeauty.com), sukoshi.com (sukoshimart.com),
moidaus.com (bloomingkoco.com), skincupid.us (skincupid.co.uk), yepposoonsoo.com (yeppo.fi), koreanskincare.com and
korean-skincare.fr (korean-skincare.nl), asiangroceronline.com.au (umall.com.au), cosmeticsonline.co.nz
(cosmeticsonline.net.au). Also left out: shops that charge a region's currency but ship from elsewhere
(piyonna.com from Singapore, mediheal.com from Korea, silverglass.co from New Zealand in US dollars), and
bellaviacanada.ca (15 codes, a UK shop).

## 2026-10-30: quick view, and a page that appears at once

Owner: "leverage the quick view popup like we have on RiftCompare … bring the users to the page first then load the
prices … make the lag seem less". A plain click on a product tile now opens a quick view right away, using what the
tile already shows (photo, brand, name). Every store's price then loads from `/q/<slug>`, a static JSON (about 6 KB)
written at build by a `force-static` route. Opening one reads a file from the CDN, never a function. The file is
fetched ahead when a mouse rests on a tile. Its rows come from `priceRows()`, the same rows the product page draws:
eBay first, Amazon second, then the stores by price. The tile is still a real link, so crawlers, new tabs and
modified clicks reach the product page, whose server HTML keeps every price for Google. Clicking through to a
product page shows its skeleton (`loading.tsx`) at once while the static page loads.
## Precision, families, Korean names and advice posts — 2026-10-30

**Owner:** "this website is a bit more delicate … the Korean language … many small differences in specification
between products … thousands and thousands of these products … maximum effort … reduced cost in Vercel … a lot of
these blog posts offering opinions, advice, and ideas … this site would mainly be dominated by females."
Strategy doc: https://claude.ai/artifact/Fn5uYBzekUHBXdZrrmpRyu

* **A barcode is trusted only when its listings agree on the pack** (`sameSize` in `merge.ts`). The first import
  had 76 region rows with two stores more than 3x apart, mostly one sheet mask filed under the box of ten's
  barcode. Sizes are compared in two dimensions, amount (ml, g and oz as one, within 10%) and count (sheets,
  pads, pcs); the size most stores name wins, a tie drops the barcode. A title naming two packs counts as
  unknown unless the variant's own trailing brackets say which. And with exactly two stores in a region more
  than 3x apart, neither price is shown there: one is wrong and we can't tell which.
* **One brand spelling across the catalogue**, decided from every listing before products are built.
* **Names lose shop flags** ("NEW*", "CLEARANCE*"), shade counts ("(11 Colors)") and "1 pcs"; "mini*" becomes "Mini".
* **Families, not merged pages.** Every size and shade keeps its own barcode and page; `variantsOf`/`familyKey`
  (same brand, same name without size, bracketed shade or shade number) only links them with chips. A mini or a
  refill names itself and stays apart. Two variants that read the same are told apart by their barcode's end.
* **Korean only where checked.** Store titles carry no Hangul, so Korean appears as the brand's own Korean name
  (`src/content/brands-ko.ts`, ~100 brands, about 78% of products) and as search words (`SEARCH_SYNONYMS`).
  Never machine-translated or transliterated by guess.
* **Build cost.** Catalogue indexes (by slug, category, brand, family) are built once per build (`once` in
  `data.ts`), not scanned per page. 9,423 pages build in about 3 minutes locally; each product page is ~150 KB
  raw (~21 KB gzipped, half of it the inline RSC payload). Watch the deploy's output size as stores grow.
* **Advice posts** (`src/content/blog-advice.ts`) are data: prose sections plus live per-region tables picked by
  a name pattern. Opinions rest on what a product's name says it contains, how widely it is stocked and its
  price; no medical claims (`tests/blog.test.ts`), skin-condition posts say patch test and see a dermatologist,
  written as the K Young team.

## 2026-10-30: ratings and reviews, Popular, filters and search suggestions

**Owner:** "users should be able to rate the products … provide feedback and potentially reviews … stars … a popular
section … really good filters … popularity, ratings, type of product, names … in the search bar, like Rift Compare,
some pop-ups that appear."

* **The one exception to "no database, no functions"**: a `reviews` table in a free Neon project of its own,
  written by `POST /api/reviews` and moderated by `POST /api/reviews/admin`. Both are POST-only, so a crawler or a
  page view never runs them; a visit to a product page is still a static file. Why not files only: a review is
  typed by a visitor and has to land somewhere the moment they press Send, and a static site has nowhere to put
  it. Neon over the alternatives: free, Postgres (rate limits and duplicate checks are one query), the family
  already runs it, and the Vercel integration sets `DATABASE_URL` in one click. GitHub (issues or commits) was
  ruled out because the repo is public: spam would be public before anyone moderated it.
* **Pages never read the database.** The daily import (`import.yml`) exports published ratings to
  `data/public/reviews.json` (`scripts/reviews-export.ts`), and the day's build draws them into the product page's
  server HTML with `aggregateRating` and `Review` JSON-LD, so Google reads them. A new review shows the next day;
  the shopper's own browser shows it at once. A failed export keeps the last good reviews and warns.
* **No accounts** (owner): a star rating needs nothing else; words, a name and a skin type are optional. Spam is
  kept out by: POSTs only from our own pages, a hidden honeypot field, a minimum fill time, one rating per product
  and 8 a day per visitor (an HMAC of the IP, never the IP), 400 a day site-wide, and Cloudflare Turnstile once
  `NEXT_PUBLIC_TURNSTILE_SITE_KEY`/`TURNSTILE_SECRET_KEY` are set.
* **Moderation: rules first, the owner for what they flag.** The growth thread advised holding every review for
  the owner; the owner is not watching, and a review that waits days kills the habit of writing one. So a bare
  rating and a clean review publish at the next export; anything with a link, an email, a phone number, promo
  words, slurs, shouting, repeated characters, a medical claim ("cured my eczema"), a shop-like name or text
  already posted elsewhere is held for `/admin/reviews` (key `REVIEWS_ADMIN_KEY`, typed on the page, never in a
  URL). Every review has a Report link (an email). Ops monitor warns once a day (the 09:50 UTC run) while reviews
  are held: one daily count, never a mail per review.
* **Schema only from a real sample**: `aggregateRating` from 3 ratings (`SCHEMA_MIN_RATINGS`); fewer show on the
  page without markup. Ratings are labelled as visitors' opinions, not verified purchases.
* **External reviews: not copied.** Store and Amazon review texts are their authors' and the platforms'
  (Judge.me, Yotpo, Okendo and Amazon's terms forbid reuse), and Google ignores ratings marked up from other
  sites. Revisit only with a licensed feed.
* **Ratings never order prices.** They only order lists of products.
* **Popularity** (`lib/ratings.ts`): stores stocking it in stock (+¼ for sold-out stores), plus
  log2(1 + ratings) × how far the average sits above 2.5★. Click data would be better but Vercel Analytics can't be
  read back; a click beacon would be a function call per click, so it waits until traffic justifies it. Category
  pages, the home page's "Popular" row and `/popular` use it.
* **Filters, sort and suggestions run in the browser** over `/search-index.json` (now with brand, rating,
  popularity, first-seen date and the brand's Hangul name; ~320 KB gzipped) and `/search-images.json` (photo paths,
  ~180 KB, loaded after it). Category and brand pages keep their server-rendered list for crawlers and first
  visits; the client list replaces it only once a control is touched. `/search` is noindex as before.

## 2026-10-30: Price guides get their own share cards (for the Reddit launch)

The owner asked for K Young's Reddit launch posts to link a page with "a nice and appropriate thumbnail". Every page
shared the one brand card, so a post about Australian prices showed a slogan, not the insight.

* **Each price guide draws its own card** (`src/app/guides/[slug]/opengraph-image.tsx`, `src/lib/og/`): the
  region's best-known products where the same barcode and size costs clearly more at one store than another, the
  cheapest store and price, the dearest price and the saving. Category guides use US prices. The region guide
  shows the same rows at the top ("Same product, different price"), so the click lands on what the thumbnail
  promised.
* **Prerendered at the day's build** (`generateStaticParams` + `dynamicParams = false`), never a function, like the
  pages (`tests/share-card.test.ts`). Fonts are bundled WOFF files (Fraunces, Inter; OFL licences beside them),
  never fetched at build.
* **Rows a reader can trust** (`shareRows`): 3+ stores in stock (2 in New Zealand), a gap between 15% and 60%
  (over 60% is more often a flash sale or a listing worth a second look, and Reddit keeps a thumbnail forever),
  one product per brand, the products stocked by the most stores anywhere first. The card names only the
  cheapest store, never the dearest one (r/AusSkincare forbids negative mentions of businesses by name, and it
  is fairer anyway).
* **Text only**: no product photos (the stores' own, not ours to put on a card) and no brand packaging.
  `npx tsx scripts/og/guide-cards.mts <dir> [slug…]` draws them to PNGs for a look before a post goes out.

## 2026-10-30: Answering the r/AusSkincare thread (delivery, basket, big retailers, honest blog dates)

The launch post drew four fair points: check YesStyle and Stylevana, does "cheapest" include delivery, can it
compare a whole basket, and are 17 posts dated the same day reviewed for accuracy. The owner asked for all of
them to be addressed.

* **YesStyle and Stylevana always show**, in their own labelled group under the eBay/Amazon rows ("Big K-beauty
  retailers that deliver to Australia"), as search buttons: we can't read their prices (no feed), so they are never
  ranked, never a store and never "the cheapest". Until their programs accept us they are plain unpaid links
  (`Partner.always`); once `AFF_*` is set they say "Paid link". Other partners still appear only once paid.
* **Delivery is each store's own quote** (`scripts/shipping.ts`, `shipping.yml`, Sundays 02:37 UTC): its Shopify
  cart's shipping rates for a small order to one city per region (EU stores: their own country, from the domain),
  then bigger baskets until delivery turns free (the next cheapest item takes over when one runs out of stock),
  halving the gap. Eight runners, one store at a time each, since Shopify rate-limits carts by address; a 429 is
  waited out twice, then the store is left for the week. Rates that name a date or promotion are ignored. We store what we SAW: the fee, the smallest
  basket that went free and the largest still charged (`data/public/shipping.json`); between the two we say "or
  free", never a guessed threshold. A failed store keeps a quote under five weeks old. Nothing is bought; carts are
  abandoned; 403/429/captcha stops that store. The commit has no `[deploy]`: it rides the daily release. The ops
  monitor warns when quotes are over nine days old or cover under 30% of stores.
* **Item price stays the sort order.** Delivery is a line under each store, a "with delivery for one item, X works
  out cheapest" note on the product hero when it changes the answer, and the basket's totals. "Cheapest store"
  became "Lowest item price" so the badge says what it measures.
* **The basket** (`/basket`, `lib/basket.ts`) runs in the browser over `/search-index.json` and one static
  `/basket-data/<region>` per release (force-static, offers in index row order), so it costs no function. The
  basket lives in localStorage only. Stores with the whole basket and a known total come first; items no store in
  the region stocks are left out and said so.
* **Honest blog dates.** The owner asked for random past dates on the posts; we did not backdate (a reader had
  already noticed the dates, and a fake publish date is the kind of thing that ends trust in a price site and
  that Google treats as a quality problem). Instead `Post.date` is the real release date and a future date holds a
  post back (`LIVE_POSTS`, `isLive`): eight posts stay out from 30 Oct, the other nine come out twice a week from
  3 Nov to 1 Dec. `updated` shows when the text is revised. `tests/blog.test.ts` fails on a date before launch or
  a live post linking one not yet out.
* **Sources and an accuracy pass.** Advice posts cite where their facts come from (AAD, a dermatologist's
  summaries, peer-reviewed reviews, MFDS rules via ChemLinked, the CTPA); claims the sources don't support were
  softened (heartleaf "oil-balancing" is marketing; snail evidence is early; PA came from Japan). Each post ends
  with "How this post was made" and a correction address. The fake-K-beauty post now says eBay and Amazon rows
  exist, rather than claiming we list no marketplaces.
* **Disclosure in plain words.** `/disclosure` is "How we make money": which rows can pay, that no store in the
  comparison pays us today (computed from `STORES`), and what commission never does. Product pages and /about say
  how fresh prices are and where to report a wrong one.

## 2026-10-30: reviews move from Neon to a private GitHub repo

**Owner:** "for the reviews we want to remove the dependency on neon … just store it in the github securely."

* **Where:** one file, `reviews.json`, in the private repo `Specifxx/kaeyoung-reviews` (`REVIEWS_REPO` overrides).
  `POST /api/reviews` reads it through the GitHub contents API, applies the same limits and word rules, appends the
  review and writes it back with the blob sha; a write race (409/422) re-reads and retries up to four times. The
  moderation route flips a review's status the same way. Commit messages carry only the id and status.
* **Why a private repo, not this one or a data branch:** Kaeyoung is public, so a branch here would publish held spam
  and the hashed IPs before anyone moderated them; that was the reason GitHub was ruled out in "ratings and reviews".
  A private repo removes that objection and the database with it. Encrypting rows into the public repo was the other
  option: more code, and a leaked key would expose every past review.
* **The token** (`REVIEWS_GITHUB_TOKEN`) is a fine-grained token with Contents read/write on that one repo only, set in
  Vercel (the form) and as a GitHub secret (the import's export and the ops monitor). It is read only by
  `lib/reviews-store.ts`; `lib/ratings.ts` only asks whether it exists at build to show the form. The ops monitor
  reads the store once per run and warns 14 days before the token expires (GitHub's expiry header).
* **One file, not a file per review:** every check (one rating per product per visitor, 8 a day each, 400 a day in
  all, copied text) needs the whole list, and one file is one read. At ~400 bytes a review it stays under 1 MB until
  ~2,500 reviews; past that the store reads the blob API (up to 100 MB). Revisit at ~20,000 reviews.
* **Migration:** none needed. `data/public/reviews.json` never existed on `main`, so `REVIEWS_DATABASE_URL` was never
  set and no Neon review was ever exported; the Neon driver and `REVIEWS_DATABASE_URL`/`DATABASE_URL` are gone.

## 2026-10-30: reviews live on the public repo's reviews branch

**Owner:** "just make the reviews in the public repo. Reviews should be public and if they aren't intended to be
public then they don't have to leave a review." This replaces the private repo from the entry above, which was never
set up.

* **Where:** `reviews.json` on the `reviews` branch of `Specifxx/Kaeyoung` (`REVIEWS_REPO`/`REVIEWS_BRANCH`
  override). A branch, not `main`: each review is a commit, and on `main` it would race the daily import's push and
  fill the history. `vercel.json` never deploys the branch, CI runs only on `main` and pull requests, and a review
  commit's subject never carries `[deploy]`.
* **Nothing about a reviewer is stored**, because every line is public, held and hidden reviews included: no IP,
  no hashed IP, no email. That loses two checks that needed a stored visitor key: "one rating per product per
  visitor, ever" and "8 a day per visitor". Both now live in the function's memory (`visitorLimit`), which a cold
  start forgets. What still stands: same-site POSTs, the honeypot, the minimum fill time, Turnstile once its keys
  are set, the 400-a-day site-wide cap, copied-text detection and the word rules that hold a review for
  `/admin/reviews`. If a flood gets through, switch on Turnstile first.
* **The trade-off accepted:** a held spam review is visible on the branch until it is hidden (and stays in git history
  after), but never on the site: the export publishes only `published` reviews.
* **Tokens:** Vercel holds `REVIEWS_GITHUB_TOKEN`, a fine-grained token with Contents read/write on this repo (it
  cannot be narrowed to one branch). The import and the ops monitor read the branch with their own `github.token`, so
  no GitHub secret is needed. GitHub emails the owner before the Vercel token expires.

## A contact page — 2026-10-30

The owner: "make sure that contact information is really clear on all of our websites so that any feedback feeds
into the respective emails". The footer already showed compareempire@gmail.com (`SITE.email`); there was no page to
link. `/contact` (static, in the sitemap) gives the address with subject-filled mailto links (wrong price or product,
stores, missing products, review removals, press), and the footer links it. Still no message form, and ratings still
email nobody.

## eBay keyset live: home page, popular and new first — 2026-10-30

The owner's new eBay keyset (5,000 Browse calls a day) is split 2,500 to K Young and 2,500 to CamCompare, with
front-page, popular and recent products first. `planEbay` (`src/lib/ebay.ts`) ranks each (product, region) pair:
tier 0 is what the home page shows in that region (popular, savings and new arrivals, 8 each), refreshed daily;
tier 1 is the top 300 of /popular per region and anything first seen in the last 30 days (not the launch-day
catalogue, which was all first seen on one day), every three days; tier 2 is the rest, weekly. Due pairs go first by
tier; budget left over goes to pairs not yet due, oldest check first, so no call of the day is wasted.

The 2,500 is per eBay quota day (midnight Pacific, `ebayQuotaDay`), recorded in `meta.ebay.qday`/`qcalls`, so a
manual run on the same day spends only what is left. `import.yml` takes `stores: false` for an eBay-only run on the
committed products (minutes, not hours), used to put eBay rows up right after the keys are set. The app's one
Marketplace Account Deletion endpoint is K Young's `/api/ebay/marketplace-deletion`.

## 2026-10-31: wrong-price reports and store suggestions go to a private GitHub repo

**Owner:** "for all of these websites … we must have the ability to report any prices that are wrong, for users to
suggest a store … it's just stored within the GitHub … a daily job that checks for that."

* Every Compare Empire site now has the same two forms: **Report a wrong price** (a quiet link under the price table
  that opens in place, never a pop-up) and **Suggest a store**. Both POST to `/api/report`
  (`src/lib/reports-github.ts`, `src/components/ReportForms.tsx`: the same two files in every site repo).
* They are filed in ONE **private** repository, `Specifxx/compare-reports`: one new JSON file per report at
  `inbox/<site>/<day>/…json`, created through GitHub's contents API with `REPORTS_GITHUB_TOKEN` (a fine-grained token
  with Contents read/write on that repo only, Vercel only). Private because the site repos are public and a note is a
  stranger's free text; the K Young reviews branch is public because reviews are meant to be read.
* Nothing about the visitor is stored: no email field, no IP, no hash of one (the per-visitor limit, 6 an hour, lives
  in the function's memory), and email addresses, IP addresses and phone-like numbers in a note are blanked before
  the write. A honeypot field swallows bots.
* Each write creates a new file (no read, no sha), so reports never race, and the commit subject never carries
  `[deploy]`/`[preview]`. The route is POST only: no page view or crawler runs it, so it costs nothing at rest.
* A daily job in that repo (`triage.yml`) keeps one issue per site listing what is still open, flags repeat
  reports of the same product and store, and warns before the token expires. A handled report is moved to
  `done/<site>/`. Until the token is set the route answers 503 and the form says to email the site's address.

## Visitor reports live on each site's own `reports` branch, not a private repo — 2026-10-31

**Owner:** "we don't need a private repo for this … just build it into each site … inside the public GitHub, it's
fine. As long as it's not reflected on the front end." This replaces the private `Specifxx/compare-reports` repo
of the entry before it; everything else in that entry (the forms, no email/IP, redaction, new file per report,
POST only, 503 until the token is set) still holds.

* Each site writes its reports to **its own repo**, on an orphan branch named `reports` (`SITE_REPOS` in
  `src/lib/reports-github.ts`): `inbox/<site>/<day>/…json`, moved to `done/<site>/…` once handled. The branch is
  never merged into `main` and never deploys: `git.deploymentEnabled.reports = false` in `main`'s `vercel.json`
  (pinned by `tests/reports-github.test.ts`) and the branch's own `vercel.json` turns deploys off as well.
* Nothing on any site reads the branch, so no report ever shows on a page. The branch is public with the source,
  which is why nothing about the visitor is stored and notes are redacted before the write.
* One token, `REPORTS_GITHUB_TOKEN` (fine-grained, Contents read/write on the twelve site repos only), set in each
  Vercel project for Production.
* The daily triage moved to RiftCompare (`Specifxx/TCGEmpire`): `.github/workflows/reports-triage.yml` reads all
  twelve `reports` branches through the API and keeps one issue per site there, plus a once-a-day "Reports digest"
  comment. Those issues are public, so they link to each report's file and never quote a note. It fails (and
  GitHub emails the owner) when a site has no `reports` branch, or the token stops working or expires within 14
  days (checked only when the token is also a TCGEmpire Actions secret). The ops monitor's job list watches it.

## eBay: local sellers, delivered prices (2026-10-31)

A WargameCompare visitor's feedback (the owner passed it on for every sister site): eBay rows from overseas sellers
carried postage that made "a lot of wasted clicks". The pass keeps sellers in the region's own
country (`localSeller`: the region's own country, any EU country for the EU) and sends the buyer's country and a central postcode as `contextualLocation`, so eBay quotes real postage.
`ebayPick` keeps only a listing whose postage eBay states and stores the DELIVERED price (`p` = item + postage, `sh` the
postage); the price table says "incl. postage". Sellers in Korea, the products' home country and often the cheapest genuine source, stay
for every region (owner, the same day), priced with their postage like any other row; so the search asks only for
`deliveryCountry` and `localSeller` does the rest. Rows stored before this have no `sh` and are hidden (`getEbay`), and
the next eBay pass searches them first. Same change as FigureCompare.

## No toners and pads on the homepage (2026-11-01)

The owner: "get rid of toners and pads from the homepage … we don't want to scare away male users." The homepage's
"Shop by step" tiles are now their own list (`HOME_STEPS`, `src/app/page.tsx`) instead of every category: the basics
anyone uses lead (cleansers, moisturisers, sunscreen, serums, body & hair), and "More K-beauty" (sets, tools, gifts,
257 products) takes the toner tile's place so the grid stays two full rows of five. The `/toners` hub, its nav entry,
guides and search stay: toners are still there for anyone who looks, just not the homepage's face. The category is
now called "Toners" (not "Toners & pads"; the hub still describes pads), and the side panel and phone menu list steps
basics-first (`STEP_MENU_ORDER`, `src/site.ts`) with toners mid-list and makeup and lip care last; `CATEGORIES` keeps
routine order for everything else. Popular,
deals and new arrivals stay data-driven. The rest of the homepage copy was checked and is already gender-neutral.
`tests/site.test.ts` pins it.

## A professional Holiday Edit: 1 November to Boxing Day (2026-11-01)

Owner, 2026-11-01: every Compare site gets a Christmas theme after the Halloween one, each its own take. Owner, 2026-11-01: "less gamified, professional Christmas". So none of the sister sites' Santa hats, lights, trees or candy canes (`tests/season.test.ts` pins their absence): a gold-and-rose hairline under the header, a warmer hero wash, sparse rose and gold snow, three slowly turning gold flakes beside the hero art, and a "The Holiday Edit" pill in Fraunces italic to the gift-set post (from its 6 November release) or deals. The same day the owner approved the rest but asked for K Young "a little more festive": a Christmas tree, two stockings on gold threads and a candy cane by the hero art, drawn flat in the site's own pastels (`public/xmas/ky-*.svg`), never the sister sites' cartoon art or a Santa hat.

The season window is fixed in `src/lib/season.ts`: 1 November to 26 December, every year, by the visitor's own
date, stamped on `<html data-season>` by an inline boot script before first paint. `?season=christmas` previews it out
of season and `?season=off` hides it in season. Every decoration is CSS-gated on that attribute, `aria-hidden`,
`pointer-events: none`, painted under the content (never over a price or a button), animated with `transform`
only, and stopped under `prefers-reduced-motion`. The page's content and links stay in the server HTML; the season
adds no request, no script beyond the boot line and no database or data read. The rules are the `ky-holiday`, `ky-snow` and `ky-flake` blocks at the end of `globals.css`, not the sister sites' shared `xmas-common` block. To end it early, move the `to` date; after
Boxing Day it switches itself off.

## 2026-11-01: A beta community forum, no accounts, posts in this repo

The owner asked for "user forums ... you don't need to be able to sign in ...
put your name down ... it'll save your name ... all of this is public data ...
keep it within each website's repository", on every site, to give the sites a
reason to come back that search rankings alone don't. `/forum` (docs/forum.md):

- **Storage:** `forum.json` on this repo's public orphan branch `forum`
  (never deployed: its own vercel.json, plus `deploymentEnabled.forum: false`
  here). Written only by `POST /api/forum` with the visitor-reports token;
  a write reads the file's sha and retries when two posts race.
- **Cost:** pages read the file from raw.githubusercontent.com inside their
  normal cache life, never per visit; the browser fetches the newest copy from
  GitHub directly, so a new post shows in minutes with no deploy, no function
  and no database. Rebuilding pages for posts would have meant a build per post.
- **Spam:** honeypot, a 2.5 s minimum on the form, per-visitor limits (4 per
  10 min, 20 a day, 4 threads a day) and a per-instance cap, all in memory; no
  IP, email or hash is stored, and emails/IPs/phone numbers in posts are
  blanked. Links to other sites and slurs or strong profanity are HELD (filed
  under `held/` and flagged in the daily reports triage), never published.
- **Not dead when empty:** the site's topics with a line and a few prompts;
  never an invented post.
- **SEO:** threads are in the server HTML; a thread is noindex until it has a
  reply, the forum page until any thread has one; indexed threads carry
  DiscussionForumPosting JSON-LD.
- **Moderation:** the owner asks Claude; a post is removed by an edit to
  `forum.json` (`removeFromForum` in `src/lib/forum/core.ts`).

## 2026-11-01: the brand is KaeYoung, one word, like the domain

Owner, 2026-11-01: "make the name K Young officially KaeYoung … it needs to be consistent with the domain name."
Every place the site names itself now says **KaeYoung**: `SITE.name` (titles, `og:site_name`, JSON-LD), the header
logo and its label, the footer, the share image and the guide share cards, the blog and advice posts (queued ones
included), the forms and their errors, the review default name ("KaeYoung shopper", applied when ratings are exported,
so already published reviews pick it up at the next import), and the docs. The tagline stays **"Stay young."**: the
pair now reads "KaeYoung, stay young", which keeps the original rhyme with the one-word name. The logo mark (a "K") is
unchanged. Earlier entries keep "K Young" where they record what was said at the time. The forum still reserves
"k young" as a name, so nobody can post as the old brand.

## 2026-11-01: eBay and Amazon rows look like store rows; eBay calls aim for coverage

The owner, looking at the quick view: "the ebay and amazon links should blend
in and look exactly the same as the other price rows", "estimate the price of
the ebay listing", and "rotate the ebay API to aim for coverage across products
so some products only get ebay prices refreshed every week". Later the same
day, for every site: "prioritise the US".

- **Rows:** eBay and Amazon keep the top two places (2026-10-30) but are drawn
  by the same `Row` as a store: white card, the pink Shop button, "Paid link"
  in the line under the name. The blue and yellow brand buttons are gone
  (`btn-ebay`/`btn-amazon` deleted; `tests/ebay-history.test.ts` pins it).
  They are still never counted as a store, never "Lowest item price".
- **eBay's price:** where the last search found a listing, the row shows its
  delivered price as "from US$x" ("New, incl. postage"):
  listings sell and change between searches, so it is a "from", not a quote.
  No listing found means a search link with no price; we never invent one (no
  conversion from another region, no guess from the store median).
- **Why there were none on 1 November:** the 31 October run used the code from
  before the local-sellers-and-postage rule, so all 1,646 rows had no postage
  and `ebayRowShown` hid every one. The import already re-searches those first.
- **Rotation (`planEbay`):** about 31,700 (product, region) pairs, 2,500 calls a
  day. A pair with a listing is searched again after 1/3/7 days (home page /
  popular or new / the rest: the weekly refresh); a pair whose search found
  nothing after 2/7/21 days (`EBAY_EMPTY_RECHECK_DAYS`), because a barcode with
  no local listing seldom gains one within the week, and those calls are better
  spent on products never searched. Among due pairs of a tier, never-searched
  go first, then the US. A full first pass takes about twelve days.

## 2026-11-02 — Black Friday page

`/black-friday` shows today's deals per region (`dealsIn`, the same tiles as `/deals`) under a Black Friday heading, at
one URL kept every year so links and rankings carry over. It has to be indexed weeks before the day (27 November 2026),
so it ships now; the footer and sitemap link it all year. Prerendered at the daily build like every page. Never a "was"
price of our own, a countdown, "ends soon" or an invented sale. Dates are pure (`src/lib/black-friday.ts`, tested). Part
of the passive-growth plan (owner, 2026-11-02: no daily Reddit posts).

## 2026-11-02 — Free link badges

`/widgets` gives blogs, routine guides and stores plain-HTML link badges (a product, a category, "our prices are
compared here") that the daily outreach offers instead of asking for a link (passive-growth plan, owner 2026-11-02).
No live price iframe like the card sites': that needs a function or a script, and this site is fully static. Each badge
is one `<a>` with inline CSS (`src/lib/link-badges.ts`, tested), so the link sits on the other site's page.

## 2026-11-02 — Self-updating price report

`/price-report` is one page, kept at one URL, prerendered at each daily build from that day's prices: per region, how
many stores and products are on sale, the typical gap between the cheapest and dearest store for the same barcode and
how often it is 10% or more, and the median price of a product per category. It is the citable asset the daily
outreach offers beauty writers (passive-growth plan, owner 2026-11-02), with a quote line. Pure numbers in
`src/lib/price-report.ts` (tested).
## 2026-11-02 — The monitor reports to Empire HQ; only red mails

The owner asked for one Monday email instead of a mail per site (the control tower, approved 2026-11-02). The ops
monitor now writes every result to `ops-status.json`, and its workflow force-pushes it as `status.json`, one orphan
commit, to this repo's public `ops-status` branch (never deployed, `vercel.json`). RiftCompare's ops monitor reads it
every three hours for Empire HQ (riftcompare.com/admin/hq) and the one Monday report, and mails the owner itself if
the file goes quiet for a day (a stopped monitor cannot mail). Only a FAILED check fails the run, which is GitHub's
email to the owner; warnings wait for HQ and Monday. The file carries status and the monitor's own sentences only,
the same as the public Actions log.

## 2026-11-02 — Seasonal sale pages

`/boxing-day`, `/january-sales`, `/lunar-new-year` and `/valentines-day` (owner-approved growth plan, 2026-11-02):
one URL each, kept every year like `/black-friday`, built weeks ahead so they are indexed before the day, with
the Black Friday page's rows (`dealsIn` per region, every region in the HTML, CSS showing the visitor's) from one
component, `src/components/SaleSeasonPage.tsx`, prerendered at the daily build. The intro names every region we
cover, never one country. Dates, the year a page is about (it rolls over a week after the event) and the intro are
pure in `src/lib/sale-seasons.ts` (`tests/sale-seasons.test.ts`); Lunar New Year is a published-date table to 2040
(6 February 2027). Footer and sitemap. Never a "was" price, a countdown or an invented sale.
