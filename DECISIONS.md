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

## 2026-11-02 — Share buttons and shared baskets

The owner wants word of mouth to be a big growth driver on every site (RiftCompare's DECISIONS has the twelve-site
entry). Client-side only, no new function:

- **Share button** on product pages and in the quick view: the phone's share sheet, else link and message copied. No
  pop-up, no reward. The message (the real gap between the cheapest and dearest orderable store in each region,
  `lib/share-texts.ts`) is written at build into the page and the quick view's static JSON; the button picks the
  visitor's region from `data-region`. No per-product share image (thousands at build).
- **Shared baskets**: `/basket?b=<slug>,<slug>…` carries the basket in the link (slugs are kept forever). It opens as
  "A shared basket", read-only, beside "Save it as my basket"; the visitor's own basket is never overwritten without
  that tap. Each item now shows its cheapest in-stock store in the region (`cheapestOf`). A shared basket adds a
  `noindex` robots meta (the page itself stays indexable; canonical `/basket`).
- **Counting**: every shared link carries `utm_source=share&utm_medium=<product|basket>`; the button sends a Vercel
  `share` event, `ShareArrival` one `share_visit` per tab, and RiftCompare's weekly growth report counts both.
  robots.txt allows `/*utm_source=share` because X's and Reddit's preview fetchers obey it.

## 2026-11-02 — Amazon Associates: following the Operating Agreement's Dos and Don'ts

The owner sent Amazon's own "Operating Agreement: Top Dos and Don'ts" page (2026-11-02: "make sure you
are following these instructions for all amazon affiliates"), and every site was audited against it.
The rules we keep, on every Compare Empire site:

- **Disclosure beside every Amazon link** ("Ad" / "Paid link"), and Amazon's statement "As an Amazon
  Associate I (we) earn from qualifying purchases." in the footer of every page.
- **Amazon's trademark notice** in the footer of every page: "Amazon and the Amazon logo are trademarks
  of Amazon.com, Inc. or its affiliates." No Amazon logo, screenshot, review or Amazon's own colours
  (its orange): the page "Don't use style or color of Amazon site which may cause confusion".
