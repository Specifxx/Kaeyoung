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
  5339155911 (WargameCompare/FigureCompare's) until K Young has its own; the `ky-` customid separates it. The two
  family Browse keysets are split between sister sites already, so the eBay pass spends nothing until K Young has
  its own keyset and `EBAY_DAILY_CAP` is set.
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
