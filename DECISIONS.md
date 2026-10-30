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
