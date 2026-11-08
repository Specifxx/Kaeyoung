// Shop by need (competitor scan, owner 2026-11-08: "search-by-need hubs"): one page per key ingredient and per skin
// concern, so a shopper who searches "centella toner" or "products for dry skin" lands on real products with every
// store's price. PURE: the hub a product belongs to is read from the words in its OWN name, the way the brand prints
// it on the bottle ("Centella Ampoule", "Snail 96 Mucin Power Essence"). We never claim a product does something, and
// never guess an ingredient a name does not say: a hub is "products named for X", not an ingredient-list search.
// A hub is indexed and in the sitemap only with NEED_INDEX_MIN products (owner 2026-11-08: 3+).
// DECISIONS.md 2026-11-08, "Shop by need: ingredient and skin-concern hubs".

export type NeedKind = "ingredient" | "concern";

export interface Need {
  slug: string;
  kind: NeedKind;
  /** "Centella (cica)": the page and chip name */
  name: string;
  /** what the hub matches in a product's name (case-insensitive) */
  re: RegExp;
  /** one or two plain sentences: what it is, never a promise */
  about: string;
  /** concerns: the ingredient hubs shoppers often look at for it */
  ingredients?: string[];
}

export const NEED_INDEX_MIN = 3;

const I = (slug: string, name: string, re: RegExp, about: string): Need => ({ slug, kind: "ingredient", name, re, about });
const C = (slug: string, name: string, re: RegExp, ingredients: string[], about: string): Need => ({ slug, kind: "concern", name, re, ingredients, about });

export const INGREDIENTS: Need[] = [
  I("centella", "Centella (cica)", /\b(centella|cica|madecassoside|tiger grass|asiatica)/i, "Centella asiatica, sold as cica or tiger grass, is the calming plant extract K-beauty is best known for."),
  I("snail-mucin", "Snail mucin", /\b(snail|mucin)/i, "Snail secretion filtrate, the cushiony essence ingredient behind some of the best-selling K-beauty products."),
  I("niacinamide", "Niacinamide", /\bniacinamide/i, "Niacinamide is vitamin B3, found in toners, serums and creams for an even-looking tone."),
  I("hyaluronic-acid", "Hyaluronic acid", /\b(hyaluronic|hyaluron)/i, "Hyaluronic acid holds water, which is why it shows up in so many hydrating toners and serums."),
  I("vitamin-c", "Vitamin C", /\b(vitamin\s?c\b|vita\s?c\b|ascorbic)/i, "Vitamin C serums and creams, for shoppers after a brighter-looking complexion."),
  I("retinol", "Retinol and retinal", /\b(retinol|retinal|retinoid|retinyl)/i, "Retinol and its stronger cousin retinal are vitamin A derivatives used in night serums and creams."),
  I("bakuchiol", "Bakuchiol", /\bbakuchiol/i, "Bakuchiol is a plant-derived ingredient often sold as a gentler alternative to retinol."),
  I("ceramide", "Ceramides", /\bceramide/i, "Ceramides are lipids found naturally in skin's outer layer, common in barrier creams."),
  I("peptide", "Peptides", /\bpeptide/i, "Peptides are short chains of amino acids, found in firming serums, creams and eye creams."),
  I("collagen", "Collagen", /\bcollagen/i, "Collagen creams, masks and serums, a K-beauty staple for a bouncy look."),
  I("pdrn", "PDRN (salmon DNA)", /\b(pdrn|salmon)/i, "PDRN, often from salmon DNA, is one of K-beauty's newest headline ingredients."),
  I("propolis", "Propolis and honey", /\b(propolis|honey|royal jelly)/i, "Propolis and honey products, known for a glossy, nourishing feel."),
  I("rice", "Rice", /\brice\b/i, "Rice water and rice bran, a traditional Korean beauty ingredient in toners, cleansers and sunscreens."),
  I("green-tea", "Green tea and matcha", /\b(green tea|matcha)/i, "Green tea and matcha extracts, often in toners, cleansers and lightweight moisturisers."),
  I("heartleaf", "Heartleaf (houttuynia)", /\b(heartleaf|houttuynia)/i, "Heartleaf, or houttuynia cordata, is a soothing plant extract made popular by Anua's toner."),
  I("mugwort", "Mugwort (artemisia)", /\b(mugwort|artemisia)/i, "Korean mugwort, or artemisia, a calming herb in essences, masks and toners."),
  I("tea-tree", "Tea tree", /\btea[\s-]?tree/i, "Tea tree oil and extract, common in products for blemish-prone skin."),
  I("aha-bha", "AHA, BHA and PHA", /\b(aha|bha|pha|salicylic|glycolic|lactic acid|gluconolactone)\b/i, "Exfoliating acids: AHAs like glycolic acid, BHA (salicylic acid) and the gentler PHAs."),
  I("azelaic-acid", "Azelaic acid", /\bazelaic/i, "Azelaic acid serums and creams, for shoppers looking at redness and uneven tone."),
  I("panthenol", "Panthenol", /\b(panthenol|vitamin b5)/i, "Panthenol, or provitamin B5, a soothing humectant common in barrier creams."),
  I("ferment", "Ferments and probiotics", /\b(ferment|probiotic|bifida|galactomyces|lacto)/i, "Fermented ingredients like galactomyces and bifida, and probiotic products."),
  I("ginseng", "Ginseng", /\bginseng/i, "Korean ginseng, the root behind many premium K-beauty serums and creams."),
  I("birch", "Birch sap", /\bbirch/i, "Birch sap and birch juice, a light, watery base used instead of plain water."),
  I("aloe", "Aloe", /\baloe/i, "Aloe vera gels, toners and soothing creams."),
  I("tranexamic-acid", "Tranexamic acid", /\btranexamic/i, "Tranexamic acid, found in serums for shoppers after a more even-looking tone."),
];