- **Links lead to a specific product** (an ASIN, or a search for that exact product's name), never a
  category or generic search: "All the links or buttons on your site should take customers to specific
  products on Amazon."
- **No Amazon link in a pop-up or layer**: the quick views show none; product pages carry the row.
- **Never Amazon prices in price tracking or alerts** ("Don't track prices or set price alerts"), and no
  Amazon link or trademark in any email, SMS or printed material.
- Every link tagged, rel="sponsored nofollow"; no incentive (cashback, discount) for buying through it.
- Here: the footer gained the statement and trademark line; the quick view rows (/q) have no Amazon row.

## 2026-11-02 — The region chooser in the home hero, with drawn flags

Owner: "the region switcher must be more prevalent … on the main home page hero etc … and have the flags as
well". The home hero has a "Prices for" row of every active region as a flag chip, above the search
(`RegionChips` in `RegionPicker.tsx`, the same `setRegion` as the header), replacing the small select in the
stats row. The header menu shows the region's flag and code with the native select laid invisibly over them;
the in-page region tabs, the phone menu and /stores carry flags too.

- **Flags are inline SVG (`src/components/Flag.tsx`), never emoji and never image files.** Windows draws a
  flag emoji as two letters; image files would be new requests and hosting. Codes, not names, in the hero:
  six names do not fit the hero column; the name is the title and the screen-reader text.

## 2026-11-02 — At most one production build every 12 hours, and no branch but production deploys

**Why.** The owner capped Vercel spend at $5–6 a day across every site. 1 November cost $11.82 (normally
$2–4), and Build CPU was the largest line ($4.26), followed by CDN requests and ISR writes, which every
build multiplies (a deploy empties the page cache, so the next crawl re-renders and re-writes every page).
The `[deploy]` gate itself held; its premise did not: sessions landed 7–14 `[deploy]` commits a day per site
(manual "release now" runs and `[deploy]` in merge subjects), RiftCompare, OP, MTG and DexCompare alike.
Compare Empire's site built on every push to its production branch (84 commits that day) and CamCompare on
every three-hourly price commit, because neither had the gate.

**What.**
- `scripts/vercel-ignore-build.sh` skips a production `[deploy]` commit when the last production
  deployment (`VERCEL_GIT_PREVIOUS_SHA`, set by Vercel in that step) is under 12 hours old; the commit
  rides the next release. `[urgent]` in the SUBJECT overrides it, and only when the owner says a release
  cannot wait. An unset or unreadable last deployment builds (fail open). `tests/deploy-gap.test.ts` pins it,
  and the file is the same in every Compare Empire repo.
- `vercel.json` `git.deploymentEnabled` starts with `"**": false` and enables only the production branch
  (Vercel: when a branch matches several rules, any `true` wins). No preview is built for any branch or pull
  request, `[preview]` included; the older per-branch `false` entries stay for orphan commits' own copies.
- So "push to prod" means land on the production branch; the release reaches visitors within a day.

## 2026-11-02 — products.json is written compact

**Why.** The ops monitor warned that `data/public/products.json` was 15.5 MB (10,969 products, 91,034 offers).
Three quarters of it was the offers, and most of each offer repeated what the store list already knows: the
store's own `https://<base>/products/` prefix, the `"s"/"p"/"st"/"u"` keys and `"in"`. Every image repeated
`https://cdn.shopify.com/s/files/`. Raising `minStoresPerRegion` would have cut real products the owner wants.

**What.**
- `src/lib/products-file.ts` is the only code that knows the file's shape. Version 2 (`"v": 2`) keeps each
  product an object but stores an offer as `[store, cents, url]` (`[…, 0]` when out of stock), the URL as the part
  after `<store base>/products/`, and the image as the part after the Shopify CDN prefix. Lossless: the real file
  packs and unpacks to the same `Product[]` (checked on the 2026-11-02 file), and a URL that does not start with
  its store's base is kept whole.
- `scripts/import.ts` writes it with `packProducts`; `src/lib/data.ts` and the import read it with
  `unpackProducts`, which still reads the old shape (no `v`), so the next import converts the committed file
  itself; nobody edits `data/` by hand. The test fixture stays in the old shape and so covers that path.
- The same data is 10.2 MB (−34%), under the monitor's 12 MB line with room for more stores. If it grows past it
  again, the next steps are splitting the file per region or dropping out-of-stock offers older than a week,
  before any store-count rule.

## 2026-11-03: The sitemap starts with widely stocked products

**Why.** The owner asked to drop products nobody wants and focus on what drives demand. KaeYoung has been in
Search Console for three days (1 click, 186 impressions, 2 product pages seen), so there is no demand data yet,
and the 10,996 products cost little: the project's Vercel bill was A$2.95 in the week to 2 November, and pages are
static files. What does hurt a new domain is a large sitemap of thin pages (the family's lesson, `index-tiers.ts`):
Google crawls a little of it at random.

**What.** The sitemap lists products stocked widely, `inSitemap` in `src/lib/index-tiers.ts`: 3+ stores in one
region, or 2+ in two regions (6,459 of 10,996 on 2026-11-03). Stores stock what sells, so that is the demand proxy
until Search Console has some. The other 4,537 (two stores, one region) keep their pages, stay indexable and stay
linked from their category and brand pages; nothing is deleted, nothing is noindexed that wasn't. The same tiered
start as Compare Empire's `SITEMAP_TIER` (2026-10-25). Widen it to every indexable product once Search Console
shows most of this tier indexed; judge with real clicks around 1 December.

## 2026-11-03 — The quick view shows the product's own link

**Why.** Owner: "quickview popup should have a link change as well for all sites, instead of using the same link". The
pop-up kept the list page's URL, so a copied or bookmarked link lost the product, and Back left the page instead of
closing the pop-up.

**What.** Opening a quick view pushes the product page's own existing URL (/product/<slug>) with `history.pushState`
(`src/lib/quick-view-url.ts`, the same file on every site). Back closes it and restores the list's URL, Forward reopens it,
closing it (×, Escape, the backdrop) steps back, so the history never fills with pop-ups. "See price history and details"
only hides the pop-up and navigates to the URL already shown, which Next turns into a replace: Back from the product page
goes to the list. The entry copies Next's own history state (`__NA` and the router tree), so the app router passes the
push through and the page under the pop-up never re-renders.

**SEO.** No new URL exists: the link is the canonical product page, which a reload, a share or a crawler gets in full
server HTML. Never a `?view=` or `#` variant (duplicate URLs, extra CDN copies). Pinned by `tests/quick-view-url.test.ts`.

## 2026-11-03 SEO audit: sitemap index, site schema, breadcrumbs, llms.txt

Bill's network SEO audit found no JSON-LD on the homepage, a 10,405-URL single sitemap and a 66-character title.
`/sitemap.xml` is now a static index of `/sitemaps/pages.xml` and `/sitemaps/products-N.xml` (5,000 products each, widely
stocked first, `src/lib/sitemap.ts`). The homepage carries Organization + WebSite + a printed FAQ with FAQPage, and links
every price guide. Product, brand, step hub, guide and blog pages show a breadcrumb trail with a matching BreadcrumbList
(`<Crumbs>`, `src/lib/seo.tsx`). Product/AggregateOffer already existed on product pages. hreflang is deliberately absent:
every page is ONE URL for all regions (CSS shows the visitor's), so there are no alternates to declare. `/llms.txt` is a
static route. Title: "Korean Skincare Price Comparison: K-Beauty Stores | KaeYoung" (60). `tests/seo.test.ts` pins it.

## Rate KaeYoung and "What people say", run by the shared review service (2026-11-03)

The owner wanted RiftCompare's rating pop-up on every site, each site's reviews public, and every written review approved in
RiftCompare's admin; star ratings count at once. These are ratings of KaeYoung itself, separate from the product reviews on the
`reviews` branch. KaeYoung stores nothing and gains no function: the corner card (`components/site-reviews/RateCard.tsx`, in the
root layout) posts cross-origin to `https://riftcompare.com/api/site-reviews`, and the homepage's "What people say" reads the
score and approved reviews from `https://riftcompare.com/api/site-reviews/kaeyoung` in the browser (public JSON, CDN six hours).
Nothing on the page names a sister site. The card is a small corner card, never on arrival: after 4 pages and 3 minutes or on
return from a store tab, at most three times 14 days apart, always closable; "Rate KaeYoung" in the footer opens it. While no
ad script is on the page it says "We don't run banner ads, so if this helped, please leave us a review." No email asked for,
never review markup.

## 2026-11-03: A Creators page and a homepage bubble, like RiftCompare's

Owner: "having the creators page for all of these sites as well is really, really good. Like just a bubble and then a
really nice formatted creators page, just like how RiftCompare does it", and KaeYoung "should definitely get a creators
page despite no branding": word of mouth from creators and visitors is its only growth channel.

`/creators` is RiftCompare's page in KaeYoung's look, without the parts that need a database: the list is the static
array in `src/lib/creators.ts` (empty until the first creator agrees; the grid shows "Your channel here" spots, never an
invented creator), applying is a pre-filled email to `SITE.email`, and there are no creator codes. "Buy them a coffee" is
the creator's own Ko-fi, Patreon or tip page: the site never handles the money. No emoji or brand packaging (the design
rules): the marks are a sparkle and a coffee cup, drawn inline. `CreatorsCornerBadge` is the bubble in the homepage hero
(top-right from sm, a pill above the holiday line on a phone); the side panel's "More", the footer and the sitemap link
the page. Prerendered like every page. Still no sister-site link anywhere, and not called "partners": that word means the
affiliate links.

## 2026-11-04: 159 stores (probe round 5, the big-store gap research)

Owner: "ensure all big stores are captured with no gaps … I don't have domain knowledge outside of Australia". A
research pass per region (trade press, Trustpilot counts, r/AsianBeauty and the country "where to buy" guides) named
142 shops not on the list; the probe (`probe/summary.md`) found 48 readable Shopify shops, and 21 passed the round-4
rule (region currency, 50+ K-beauty products, 880 barcodes readable in the sample or as EAN-13 SKUs): Canada 3
(Mikaela Beauty, VGLE Beauty, Pharmatoul's esmea.ca), New Zealand 3 (Lady Bonita, 7HADA, P.boo), Australia 2 (AU
Beauty Bazaar, SUL Skin), Europe 9 (Bloom & Shine, Joo Beauty, Planet Skin, My-Kare, Keeo Beauty, Minki Beauty,
Skincation, K-Beauty Studio, Ciamane), UK 4 (Moida, Refresh Skincare, Atelier De Glow, Likeskin). Left out as the
same stock: pharmatoul.com (esmea.ca), koreanskincare.com (korean-skincare.nl, already listed), koreanbeauty.es and
koreanbeauty.nl (one shop, charges SEK). Left out for currency or share: Corée Beauty (CHF), KoreaBe (KRW), Life
Pharmacy and Health New Zealand (general pharmacies, under 50 K-beauty products), Peach & Lily and Style Story (own
brands only in the feed), Olive Kollection, Rose Rose Shop and Mochimochi (no barcode readable).

**The big names the research found cannot be read** and stay off the list until a reader or a feed exists:
Ulta, Sephora (US/CA/UK/AU/NZ), Olive Young US, Beauty Bay, Boots, Superdrug, Space NK, Skinsider, Shoppers Drug
Mart, Well.ca, Adore Beauty, Chemist Warehouse, Priceline, MECCA, Farmers, Douglas, dm, Flaconi, Notino,
Little Wonderland, MiiN Cosmetics, Ksisters: custom platforms, no Shopify or WooCommerce feed, most behind bot
protection (403). The ships-from-Korea sellers (Jolse, StyleKorean, Korea Depart, Beauty Box Korea, BeautyNetKorea,
TesterKorea) have no feed either and would belong to no region.

## 2026-11-04 — List your store: stores come to us

The owner stopped cold email outreach ("not really doing anything") and set the aim: be popular enough that stores
ask us, and encourage the ones that do. Every Compare Empire site now has `/list-your-store` (shared
`ListYourStore.tsx` + the `ListStore` form in `ReportForms.tsx`), linked from the footer, `/contact` and the stores
page: what a store gets (free, no contract, never pays to rank), what we need (a readable shop, own currency,
established), and what happens next (checked within a few days, reply through the store's own contact details).
The request is filed as a `suggest-store` report with `issue: "owner"`; RiftCompare's daily reports triage puts
those first and asks for a reply within two days. No email is asked for (the reports branch is public); no pop-up,
no cold email. RiftCompare and OP Compare keep their `/stores/suggest` page (now the owner pitch) and redirect
`/list-your-store` to it.

## 2026-11-05 — Two popular products in the hero, and on the link thumbnail

The owner: "display images of two very popular products and their price and stores on the hero itself on the right
side ... so people immediately know what the site does", and "same with the link thumbnail". The hero's right column
(the flat bottle drawing, kept in `Art.tsx`) is now two product cards (`HeroPicks.tsx`, `src/lib/hero-picks.ts`): the
most popular products someone can order in the visitor's country today (`popularity`, the same ranking as the
Popular row), each with a photo, the cheapest in-stock price, the store charging it and the store count, one per
brand, and only when at least `HERO_MIN_STORES` (3) stores have it in stock, so the card is a real comparison. Every
country's pair is in the server HTML and CSS shows one (`.rp-XX`), like the tiles; on a phone the pair sits under
the search. No heading, no new text in the outline: the h1, the title, the metadata and the URLs are unchanged.
The holiday decorations moved to the edges of the column so they peek out from behind the cards.

The link preview (`src/app/opengraph-image.tsx`, `src/lib/og/home-image.tsx`) is the same two US products with
their photos, drawn at each day's build (a static route, like the guides' cards) instead of the hand-rendered
`opengraph-image.jpg`, so a share always shows today's prices. The photos are the stores' own, read at build
with a short timeout; one that cannot be read drops that product from the card and two unreadable photos give the
old text-only brand card, never a broken image or a failed build. `scripts/og/render.mjs` now draws only the icons.

## 2026-11-05: Amazon's own price on the Amazon row, from the Creators API, by barcode

The owner's US Associates account was approved today and he asked for Amazon's API prices as price rows on every
site ("especially Compare Empire"; until now only CamCompare and Compare Empire had the machinery, and both wait
on Amazon granting access). Here it is the simplest shape the barcode allows: `scripts/fetch-amazon-prices.ts`
runs first in every Vercel build and asks the Creators API `getItems` for each product BY EAN (ten a call, one
call a second, `AMAZON_BUILD_CALLS` calls a region, 30 by default: the 300 products with the most stores), in
every region we have a tag for (US, UK, CA, AU, EU). No title matching and no ASIN finder: the barcode is the
match, as it is for the stores. The result goes to the git-ignored `data/amazon-live/<REGION>.json`; nothing is
committed (Amazon's licence lets a price be kept 24 hours and shown with its time). The product page's Amazon
row (`PriceTable.tsx`, through `lib/amazon-live.ts`) then shows Amazon's new, in-stock, buy-box price with "as of
<time> <region clock>" and the licence's disclaimer, links to the item's own `/dp/` page instead of a search, and
the browser hides the price after 24 hours (`AmazonPrice.tsx`) since the static page may be served that long.
A price under 60% or over 160% of the region's store median is dropped (a different pack size, a fantasy
seller). Never a sort, the cheapest badge, deals, history, the alert feed, metadata or the quick view
(`tests/amazon-api.test.ts` pins the reader to the price table and the client to the build).

One credential serves every store: `AMAZON_CREATORS_AU_CLIENT_ID` / `_CLIENT_SECRET` / `_VERSION` as Vercel
Production variables (the same values as Compare Empire's; `AMAZON_CREATORS_<REGION>_*` would override for
one store). Access is per marketplace and opens by itself once that store's account has qualifying sales
(about 10 in 30 days); a refused store is skipped and the row keeps its search link, so the feature costs
nothing until then and switches on without a code change. The ops monitor cannot see a Vercel build, so a
failed fetch is silent by design: the fallback is the row as it was.

## 2026-11-06: Stylevana pays through Awin, and its feed gives its row a real price

Awin approved the owner's publisher account (Compare Empire, 3144410) for Stylevana (merchant 90791). Stylevana's
row was already on every product page as an unpaid search ("YesStyle and Stylevana always show", above). Two changes:

* **Its links earn from the next build, with nothing to set.** The tracked template is hard-coded in
  `PARTNERS` (`awinTemplate("90791")`: `awin1.com/cread.php?awinmid=90791&awinaffid=3144410&clickref={sub}&ued={url}`),
  like the Amazon tags: both IDs are public in every link, so a Vercel variable would only be one more step for the
  owner. `AFF_STYLEVANA` still overrides it. The `ky-<region>-<placement>-<ean>` sub rides in Awin's `clickref`, so
  Awin's reports split by market and placement as eBay's and Amazon's do.
* **Its product feed, when the owner creates it.** Awin's Create-a-Feed gives a CSV download URL (it carries his
  API key, so it is the GitHub secret `AWIN_FEED_STYLEVANA`, never committed or printed). The daily import streams
  it after the stores (`scripts/partner-feeds.ts`) and keeps a row only when its barcode is a Korean 880 EAN we
  compare, it is in stock, its currency is one region's own (never converted), and its price is 60–160% of that
  region's in-stock store median (another size or a bundle otherwise). The result, `data/public/partners.json`, is
  small (only products we already list). A product Stylevana lists gets a Stylevana row beside eBay and Amazon with
  Stylevana's price and a tracked link to that product; everywhere else the row stays a tracked search. It is never
  a store, the cheapest, a deal, the alert feed or history. A failed read keeps yesterday's prices for three days
  and shows amber on the ops monitor ("Partner feeds"); no feed secret is quiet, not a warning.

