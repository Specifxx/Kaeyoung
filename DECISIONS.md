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