export const CONCERNS: Need[] = [
  C("acne-blemishes", "Acne and blemishes", /\b(acne|blemish\w*|trouble|pimple\w*|breakouts?|salicylic|bha|tea[\s-]?tree|azelaic|spot (?:patch\w*|treatment|care)|ac collection)\b/i, ["aha-bha", "tea-tree", "azelaic-acid", "centella"], "Products whose names say they are for blemish-prone skin: spot patches, BHA toners, tea tree and calming lines."),
  C("dry-skin", "Dry and dehydrated skin", /\b(hydrat\w*|moist\w*|hyaluronic|hyaluron|ceramide|dry|water ?bank)\b/i, ["hyaluronic-acid", "ceramide", "panthenol", "birch"], "Hydrating and moisturising products: the ones whose names say hydrating, moisture, ceramide or hyaluronic."),
  C("dark-spots-dullness", "Dark spots and dullness", /\b(dark spots?|brighten\w*|bright|glow\w*|radiance|radiant|dull\w*|tone[\s-]?up|vitamin\s?c|vita\s?c|niacinamide|tranexamic|whitening)\b/i, ["vitamin-c", "niacinamide", "tranexamic-acid", "rice"], "Products named for brightening, glow or dark spots, with vitamin C, niacinamide and rice among the usual ingredients."),
  C("redness-sensitive", "Redness and sensitive skin", /\b(calm\w*|sooth\w*|sensitive|redness|red relief|centella|cica|heartleaf|houttuynia|mugwort|artemisia|panthenol|madecassoside)\b/i, ["centella", "heartleaf", "mugwort", "panthenol"], "Products named for calming and soothing, with centella, heartleaf and mugwort among the most common."),
  C("fine-lines-firmness", "Fine lines and firmness", /\b(wrinkle\w*|firm\w*|anti[\s-]?aging|anti[\s-]?ageing|elastic\w*|lifting|retinol|retinal|peptide|collagen|bakuchiol|pdrn|youth)\b/i, ["retinol", "peptide", "collagen", "pdrn", "bakuchiol"], "Products named for firmness and fine lines: retinol, peptides, collagen and PDRN lines."),
  C("pores-oily-skin", "Pores and oily skin", /\b(pores?|sebum|oil[\s-]?control|oily|clay|charcoal|blackhead\w*|mattif\w*)\b/i, ["aha-bha", "green-tea", "tea-tree"], "Products named for pores, sebum and oily skin: clay masks, BHA, blackhead and oil-control lines."),
  C("skin-barrier", "Damaged skin barrier", /\b(barrier|ceramide|panthenol|repair\w*|recovery)\b/i, ["ceramide", "panthenol", "centella"], "Products named for barrier repair and recovery, with ceramides and panthenol the most common ingredients."),
];

export const NEEDS: Need[] = [...INGREDIENTS, ...CONCERNS];
export const NEED_BY_SLUG = new Map(NEEDS.map((n) => [`${n.kind}:${n.slug}`, n]));
export const needOf = (kind: NeedKind, slug: string) => NEED_BY_SLUG.get(`${kind}:${slug}`);

/** The hub path: /ingredients/<slug> or /skin-concerns/<slug>. */
export const needPath = (n: Pick<Need, "kind" | "slug">) => `/${n.kind === "ingredient" ? "ingredients" : "skin-concerns"}/${n.slug}`;

/** Does this product's own name put it in the hub? */
export function inNeed(need: Need, name: string): boolean {
  return need.re.test(name);
}

/** Every hub a product's name puts it in. */
export function needsOfName(name: string, list: Need[] = NEEDS): Need[] {
  return list.filter((n) => inNeed(n, name));
}

/** A hub is indexed (and in the sitemap) once it has NEED_INDEX_MIN products. */
export const needIndexable = (count: number) => count >= NEED_INDEX_MIN;