The reader is generic (`PARTNERS[].feedEnv`): the next beauty programme that approves us on Awin is one template
and one secret.

## 2026-11-06 — Awin: a store that accepts us pays from the next build, with no step by hand

**Decision (owner: "check if we are making the most of Awin, and if it's not there, just do it"):** the family's Awin
account (Compare Empire, publisher 3144410) is read each morning by Compare Empire's `scripts/awin-sync.ts`, which
publishes the programmes that accepted us, with their tracked domains, in its public `data/awin/programmes.json`. This
site copies that file first in every build (`scripts/fetch-awin.ts` → `src/lib/awin-programmes.json`; the committed copy is
an empty list, so a failed fetch only leaves links untracked). `storeUrl` turns a link to a joined advertiser's own domain
into its Awin deep link to the same page (`clickref=<site>-<store>`), and `storePays` marks the row "Paid link". A store's
own affiliate variable, when set, still wins. Order and prices never change; eBay and Amazon are never wrapped.
A pinned retailer row (`PARTNERS`) with no template of its own uses the joined list too, so a beauty retailer Awin
approves (LOOKFANTASTIC, Cult Beauty…) appears as a paid row the next morning. Stylevana keeps its hard-coded template.

## 2026-11-06 — The buy button opens the store's checkout with the item in the bag

**Decision (owner: "when you click a link it directly takes them to checkout … it eliminates friction"):** a store row's
button, the product page's main button and the phone buy bar go to the store's Shopify cart permalink,
`<base>/cart/<variant>:1?utm_source=kaeyoung.com&utm_medium=referral&utm_campaign=checkout` (`buyLink` in
`lib/affiliate.ts`), and say "Buy" instead of "Shop", with one line saying it opens that store's own checkout. Tested on
2026-11-06 on Glowiss (US), Beauty Diary (AU) and Moona (NZ): each opened its checkout with the one item at the price
we show, and the UTM tags survived into the checkout URL, so the store still sees the sale came from us.

