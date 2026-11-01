// Advice and opinion posts (owner, 2026-10-30: "a lot of these blog posts
// offering opinions, advice, and ideas for K-beauty"). Written as data and
// drawn by the advice layout in src/app/blog/[slug]/page.tsx, so every pick is
// a live price table for the reader's own country.
//
// Rules (DECISIONS.md "Advice posts"): one question per post; opinions rest on
// what a product's own name says it contains, how widely it is stocked and what
// it costs, never on medical claims; skin-condition posts say patch test and
// see a dermatologist; written as the K Young team, no invented reviewers.
import type { Post } from "./blog";

export const ADVICE_POSTS: Post[] = [
  {
    slug: "korean-skincare-routine-oily-skin",
    title: "A Korean skincare routine for oily skin, at the cheapest stores",
    short: "Routine for oily skin",
    description: "Oily skin does well on light layers, not fewer of them. Our picks for each step, with BHA, niacinamide and gel textures, priced at the cheapest store in your country.",
    date: "2026-10-30",
    updated: "2026-10-30",
    sources: [
      { title: "Face washing 101", by: "American Academy of Dermatology", url: "https://www.aad.org/public/everyday-care/skin-care-basics/care/face-washing-101" },
      { title: "How to test skin care products before use", by: "American Academy of Dermatology", url: "https://www.aad.org/public/everyday-care/skin-care-secrets/prevent-skin-problems/test-skin-care-products" },
    ],
    art: "toners",
    sections: [
      {
        p: [
          "The most common mistake with oily skin is stripping it: harsh foaming cleansers and no moisturiser leave skin tight in the morning and shiny again by lunch. The Korean approach is the opposite. Cleanse gently, use thin watery layers, and keep a light moisturiser even when you feel you don't need one.",
          "Our view: if you only change one thing, swap a squeaky-clean foam for a low pH gel cleanser and add a BHA or niacinamide step a few evenings a week. Start slowly with exfoliating products, and patch test anything new.",
        ],
      },
      {
        h: "Step 1: an oil cleanser at night",
        p: ["It sounds backwards, but an oil cleanser dissolves sunscreen and makeup that a foam alone can leave behind, then emulsifies and rinses off. Many people with oily skin find it leaves their face less tight than a second round of foam. This is our view, not a rule: if a cleansing oil seems to clog your pores, drop it."],
        picks: { title: "Cleansing oils and balms {region}", match: "cleansing (oil|balm)|melting balm|clean(sing)? balm", cat: "cleansers", limit: 8 },
      },
      {
        h: "Step 2: a gentle gel or low pH cleanser",
        p: ["Look for \"low pH\", \"gel\" or \"gentle\" on the label. If your face feels tight after rinsing, the cleanser is too strong."],
        picks: { title: "Gentle cleansers {region}", match: "low ?ph|gel cleanser|gentle", cat: "cleansers", limit: 8 },
      },
      {
        h: "Step 3: BHA or niacinamide",
        p: [
          "BHA (salicylic acid) works inside pores; niacinamide is the gentler everyday option many people use for shine and uneven tone. Pick one to start, not both at once.",
        ],
        picks: { title: "BHA and niacinamide {region}", match: "\\bbha\\b|salicylic|niacinamide", limit: 10 },
      },
      {
        h: "Step 4: a light moisturiser and daily sunscreen",
        p: [
          "Gel creams and \"watery\" sunscreens are where Korean brands shine for oily skin. Our full sunscreen comparison is in [Korean sunscreen: where the favourites are cheapest](/blog/korean-sunscreen-where-cheapest).",
        ],
        picks: { title: "Gel moisturisers {region}", match: "\\bgel\\b|water ?cream|aqua|watery", cat: "moisturisers", limit: 8 },
      },
    ],
  },
  {
    slug: "korean-skincare-routine-dry-skin",
    title: "A Korean skincare routine for dry skin: layer, don't scrub",
    short: "Routine for dry skin",
    description: "Dry skin needs water first and something to hold it in. A layered routine with hydrating toners, ceramides and rich creams, priced at the cheapest store near you.",
    date: "2026-11-03",
    sources: [
      { title: "Face washing 101", by: "American Academy of Dermatology", url: "https://www.aad.org/public/everyday-care/skin-care-basics/care/face-washing-101" },
      { title: "How to test skin care products before use", by: "American Academy of Dermatology", url: "https://www.aad.org/public/everyday-care/skin-care-secrets/prevent-skin-problems/test-skin-care-products" },
    ],
    art: "moisturisers",
    sections: [
      {
        p: [
          "Dry skin is short on oil; dehydrated skin is short on water. Most people with dry skin have a bit of both, which is why the Korean habit of several thin hydrating layers, sealed with a cream, works so well for them.",
          "Our view: skip strong exfoliation for a few weeks, layer a hydrating toner two or three times, and judge a cream by how your skin feels the next morning rather than right after applying it.",
        ],
      },
      {
        h: "Hydrating toners and essences",
        p: ["Pat a hydrating toner in with your hands, let it sink in, then repeat. Hyaluronic acid and glycerin-rich toners are the classic choice."],
        picks: { title: "Hydrating toners {region}", match: "hyaluronic|hydrat|moist|essence toner", cat: "toners", limit: 8 },
      },
      {
        h: "Barrier creams",
        p: ["Ceramides, panthenol and \"barrier\" creams are the step that holds the water in. A richer texture at night, a lighter one in the morning, is a sensible split."],
        picks: { title: "Ceramide and barrier creams {region}", match: "ceramide|barrier|panthenol|rich|moist", cat: "moisturisers", limit: 10 },
      },
      {
        h: "Sleeping masks, once or twice a week",
        p: ["A sleeping mask is a thick last layer you leave on overnight. It is a treat, not a requirement."],
        picks: { title: "Sleeping masks {region}", match: "sleeping (mask|pack)|overnight", cat: "masks", limit: 8 },
      },
    ],
  },
  {
    slug: "korean-skincare-sensitive-skin",
    title: "Korean skincare for sensitive skin: a short, calm routine",
    short: "Sensitive skin",
    description: "Fewer products, soothing ingredients like centella, heartleaf and panthenol, and how to introduce anything new. Our picks, priced at the cheapest store in your country.",
    date: "2026-11-17",
    sources: [
      { title: "How to test skin care products before use", by: "American Academy of Dermatology", url: "https://www.aad.org/public/everyday-care/skin-care-secrets/prevent-skin-problems/test-skin-care-products" },
      { title: "Face washing 101", by: "American Academy of Dermatology", url: "https://www.aad.org/public/everyday-care/skin-care-basics/care/face-washing-101" },
    ],
    art: "serums",
    sections: [
      {
        p: [
          "Sensitive skin is the case where the famous ten-step routine is the worst idea. Every extra product is another chance of a reaction, so the best routine is short: a gentle cleanser, one soothing serum or toner, a plain moisturiser and sunscreen.",
          "Add one new product at a time, patch test it first: the American Academy of Dermatology suggests a small spot on the inner arm, twice a day for seven to ten days, and keep a product only if your skin stays calm. If redness, stinging or breakouts persist, see a dermatologist: no product list replaces that.",
        ],
      },
      {
        h: "Soothing toners and serums",
        p: ["Korean brands lean on centella (cica), madecassoside, heartleaf and panthenol for calming products. Read more in our [centella guide](/blog/centella-cica-skincare-guide)."],
        picks: { title: "Soothing toners and serums {region}", match: "cica|centella|madecassoside|heartleaf|panthenol|soothing|calming", limit: 10 },
      },
      {
        h: "Plain, calming moisturisers",
        p: ["Fewer fragrance notes and fewer active ingredients is usually kinder. Many sensitive-skin creams say \"fragrance free\" on the label."],
        picks: { title: "Calming creams {region}", match: "cica|centella|soothing|calming|fragrance ?free|sensitive", cat: "moisturisers", limit: 8 },
      },
    ],
  },
  {
    slug: "centella-cica-skincare-guide",
    title: "Centella (cica) in Korean skincare: what it is and the best-stocked picks",
    short: "Centella and cica",
    description: "Cica, centella asiatica, madecassoside and tiger grass are one plant. What Korean brands use it for, and where the most-stocked centella products are cheapest.",
    date: "2026-11-10",
    sources: [
      { title: "Centella asiatica in cosmetology (Bylka et al., Advances in Dermatology and Allergology, 2013)", by: "Termedia", url: "https://www.termedia.pl/Review-paper-Centella-asiatica-in-cosmetology,7,20289,0,1.html" },
    ],
    art: "serums",
    sections: [
      {
        p: [
          "Centella asiatica goes by many names on labels: cica, tiger grass, gotu kola, and its extracts madecassoside and asiaticoside. In Korean it is 병풀. It is one of the most common ingredients in Korean soothing products, usually aimed at skin that feels irritated, red or stressed. Its compounds have been studied for wound healing and skin repair (see the review in the sources below), which is where its soothing reputation comes from.",
          "Our view: centella is a gentle, low-risk ingredient to try if your skin is easily upset, but a high percentage on the label does not guarantee a better product. Texture and what else is in the bottle matter as much. On K Young you can search \"cica\" or \"centella\" and both find the same products.",
        ],
      },
      {
        h: "Centella toners and serums",
        p: [],
        picks: { title: "Centella toners and serums {region}", match: "cica|centella|madecassoside|madeca", limit: 12 },
      },
      {
        h: "Centella creams",
        p: [],
        picks: { title: "Centella creams {region}", match: "cica|centella|madecassoside|madeca", cat: "moisturisers", limit: 8 },
      },
    ],
  },
  {
    slug: "heartleaf-skincare-guide",
    title: "Heartleaf (houttuynia) skincare: why it went viral and where it costs least",
    short: "Heartleaf skincare",
    description: "Heartleaf, houttuynia cordata or 어성초: the soothing plant behind some of K-beauty's best-known toners. What it is, and where each heartleaf product is cheapest today.",
    date: "2026-11-24",
    sources: [
      { title: "Pharmacological Effects of Houttuynia cordata Thunb: A Comprehensive Review (Rafiq et al., Pharmaceuticals, 2022)", by: "MDPI", url: "https://www.mdpi.com/1424-8247/15/9/1079" },
    ],
    art: "toners",
    sections: [
      {
        p: [
          "Heartleaf (houttuynia cordata, 어성초 in Korean) is a plant brands use in products sold as calming and oil-balancing. Lab studies report anti-inflammatory and antioxidant activity in its extracts (see the review in the sources below); good studies of heartleaf skincare on people are still scarce, so judge a product by how your skin takes it. It became famous abroad through heartleaf toners that sold out again and again, and now nearly every big brand has a heartleaf line.",
          "Our view: the hype is mostly about texture. Heartleaf toners are usually watery and light, which suits oily and combination skin that wants something calming without heaviness. Because they are stocked everywhere, prices vary a lot, so check the table before you buy.",
        ],
      },
      {
        h: "Heartleaf products",
        p: [],
        picks: { title: "Heartleaf products {region}", match: "heartleaf|houttuynia", limit: 14 },
      },
    ],
  },
  {
    slug: "is-snail-mucin-worth-it",
    title: "Is snail mucin worth it? An honest look, with prices",
    short: "Is snail mucin worth it?",
    description: "Snail secretion filtrate is one of K-beauty's most famous ingredients. What it does well, what it doesn't, and where the most-stocked snail products are cheapest.",
    date: "2026-10-30",
    updated: "2026-10-30",
    sources: [
      { title: "Snail mucin: what it is and what the research actually shows", by: "Jane Yoo, MD, board-certified dermatologist", url: "https://www.janeyoomd.com/k-beauty/snail-mucin-what-it-is-and-what-the-research-actually-shows-2026-update/" },
    ],
    art: "serums",
    sections: [
      {
        p: [
          "Snail mucin (snail secretion filtrate on an ingredient list, 달팽이 in Korean) is the ingredient that introduced many people to Korean skincare. Its reputation is for hydration and a smooth, bouncy feel.",
          "What the evidence supports: most snail research is small, early or industry-funded, so treat it as a hydrating, skin-barrier-friendly ingredient rather than a fix for wrinkles or dark spots (see the dermatologist's summary in the sources below). Our honest take: it is a good hydrating ingredient with a pleasant, slightly slippery texture, not a miracle. If you like the feel, it is an easy daily step. If you are vegan or dislike the texture, a hyaluronic acid or glycerin serum does a similar hydrating job. And because the most famous snail essence is sold by almost every store, it is one of the products where comparing prices pays off most.",
        ],
      },
      {
        h: "Snail essences, serums and creams",
        p: [],
        picks: { title: "Snail products {region}", match: "\\bsnail\\b", limit: 14 },
      },
    ],
  },
  {
    slug: "double-cleansing-guide",
    title: "Double cleansing, explained: who needs it and what to buy",
    short: "Double cleansing",
    description: "An oil cleanser, then a water-based one. When double cleansing is worth it, when it isn't, and the cleansers that are cheapest in your country today.",
    date: "2026-11-13",
    sources: [
      { title: "Face washing 101", by: "American Academy of Dermatology", url: "https://www.aad.org/public/everyday-care/skin-care-basics/care/face-washing-101" },
    ],
    art: "cleansers",
    sections: [
      {
        p: [
          "Double cleansing means two cleansers at night: an oil or balm to dissolve sunscreen, makeup and sebum, then a gentle water-based cleanser to rinse the rest. It is the step most associated with Korean skincare.",
          "Our view: if you wear sunscreen or makeup every day, double cleansing at night is worth it. If you don't, one gentle cleanser is enough, and in the morning a splash of water or a mild cleanser does the job. Massage the oil onto dry skin, add a little water until it turns milky, then rinse.",
        ],
      },
      {
        h: "First cleanse: oils and balms",
        p: [],
        picks: { title: "Cleansing oils and balms {region}", match: "cleansing (oil|balm)|melting balm|clean(sing)? balm|oil cleanser", cat: "cleansers", limit: 10 },
      },
      {
        h: "Second cleanse: gentle foams and gels",
        p: [],
        picks: { title: "Water-based cleansers {region}", match: "foam|gel cleanser|low ?ph|cleansing gel", cat: "cleansers", limit: 10 },
      },
    ],
  },
  {
    slug: "sheet-masks-worth-it",
    title: "Sheet masks: worth it, and should you buy singles or a box?",
    short: "Sheet masks: singles or a box?",
    description: "What a sheet mask actually does, how often to use one, and why the same mask's price swings so much between stores and pack sizes.",
    date: "2026-11-27",
    art: "masks",
    sections: [
      {
        p: [
          "A sheet mask is a serum-soaked sheet you leave on for 15 to 20 minutes. It gives an immediate plumped, hydrated look, which is why people use them before an event. It is a treat for a few days of glow, not a long-term treatment.",
          "Our view: buy a box of a mask you already know you like, and singles to try new ones. One warning from our own data: stores sometimes list a single sheet and a box of ten under the same barcode. K Young leaves those listings out rather than show you a misleading price, so every row below is the same pack.",
        ],
      },
      {
        h: "The most-stocked sheet masks",
        p: [],
        picks: { title: "Sheet masks {region}", match: "sheet mask|mask sheet", cat: "masks", limit: 14 },
      },
    ],
  },
  {
    slug: "how-to-read-korean-skincare-labels",
    title: "How to read a Korean skincare label: PA ratings, functional cosmetics and dates",
    short: "Reading Korean labels",
    description: "PA++++, 기능성 화장품, 사용기한 and 제조일자: the Korean words and marks on the box, what they mean and why they matter when you buy abroad.",
    date: "2026-11-20",
    sources: [
      { title: "Measuring UVA protection: the PA rating", by: "Jane Yoo, MD, board-certified dermatologist", url: "https://www.janeyoomd.com/measuring-uva-protection-pa-rating/" },
      { title: "South Korea functional cosmetic regulation", by: "ChemLinked", url: "https://cosmetic.chemlinked.com/cosmepedia/south-korea-functional-cosmetic-regulation" },
    ],
    art: "sunscreen",
    sections: [
      {
        p: ["Even products sold in English often carry Korean text on the box. A few words are worth knowing, because they tell you what the product is approved for and how fresh it is."],
      },
      {
        h: "The words worth knowing",
        p: [
          "PA+ to PA++++: the UVA protection grade on Korean (and Japanese) sunscreens. The system was developed in Japan from a lab test called PPD; PA++++ means a PPD of 16 or more. More plus signs mean more UVA protection; SPF is mainly about UVB.",
          "기능성 화장품 (functional cosmetic): the product has been reviewed or reported to Korea's Ministry of Food and Drug Safety (MFDS) for a specific function, such as brightening, wrinkle care or UV protection.",
          "미백 (brightening), 주름 개선 (wrinkle care), 자외선 차단 (UV protection): the functions it is registered for.",
          "제조일자 (made on) and 사용기한 or 유통기한 (use by): the dates. Check them on arrival, especially on sale or outlet stock.",
          "개봉 후 12개월 (12 months after opening): how long it keeps once opened, often shown as an open jar symbol with 12M.",
          "병풀 (centella), 어성초 (heartleaf), 달팽이 (snail), 쌀 (rice): ingredient names you will see on fronts of boxes. Our search understands them too.",
        ],
      },
      {
        h: "Korean sunscreens by PA rating",
        p: ["Every sunscreen we compare, cheapest first in your country:"],
        picks: { title: "Sunscreens {region}", match: "pa\\+{3,4}|spf", cat: "sunscreen", limit: 12 },
      },
    ],
  },
  {
    slug: "kbeauty-gift-sets",
    title: "K-beauty gift sets and kits worth giving this year",
    short: "K-beauty gift sets",
    description: "Brand-made gift sets, trial kits and holiday editions from Korean brands, priced at the cheapest store in your country. Our picks for every budget.",
    date: "2026-11-06",
    art: "lip-care",
    sections: [
      {
        p: [
          "A brand's own gift set or trial kit is the easiest K-beauty present: it looks good, lets someone try a line without committing, and usually costs less than the full sizes. We only list sets the brand makes, with their own barcode, never a store's homemade bundle.",
          "Our view: for someone new to K-beauty, a trial kit from a well-known skincare line beats a makeup set, because it doesn't depend on guessing their shade. Holiday editions sell out, so the earlier the better.",
        ],
      },
      {
        h: "Gift sets and kits",
        p: [],
        picks: { title: "Gift sets and kits {region}", match: "gift set|holiday|christmas|trial kit|starter kit|travel kit|discovery|mini (kit|set)|special set", limit: 16 },
      },
    ],
  },
  {
    slug: "rice-skincare-guide",
    title: "Rice skincare: the Korean ingredient behind the glow",
    short: "Rice skincare",
    description: "Rice water, rice bran and fermented rice in Korean skincare: what they are used for, and where the most-stocked rice products are cheapest today.",
    date: "2026-12-01",
    art: "cleansers",
    sections: [
      {
        p: [
          "Rice (쌀) has a long history in Korean beauty, from rice water rinses to fermented rice extracts. Today it appears in cleansers, toners, sunscreens and creams, usually for a softer, brighter-looking finish.",
          "Our view: rice products tend to be gentle and pleasant to use, which makes them a good first step into K-beauty. Some of the most popular sunscreens of the last few years are rice-based, and they are widely stocked, so prices differ a lot from store to store.",
        ],
      },
      {
        h: "Rice products",
        p: [],
        picks: { title: "Rice products {region}", match: "\\brice\\b", limit: 14 },
      },
    ],
  },
  {
    slug: "korean-toner-pads-compared",
    title: "Korean toner pads: which to pick, and where they're cheapest",
    short: "Toner pads",
    description: "Exfoliating, calming and brightening Korean toner pads, what the names on the jar mean, and today's cheapest store for each in your country.",
    date: "2026-12-04",
    art: "toners",
    sections: [
      {
        p: [
          "Toner pads are one of the most Korean products there is: a jar of soaked cotton rounds you swipe over your face after cleansing. They replace a toner and a cotton pad, and they travel well. The trouble is that the jars look alike while the pads inside do very different jobs.",
          "Our view: read the name. Korean brands put the job on the label, so \"peeling\", \"pore\", \"PHA\", \"LHA\" or \"BHA\" mean an exfoliating pad, while \"calming\", \"cica\" or \"heartleaf\" mean a soothing one. Start with one jar, not one of each, and use an exfoliating pad a few evenings a week rather than every day. Patch test anything new.",
        ],
      },
      {
        h: "Exfoliating pads",
        p: ["Pads with acids in the name are for texture and pores. Use them at night and wear sunscreen the next day: exfoliated skin burns more easily."],
        picks: { title: "Exfoliating toner pads {region}", match: "(peel|pore|\\bpha\\b|\\blha\\b|\\bbha\\b|\\baha\\b|exfoliat).*\\bpads?\\b|\\bpads?\\b.*(peel|pore|\\bpha\\b|\\blha\\b|\\bbha\\b|\\baha\\b|exfoliat)", limit: 10 },
      },
      {
        h: "Calming pads",
        p: ["Heartleaf, centella (cica) and other soothing pads are the gentle everyday kind, and the ones most people keep in the fridge for mornings. More on the ingredients in our [heartleaf guide](/blog/heartleaf-skincare-guide) and [centella guide](/blog/centella-cica-skincare-guide)."],
        picks: { title: "Calming toner pads {region}", match: "(heartleaf|cica|centella|calm|sooth|madeca).*\\bpads?\\b|\\bpads?\\b.*(heartleaf|cica|centella|calm|sooth)", limit: 10 },
      },
      {
        h: "Brightening and vitamin pads",
        p: ["Pads that name vitamin C, glutathione or \"dark spot\" are aimed at uneven tone. They are usually the priciest jars, so compare the store prices before you buy."],
        picks: { title: "Brightening toner pads {region}", match: "(vita|vitamin|glutathi|dark spot|bright|niacinamide).*\\bpads?\\b|\\bpads?\\b.*(vita|vitamin|bright)", limit: 10 },
      },
      {
        h: "Price per pad",
        p: ["Jar counts vary (60, 70, 80 and 90 pads are all common), and refills are sold separately. Check the count on the label before you compare: a cheaper jar with fewer pads can cost more per use. The rest of the toner aisle is on [Korean toners](/toners)."],
      },
    ],
  },
  {
    slug: "korean-vitamin-c-serums",
    title: "Korean vitamin C serums: the most stocked, and where they're cheapest",
    short: "Vitamin C serums",
    description: "Korean vitamin C serums and ampoules from the brands stores stock most, with what to look for on the label and today's cheapest store in your country.",
    date: "2026-12-08",
    art: "serums",
    sections: [
      {
        p: [
          "Vitamin C is the brightening serum most people try first, and Korean brands make a lot of them, from gentle derivatives to high-strength ampoules. Prices vary more than the ingredient does, which is exactly what comparing stores is for.",
          "Our view: a gentle, well-stocked vitamin C serum used every morning beats a strong one that stings and ends up in a drawer. If the name gives a percentage, start low. Vitamin C goes before moisturiser and sunscreen, and sunscreen is the step that matters most for uneven tone. Patch test first, and stop if it stings.",
        ],
      },
      {
        h: "Vitamin C serums and ampoules",
        p: [],
        picks: { title: "Vitamin C serums {region}", match: "vita(min)? ?c\\b|\\bvita c\\b|ascorbic", cat: "serums", limit: 14 },
      },
      {
        h: "Reading the label",
        p: [
          "\"Pure\" or \"ascorbic acid\" vitamin C is the strongest kind and the most likely to tingle. Derivatives (ascorbyl glucoside and similar) are gentler and more stable. A dark bottle or an airless pump helps it keep, and a serum that has turned dark orange has gone off.",
          "Vitamin C turns up in toners, pads and sheet masks too. Our [toner pad comparison](/blog/korean-toner-pads-compared) has the brightening jars, and [sunscreen](/blog/korean-sunscreen-where-cheapest) is the step to pair it with.",
        ],
      },
    ],
  },
];