* **Only where nothing is lost.** In stock, a variant the import read, a Shopify store, and a store that pays us
  nothing. A store that pays through Awin or its own referral code records the click with a script on its storefront
  pages, which a jump to checkout would skip; those keep the product page, because the commission is worth more than
  the click saved. A sold-out row, the store directory, and the blog and guide tables keep the product page too.
* **The variant id** is new in `products.json`: the importer keeps each listing's Shopify variant (`Listing.vid`,
  `Offer.v`). Stored as a 5th tuple element in base 36 only for an in-stock offer whose URL does not already end in
  `?variant=<id>` (multi-variant listings are read back from the URL), about +0.7 MB on 10.4 MB. Until the next import
  only multi-variant listings (about 18,000 of 66,000 in-stock offers) can go to checkout; after it, all of them.
* **Measured** by the `buy_click` event's new `to` property (`checkout` or `product`) in Vercel Analytics. Clicks are
  what we can see; a non-paying store's sale is not. If a store's checkout ever refuses the link (a variant gone since
  the import), the shopper sees the store's own "unavailable" page, which is the same risk a stale product link has.

## 2026-11-06: Motion: snowfall, scroll reveals and hover polish, with nothing hidden or shifted

Owner: "I really want some animations, movements, make it dynamic … it's Christmas themed, so make it snowing; when
you're scrolling down something moving in smoothly … very smooth, the shopping experience is really important", on
KaeYoung and ScentCompare alike. The same layer is in both repos (`src/lib/motion.ts`, `src/components/HeroSnow.tsx`,
the `motion:start`/`motion:end` block of `globals.css`); only `--snow`, the pale day-time flake colour, differs.

* **No library.** Two inline scripts and CSS. `MOTION_BOOT` in `<head>` stamps `html[data-motion]` before paint unless
  the visitor prefers reduced motion (or `?motion=off`); every animation is keyed on it. `MOTION_SCRIPT` at the end of
  `<body>` marks every `[data-reveal]` element already on screen as shown and only then stamps `data-reveal-on`, the
  one attribute under which CSS hides anything. So a first paint never loses content, a failed script hides nothing,
  and the server HTML (every word, price and link a crawler reads) is unchanged. Off-screen sections rise in and tile
  grids, price rows and FAQ items follow one another as they scroll into view (IntersectionObserver; MutationObserver
  for client navigations and the quick view). Opacity and transform only: zero layout shift (measured CLS 0).
* **Snow is a canvas, in the holiday window only** (`html[data-season="christmas"]`, unchanged dates). Soft flakes,
  six-armed crystals and gold glints in three depths on a slow wind, parting around the pointer and nudged by scrolling.
  It starts when the browser is idle, stops while the hero is off screen or the tab is hidden, caps its flakes (60 on a
  phone) and device pixel ratio (2), and hands over from the CSS snow, which stays as the no-JavaScript look.
* **The hero** eases in on arrival, its two product cards float, the wash drifts, and "Pay less." catches a gold glint
  every few seconds. Buttons lift and press, buy buttons get a light sweep, step icons wiggle, price rows lift, the
  search glows when focused, the header gains a shadow once scrolled. No pop-ups, nothing that moves a price.

## 2026-11-06 — Store thumbs up and down, one tally shared by every site

**Decision (owner: "a little mini area where you can rate a shop … thumbs up a store or thumbs down a store … across all
the sites you can now see that these stores are trusted"):** every store row carries two tiny thumbs beside the store's
name (`src/components/StoreVote.tsx`, the same file on every Compare Empire site), with counts once a store has votes and
a green "Trusted" mark from 3 thumbs up and 80% of the votes. RiftCompare keeps the votes and serves one public tally
(`riftcompare.com/api/store-votes`, CDN six hours), keyed by the store's host without "www.", so a shop listed on several
sites shares its thumbs; this site stores nothing and fetches the tally in the browser only (no function, no build
step). One vote per browser per store, a few per network, marketplaces (eBay, Amazon, TCGplayer…) get none. Votes never
order prices, hide a store or decide the cheapest. RiftCompare's DECISIONS.md, 2026-11-06, has the rules; change the
component there first and copy it.
## 2026-11-06 — Store deals beside the price: multi-buys and free gifts from the store's own cart, Awin offers

**The ask (owner):** "with Stylevana, when you purchase 2 cleansers you get a discount compared to just buying one … any
promotions or discounts captured in our price comparison."

**Where promotions can be read honestly.** A store's banner or promo page is free text that changes without notice
and says nothing about which products qualify, so it is never read. Two sources say exactly what a shopper pays:

* **The store's own cart** (`scripts/promos.ts`, `promos.yml`, daily at 03:23 UTC, before the import). Shopify applies
  a store's automatic discounts (multi-buys, "3 for 2", spend-and-save, free gifts) in the cart. For each product the
  cart is asked the price of 1, 2 and 3 (`/cart/add.js`, `/cart.js`, `/cart/change.js`, then `/cart/clear.js`: the
  calls the store's own page makes, one every 1.5 s, the same 403/429/captcha stop as the import and delivery quotes,
  nothing bought). A store is screened on its most compared in-stock product in each category; only a store whose
  cart discounted one (or did yesterday) is asked about 60 more. A deal is recorded only when the cart charged at
  least 1% (and 10 cents) less than that many times the shelf price, and not absurdly less (under 40%); a free gift
  only when the cart added a free line itself. A discount's own name is shown only when it reads like words (never a
  code). A cart in another currency, or pricing one item above our shelf price (another variant), is left alone.
  **Never carried from one product to another**: "buy 2 cleansers" shows only on the cleansers the cart priced.
* **Awin's Offers API** for a retailer that accepted us (Compare Empire publishes the family's live offers and vouchers
  as `data/awin/promotions.json`; `scripts/fetch-awin.ts` copies it into `src/lib/awin-promotions.json` at build). The
  advertiser's own title and code, with its end date, beside that retailer's row (Stylevana today, any Awin store as it
  joins). Not shown before its start or within a day of its end (a static page lives until the next build).

**How they show.** A line under the store's row: "Buy 2: A$36.00 (A$18.00 each) · applied in the store's cart", and
"lowest per item if you buy 2" when that per-item price beats every single-item price. The row's price stays the
single-item price, the rows stay in single-item order and the real cheapest keeps its badge: a deal that needs two
items never outranks a store that sells one for less (`lib/promos.ts`; `tests/promos.test.ts` pins that only the price
table reads deals). A deal is hidden after two days or as soon as the shelf price differs from the one the cart saw.
Never in the alert feed, deals pages, history, metadata or the basket. The ops monitor shows "Store deals" (amber only).

**Reuse.** The cart check needs only a Shopify store and a product's variant: ScentCompare gets the same code;
FigureCompare's Shopify stores, CamCompare's Shopify shops and the card sites' Shopify importers could run it too.

## 2026-11-06 — A cart list on every site

**Decision (owner: "I really like the cart feature … all of our websites"; built on RiftCompare first, TCGEmpire
#346):** every store price row gets an "Add to cart" button, and the header a cart with its count on every width.
`/cart` (static, noindexed, out of the sitemap) groups the lines by store with ONE "Check out at <store>" button per
store: Shopify's cart permalink `/cart/<variant>:<qty>,…`, which fills that store's cart and opens its checkout. The
list lives in the visitor's browser only (`localStorage` `ce_cart_v1`): no account, no database, no function. The page
re-checks each line's price and stock from the store's own `/products/<handle>.js` in the browser (Shopify serves it
with CORS open) and leaves a sold-out line out. A line is cartable only when the row's own buy link already is a cart
permalink (the single-click checkout links), so Awin and partner stores, and rows whose variant we don't know, stay
"manual" lines on their own tracked links; eBay, Amazon, TCGplayer and Cardmarket are never lines. Shared files, the
same in every site (port fixes by hand): `src/lib/cart-list.ts`, `src/components/cart/*` (`cart-config.ts` is the
one per-site file; styles imported once from the root layout), `tests/cart-list.test.ts`.

## 2026-11-06 — Build only the top product pages; the rest render on first visit

**Why:** every daily build wrote a page and a quick-view file for each of ~11,200 products: about 22,000 pages (ScentCompare, on the same engine, had reached 77,070 pages and 15–17 minutes). A build that
long queues every other build behind it and loses the whole time when it fails.

**Decision:** the build prerenders only `prebuiltProducts()` (`src/lib/index-tiers.ts`): the 500 most widely stocked
products in the sitemap tier, page and `/q/<slug>` file. Every other product page has `dynamicParams = true`: it is
rendered on its first visit, by the same code from the same deployment's data, and then kept as a static file until
the next release. There is no revalidate timer, so it is rendered at most once per release (the 2026-10 lesson from
RiftCompare was timers, not one-off writes). Build now: 1,619 pages and 51s locally. URLs, titles, metadata, prices and JSON-LD are the
same as before; the sitemap still lists every page it did (it reads the data, not the prerendered list). Those two
functions carry `data/public` and `data/amazon-live` (`outputFileTracingIncludes` in `next.config.js`): without them
the data loader falls back to empty and every such page would be a 404. `tests/cost-rules.test.ts` pins all three.

A slug the release does not know is still a real 404. Not from `notFound()` in the page: Next 14 streams the page
behind `loading.tsx`, so a page-level `notFound()` answers 200 with the not-found page (a soft 404). The check lives
in `src/app/product/[slug]/layout.tsx`, which renders outside that loading boundary, so the 404 status is set before
anything is sent (`tests/cost-rules.test.ts`).

**Prices still ship with the daily build, on purpose.** Prices are written into each page's HTML, so the daily data
commit (`[deploy]`) is the one release a day, and the 12-hour gate skips it when a release went out in the last 12
hours. Reading prices at request time from a store would turn every page into a function on every visit, which is
what this engine exists to avoid; with the build at a minute or two, one data build a day costs little.

Also fixed: the home share image's `linear-gradient(#fff, …)` without a direction made satori throw "Missing comma
before color stops" (`/opengraph-image`); it now says `180deg`.

## 2026-11-06: Amazon prices find ASINs by barcode first (ported from ScentCompare #20)

The 2026-11-05 build fetch asked getItems with `itemIdType: "EAN"`. The Creators API documents ASIN as the only
itemIdType, so it could never have priced anything, even once Amazon opened access. Now `scripts/amazon-asins.ts`
runs in the daily import: per region, products with the most stores first, one searchItems by the barcode and,
failing that, one by brand + name + size, kept only when the result's own `externalIds` list our barcode (a wrong match is worse
than none). Up to 300 calls a region a day (`AMAZON_SEARCH_BUDGET`), misses retried after 30 days,
`data/amazon/asins-<REGION>.json` committed (ASINs may be stored, prices may not). The build prices those ASINs, ten
a call, still within 60–160% of the store median. Credentials are per country (the AU credential answers US and UK
calls with 400 InvalidAssociate, found on Compare Empire), and InvalidAssociate / AssociateNotEligible now stop a
region at once. Until each Amazon account has 10 qualifying sales in 30 days the rows keep their tagged searches.


## 2026-11-06: Side rails (eBay left, Amazon right) and the phone dock

Owner: "Can I get the eBay ads on KaeYoung as well? So the eBay and TCGplayer ads, but instead of the TCGplayer ad, we have
the Amazon ad banner that's scrollable", like DexCompare, MTG Compare, RiftCompare and the card engine. This narrows the
2026-10-30 "no banner ads" rule by one placement; the rest of it stands (no strips, AdSense or nav boxes).

- **Rails** (`components/SideRails.tsx`): eBay down the left of the page, Amazon down the right, up to ten tiles each that
  scroll inside the rail. From **1440px**, not the sisters' 1280px: the side panel already takes 256px on the left, and at
  1440 the content keeps 864px. The columns are empty `<aside>`s in the server HTML that CSS widens from 1440px, so the page
  never moves when the tiles arrive (CLS 0); the rails are sticky inside the page's row, so they stop above the footer and
  never cover content. Tiles come from one static JSON per region (`/rails/<region>`, force-static, `lib/side-rails.ts`):
  nothing in a page's HTML, no function, no SEO change.
- **eBay tiles** are the daily import's own matches (photo + delivered price), the region's most-stocked products first;
  New Zealand gets eBay Australia's. Where the eBay pass has too few listings (ScentCompare until its keyset is live), the
  rest of the rail is tagged exact-name eBay searches with the store's photo and no price, like the Amazon tiles; the
  dock takes only live listings. Tag `ky-<region>-side-ebay-<ean>`.
- **Amazon tiles** have no price: the Creators API refuses us until the account has 10 qualifying sales in 30 days, and
  Amazon's licence forbids keeping a price, so a file served for a day may not carry one. Each tile links to Amazon's own
  page of the barcode when the import found its ASIN, else an exact product-name search (Associates rule: a specific
  product), with the store's own photo and "See price". Tag `ky-<region>-side-amazon-<ean>`. No Amazon rail in NZ.
- **Phone dock** (`components/AdDock.tsx`, ported from WargameCompare / DexCompare, 2026-11-06): below 1440px, the eBay tiles
  in a 64px bar at the foot of the screen, after 60% of a screen is scrolled, hidden beside the footer, the rating card, a
  dialog or the keyboard, never on a product page (`data-buybar`), ✕ for the visit. **Never Amazon:** the Operating
  Agreement allows no Amazon link in an overlay. Tag `ky-<region>-dock-ebay-<ean>`.

**Measure** with the sisters' ~11-10 / ~11-17 checks (EPN customid, Amazon ascsubtag, `buy_click` placements `side_ebay`,
`side_amazon`, `dock_ebay`). If pages per visit drop, drop the dock first.

## 2026-11-06: Feature only products of about US$20+, eBay calls only on them, "Also check" rows

Owner (Bill), for KaeYoung and ScentCompare together (Scentcompare #24): "the products we feature should be at least
20 USD or the equivalent … on the homepage", eBay calls only on products over US$20, and with no eBay or Amazon price
"say also check on eBay, also check on Amazon … it stands out".

- `lib/featured.ts`: featured in a region when the cheapest in-stock price there is at least US$20, CA$28, A$31,
  NZ$34, £16 or €19. The homepage hero picks (and the home share card), Popular, Biggest savings and New arrivals rows
  read only featured products; everything else still lists every product.
- `planEbay`'s `eligible` searches only featured (product, region) pairs (from the next quota day: 11-06's 2,500 calls
  were spent at 11:41 UTC under the old plan).
- The pinned eBay / Amazon row with no price reads "Also check on eBay" / "Also check on Amazon", tinted in the accent
  with a "Check eBay →" button; order unchanged. This supersedes "drawn exactly like a store row" (2026-11-01) for
  the price-less rows only.
- Amazon: no Creators API credential in this repo yet (ASIN finder "off"); every Amazon row is a tagged search link.


## 2026-11-06 — eBay and Amazon rows are full price rows, on top, outlined

**Decision (owner: "eBay prices and Amazon prices should function exactly like a normal store price row. So you can also
add to cart … if it's in stock … it just sits on the very top. And it has a different colored outline"):** the eBay row
is always the first row, with a green outline, and Amazon the second, with an amber one. Both carry everything a store
row has: the stock line, the store thumbs (one tally per eBay / Amazon domain, `ebay.com.au`, `amazon.com`…) and the
cart button. They are "manual" cart lines on their own tagged links (`src/lib/cart-list.ts`), never a Shopify checkout;
an Amazon line's price is dropped from the visitor's list after 24 hours (Amazon's licence), and the cart then says to
see today's price on Amazon. With no Amazon price the row reads "Also check on Amazon", a tagged link. Unchanged: neither
is counted as a store, "Best price", a deal, an alert price or the reference price; TCGplayer and Cardmarket stay
references (no thumbs, no cart line); no Amazon link in a pop-up.
Here (follow-up to the pinned-row redesign): a priced eBay row and Amazon's own listing get "In stock", thumbs and the cart list; eBay keeps the green border, Amazon's priced row takes the amber one, the unpriced "Also check" rows keep the accent tint, and the quick view's Amazon row stays an internal link to the product page.

## 2026-11-06: "Lowest store price", sold-out rows without a price, category vendors are not brands

Underperformer review (owner: "fix everything"). The headline said "Lowest price" while a pinned partner row (Stylevana's
feed) or eBay could be cheaper: partners and eBay are never the best price (family rule), so the headline and its row now
say "Lowest store price", which is exactly what they are. Sold-out store rows stay at the bottom but show no price (a
stale price read as a deal). A Shopify vendor that is a category ("Face Mask", "Skincare") is not a brand; the title's
known brand is used instead, so no /brands/face-mask page. "K Young" in Google is an old crawled title; the site has none.

## 2026-11-06: The quick view carries the tagged Amazon link (owner)

Since 2026-11-02 the quick view showed no Amazon link (or, on KaeYoung and ScentCompare, an "Amazon" row that opened our
own product page), read as Amazon's ban on links in pop-ups. The owner noticed the quick view sends nobody to Amazon and
chose (2026-11-06) to put the product page's own tagged Amazon link there. Amazon's Participation Requirements, item
(o): "You will not post or serve any Special Links … within any pop-up or pop-under windows, transitional page ads, or
layer ads, except for pop-up windows in conjunction with your Site promoting Products closely associated with the
materials on your Site." A quick view the visitor opens for one product, showing that same product, fits the exception;
the owner accepted the remaining risk. The quick view shows the link only (the item's own page where the ASIN is known,
else the tagged search), never Amazon's price: that stays on the product page under the 24-hour licence. Uninvited
overlays (a phone ad dock, a corner card, an exit pop-up) still never carry Amazon, and an Amazon page is never framed
(item (n)).

## 2026-11-07: The sitemap lists a lean core

The owner's Search Console and Bing audit (2026-11-07) found the family's young domains stuck in "Discovered – currently
not indexed": Google knows thousands of templated product URLs and, with few links pointing at the site, samples a few
instead of indexing them. The sitemap now lists ~400 URLs instead of thousands: the hubs and guides as before, the 300
most widely stocked products (`SITEMAP_PRODUCTS`, the head of `prebuiltProducts`, so every listed page is a prerendered
static file), and only the brands that carry one of them. Category page 2+ left it too. Nothing was noindexed, removed
or moved: every other product, brand and hub page stays live, indexable and linked from its category and brand pages,
and IndexNow submits the same core. Widen `SITEMAP_PRODUCTS` once Search Console shows the core mostly indexed
(recheck ~25 Nov). `tests/seo.test.ts`.
## 2026-11-07 — Black Friday strip and Cyber Monday page (owner: "capture all of the Black Friday SEO")

Black Friday is 27 November 2026 and Cyber Monday 30 November. Three additions, this site:

- **`/cyber-monday`**, its own URL for its own searches ("k-beauty cyber monday deals"), kept every year like
  `/black-friday`, listing the same real store deals. In the sitemap and footer; the two pages link each other.
- **The holiday strip**: one line under the header on every page, in the server HTML, linking `/black-friday`
  from 1 November to the Saturday after it, then `/cyber-monday` to the day after Cyber Monday, then nothing
  (`saleStrip` in `lib/black-friday.ts`, tested). The same link leads the nav while it shows. A link, never a
  pop-up (pop-up policy: no uninvited interruption on a visit's first page), never a countdown or "ends soon".
- **More on both pages, nothing taken away**: the URL, title and h1 of `/black-friday` are unchanged; below the
  existing tiles come four visible questions (the dates, whether stores have sales, shipping, how often it updates). No FAQ rich-result markup:
  Google shows those only for government and health sites since 2023, so the text is what ranks.
## 2026-11-07 — The low-traction cull: a product must be widely stocked today, or found through search

Owner, 2026-11-07: apply Compare Empire's focus cull to every site ("any products that are not trendy, or very low traction or
conversion, we probably want to get rid of"). The merge's two-stores-in-one-region rule counts stores that list a product sold out,
so most pages compared nothing anyone could buy. `lib/focus.ts`, applied by `scripts/import.ts` after the merge, lists a product
only when, counting stores that can sell it today, one region has three or more or two regions have two or more (the sitemap's
first tier from 2026-11-03, now the existence rule), or when Search Console shows a click or 10+ impressions on its page in 56 days
(the `demand` branch, written daily by RiftCompare's sister-demand job). ≈11,290 → 4,790 products (32 of them kept only by search demand).

- products.json, the eBay pass, search, lists and the sitemap see only listed products. history.json keeps every merged product,
  so one that qualifies again returns at the same URL (slugs are kept forever) with its chart.
- `data/public/culled.json` (slug → category): a culled product page 301s to its category (`lib/culled.ts`).
- The import's half-size guard compares the merge's count before the cull (`meta.merged`).

## Black Friday indexing push (2026-11-07)

Owner: get every Black Friday page indexed. The daily IndexNow ping sent only the hubs it named, so the sale pages
(`/black-friday`, `/cyber-monday`, the other seasonal pages) and the blog posts never went out; they are named now
(the sitemap already listed them). A Black Friday blog post goes live on 8 November (on 7 November for Figure; Scent's,
written for the 14th, moved up because it is only useful before the sales) and the two sale pages link to it once it is live. Every price in it is a live table of
the day's prices; no countdown, no "was" price.

## 2026-11-08 — Christmas is one quiet line, not a costume

Owner: "some of the christmas themes on our websites are a bit too much - the theme must match the domain". The
2026-11-01 Christmas look (falling snow, a strand of lights, trees, presents, candy canes, stockings, a Santa hat on the
logo, candy-cane stripes and seasonal palette swaps) is gone, with its art in `public/xmas/`. The season keeps at most ONE
touch, drawn in the site's own colours: "The Holiday Edit" line above the hero (`.ky-holiday-pill`), a plain pill on the site's own hairline. The snow canvas (`HeroSnow`), gold snowflakes, pastel tree, cane and stockings, header hairline and warm wash are gone. It still starts and ends by itself (`lib/season.ts`, 1 November to
Boxing Day), and the tests pin that nothing else comes back. Black Friday and Cyber Monday (strip, pages, nav) are
unchanged. The same rule went to every sister site: the site's own identity first.

## 2026-11-08 — Shop by need: ingredient and skin-concern hubs

Owner approved the competitor scan's search-by-need hubs (2026-11-08): shoppers search "centella toner" or "skincare for
dry skin", not a brand. `/ingredients/<slug>` (25 hubs: centella, snail mucin, niacinamide, PDRN, retinol…) and
`/skin-concerns/<slug>` (7: acne, dry skin, dark spots, redness, fine lines, pores, barrier), with an index page each,
prerendered at the release build like the brand pages (`components/NeedHub.tsx`).

- A product is in a hub only when its OWN NAME says so (`lib/needs.ts`, word-boundary patterns, `tests/needs.test.ts`):
  we hold no ingredient lists, and never claim a product treats anything. The copy says we go by the name on the bottle
  and that nothing is medical advice. A concern hub links the ingredient hubs shoppers look at for it.
- A hub is indexed and in the sitemap only with 3+ products (`NEED_INDEX_MIN`); fewer is `noindex, follow`.
- Product pages link the indexed hubs their name puts them in (up to four chips), and the side panel and phone menu
  have a "Shop by need" group.
- ScentCompare's equivalent is not ingredients but its notes pages and the new "smells like" hubs (its DECISIONS.md).

## 2026-11-08 — Store badges, free price data and My collection (competitor scan)

The owner approved the competitor scan's ideas (Collectr and PriceCharting keep people coming back with "what is my
collection worth"; Scryfall grew on free data credited with a link; price sites earn links from the stores they list).
- **Store badge.** `/list-your-store` ends with "Already listed? Add our badge": a plain-HTML (`lib/store-badge.ts`) "prices compared on"
  badge (an ordinary link: no iframe, script, image or tracking) and its code to copy. `ListYourStore.tsx` takes it as the
  optional `badge` prop and stays the same file in every site. Stores see it when they come to us; nobody is emailed about it
  (cold outreach stays stopped).

## 2026-11-08 — "Is this a good price?": paste a store link

Owner, 2026-11-08 (the competitor scan's gap #7, "implement all of this"; the same feature runs on MTG Compare, DexCompare and the
card sites): a visitor pastes a store's product link at `/is-this-a-good-price` (`components/LinkChecker.tsx`,
`lib/link-check.ts`) and sees whether it is a good price.

- `/check/<host>`: one static JSON per store we read, written at the release's build like every page (force-static,
  `dynamicParams = false`; any other host is the static 404). No function runs and the pasted page is never fetched. Each of the
  store's listings comes with the product's cheapest and median in-stock store price in the store's region (Amazon, eBay and
  partner retailers never count).
- A link is keyed by host and path (`linkPath`: a Shopify product is `/products/<handle>` from any collection or market prefix); two
  products under one path need the `?variant=` to tell them apart, or there is no answer (a wrong product is worse than none).
- Verdict (`priceVerdict`): within 1% of the cheapest in stock is the best price; under the median fair; within 3% of it typical;
  above it "you can pay less", with the saving. A listing that was out of stock says so instead. Amazon, eBay, marketplaces, stores
  we don't read and unmatched pages offer a search with the link's words.
- A link pasted into the header search opens the checker (`#link=` in the fragment). Linked from the footer and the sitemap.

## 2026-11-09 — Navigation audit (Bill): sections one swipe away, brands on a section, the niche's own filters

Bill: a collector or someone deep in a space must reach it fast. Here a K-beauty shopper goes by routine step, then skin concern or ingredient, then brand, then size. One change for the KaeYoung / ScentCompare / MotorCompare
engine (FigureCompare's variant has its own entry), made in step in the three repos.

- **Quick row** (`components/CategoryStrip.tsx`, `quickLinks` in `lib/nav.ts`): below lg, where the side panel is not drawn, a swipeable row
  of the sections, this niche's second way in and Brands sits under the header on every page, in the server's HTML, the current one
  marked. It is a subset of the sidebar's own list, so the two never disagree (`tests/nav.test.ts`).
- **Brands on a section** (`CatHub`): "Shop <section> by brand", the twelve brands with the most products there (only brands that have
  a page), each a link to `/brands/<slug>`, and "All brands".
- **The niche's filters** (`content/facets.ts`, `lib/browse.ts`, `components/Browse.tsx`): beside brand and rating, Skin concern (the lib/needs.ts hubs, read from the product's own name) and Size (ml/g). Each reads only the
  product's name that /search-index.json already holds, so nothing is fetched and nothing is guessed: a name that does not say has no
  value. Fixed lists show before the index loads; the counts appear once it has.
- The header search's short placeholder now names what it finds (brand, product, barcode / part code).
- Unchanged: every URL, title, description, canonical, h1 and JSON-LD. Not done: brand-within-section hub pages (a new indexable
  page per pair needs its own thin-page rule), and the side rails and corner rating card (owner, 2026-11-06 / 2026-11-03).

## 2026-11-09, Header mega menus replace the side panel (Bill)

Bill: navigation is very important, prefers dropdown menus, wants the best modern pattern across the family.

- **`components/HeaderMenus.tsx`** (lg up): Shop (steps), Skin concern (concerns + ingredients), Brands, Deals & more. Panels are plain
  links in the server HTML (closed ones only hidden by CSS), opened by hover with a ~90 ms intent delay, click or tap, and keyboard
  (ArrowDown/Enter open, Tab walks, Escape closes and refocuses); `aria-expanded`/`aria-controls`; no library, no layout shift.
- **One source**: `headerMenus()` in `lib/nav.ts` takes the same `navGroups` the phone menu draws, plus `menuFacts()` (`lib/menu-facts.ts`,
  data already loaded): concerns/ingredients with 3+ products, 14 brands. Each link carries the markets that have products and is
  drawn with the engine's `rp rp-XX` classes, so a visitor sees only what their market lists; a link with none anywhere is dropped.
- **Side panel removed** (it replaced the 2026-10-30 owner choice, at Bill's 2026-11-09 direction): the menus carry every destination it
  had; the page is flush. Below lg the quick row and the phone menu are unchanged.
- Unchanged: every URL, title, canonical, h1, JSON-LD. No new fetch, no revalidate change.

## 2026-11-10: Explore layer, PriceRunner-style (owner: "same treatment as Compare Empire", lower bounce, return visits)

Diagnosis from the 9 Nov weekly report and the 8 Nov traffic check: KaeYoung 237 visitors a week with a 70% bounce
(the family's main sites sit at 50-57%), 70 Google clicks, A$1.47 earned in four weeks against A$5.25 of Vercel. The
money gap is structural, not the design: almost every click goes to a store row that pays nothing (no store carries a
programme; the only paid rows are eBay, Amazon and Stylevana). The design gap was that a visitor landing from Google on
a product page had nowhere obvious to go next but the bottom of the page. So, without touching a URL, title, meta
description or price order (`components/explore/`, identical in ScentCompare):
- The home page's steps are photo tiles of each step's own most popular products (`CategoryGrid`, `lib/explore.ts`),
  under a shorter hero, so the first screen shows what is behind each door.
- "Recently viewed": the visitor's own last product pages, kept in THEIR browser only (localStorage `ky-recent`),
  shown on the home page and under a product's prices with the lowest price they saw. Nothing is sent anywhere.
- "Similar <step>" beside the price table: five products of the same step from other families, sharing a skin need
  when the name says one, other brands first, each with its lowest store price and store count.
Price-drop email alerts (RiftCompare's shared service) would be the strongest return-visit tool, but KaeYoung was left
out of that service by the owner on 2026-11-02: asked again, not done.

## 2026-11-10: Category page 2 and later are noindex, follow (site review X4)

Search Console showed the paginated hubs competing with their own hub: kaeyoung.com/serums/page/23 had 806 impressions
and /serums/page/11 had 262 in 56 days, both with 0 clicks. Page 2+ was self-canonical and indexable. It is now
`robots: { index: false, follow: true }`: the page and its links stay crawlable, so every product it lists is still
found, but only the hub (page 1) competes for the category's searches. Page 2+ was already out of the sitemap. The
canonical stays self (pointing page 23 at page 1 would claim they are the same content). Pinned in `tests/seo.test.ts`.
## 2026-11-10: Category-named brand pages redirect to their category (site review KY-1)

`/brands/face-mask` had 325 Google impressions at position 3.8 and no clicks: "Face Mask" was a store's Shopify vendor,
not a maker. `NOT_A_BRAND` in `lib/brand.ts` has kept such vendors from making brand pages since 2026-11-06, which left
the ranked URL a 404. `next.config.js` `redirects()` now sends every category word that page could have come from
(face mask, sheet mask, serum, toner, cleanser, sunscreen, moisturiser, skincare, cosmetics, beauty) to its category
with a permanent redirect (the generic words to the home page), so the ranking moves to a real page. A static redirect
is served by Vercel's router, not a function. `tests/brand.test.ts` checks every target is a category and every source
is a word `listingBrand` refuses.

ScentCompare's half of the task (trim products.json, 19.9 MB) was measured and left: no field in it is unused (offers
are 15.9 MB of it and every part of an offer is drawn or linked), and folding repeated store handles saved 270 KB. The
real lever is the cull threshold in `lib/focus.ts` or a gzipped file, both noted for the owner.

## 2026-11-10: The nearest paid price under the cheapest store (hero and phone buy bar)

The zero-earnings diagnosis (10 Nov) found 42 buy clicks in 30 days, 9 of them to a link that can earn:
the hero and the phone buy bar name only the cheapest store, which usually pays nothing. RiftCompare's rule
(`lib/paid-alternative.ts`, owner 2026-10-27) is ported: when the cheapest orderable store is not a paid link, a second
line names the cheapest paid row of the same table (eBay's delivered listing, Amazon's own listing, a partner's feed
price for this barcode, or a store on a joined programme) when it is within 20% of that store's price: "or US$19.95 on
Stylevana +11% (ships worldwide) →", labelled "Paid link". It is the row's real price, never called cheaper, never the
best price, and nothing is reordered; when the cheapest store already pays, nothing is added. Amazon's price follows its
24-hour licence in the browser too (`PaidAlt`), so `tests/amazon-api.test.ts` now lets `lib/paid-alternative.ts` read
`amazon-live` beside the price table. Clicks are `buy_click` with placement `hero_alt` / `buybar_alt` (and the same in
the sub id). On the day's data it shows on 1,610 of 20,924 product-region pairs (eBay 463, Stylevana 1,147). Every KaeYoung change also goes to ScentCompare: same files there.

## 2026-11-10: Hub pages under 300 KB (zero-earnings diagnosis, fix 3)

The skin-concern hubs were 0.96 to 1.52 MB of HTML each (dark-spots-dullness 1,481 KB), the heaviest pages we run,
and the pages Google ranks on page two. Measured on a build: 223 product tiles, each drawn twice (once as HTML, once
again as the RSC payload that hydrates the page), with all six regions' prices and "Save" chips in each, under long
Tailwind class strings. About 2.9 KB of HTML plus 4 KB of payload per tile.

- `TileGrid` (every product grid on the site) now hands the client component `Tiles` one compact row per product
  (slug, name, brand, photo, rating, and per region [price, stores, save %], all computed on the server at build), so
  the payload carries numbers, not a second copy of the markup. The HTML still holds every tile, name, price and link
  (client components are server-rendered), with every region's price switched by `.rp-XX` as before.
- The tile's markup uses short classes (`.pt-*` in `globals.css`, the same Tailwind values through `@apply`) and
  single text nodes; the link carries an empty `data-qv` and the quick view reads the slug from its href and the
  name, brand and photo from the tile. Same look (compared side by side, desktop and phone).
- A hub shows the 12 most popular products per step instead of 24 ("Showing the 12 most popular of N. Search for
  more", as before). Markup alone got the biggest hub to 408 KB; 223 tiles cannot fit 300 KB with six regions each.

Result: skin-concern hubs 196 to 256 KB, ingredient hubs 88 to 238 KB. URLs, titles, descriptions, canonicals,
robots, breadcrumbs JSON-LD, the h1 and h2 outline and the intro text are unchanged. Brand pages, the home page and
the deals lists use the same grid and shrink too (TIRTIR 1,545 to 408 KB, home 708 to 356 KB) without losing a tile.
ScentCompare got the same change.
## 2026-11-10: eBay calls follow visitors: EU held to 160 a day, the US and Australia take the rest (owner)

Measured 8-10 Nov, the coverage planner gave the regions US 721 / EU 642 / UK 478 / AU 347 / CA 312 of the 2,500 calls a
day, but the EU's 642 found 92 listings for 17 visitors. The owner approved the split brief
(`strategy/ebay-region-split-brief-2026-11-10.md`): about US 900 / AU 650 / UK 478 / CA 312 / EU 160, site cap unchanged.

`EBAY_REGION_DAILY_CAP` in `lib/ebay.ts` (UK 480, CA 320, EU 160; the US and Australia have none) is a per-quota-day
ceiling: `planEbay` skips a region at its ceiling and its calls go to the next pairs in order (the US first), and
`meta.ebay.qregions` counts each region's calls so a second run on the same quota day stays under it. The ceiling
binds only while another region has a pair to search: calls no one else can use still go to the skipped pairs, so no
call of the day is wasted. An EU search that found nothing also waits three times longer (`EBAY_EMPTY_RECHECK_SCALE`),
so the EU's 160 go to products never searched there.

Dry run on today's data: US 860 / AU 545 / UK 480 / CA 320 / EU 295. 860 and 545 are every US and Australian product
the US$20 rule (`lib/featured.ts`) lets eBay search, so both are now searched every day; the EU gets the 135 calls
nothing else can use. ScentCompare carries the same code with no ceilings (its EU is not over-served).
