// EAN-13 barcodes: the only thing a store listing is matched on. KaeYoung
// covers Korean beauty, so a barcode must carry Korea's GS1 prefix, 880. A
// listing without one is skipped, never guessed from its title (the
// FigureCompare rule: sizes, shades, refills, old and new packaging and fakes
// all look alike in a title; the barcode tells them apart).

/** True for a 13-digit EAN with a correct check digit. */
export function validEan13(code: string): boolean {
  if (!/^\d{13}$/.test(code)) return false;
  let sum = 0;
  for (let i = 0; i < 12; i++) sum += Number(code[i]) * (i % 2 ? 3 : 1);
  return (10 - (sum % 10)) % 10 === Number(code[12]);
}

/** Korea's GS1 prefix is 880; every Korean brand's own barcode carries it. */
export function isKoreanEan(code: string): boolean {
  return validEan13(code) && code.startsWith("880");
}

/** Normalise a barcode field: digits only, a 12-digit UPC-A padded to EAN-13. */
export function normaliseBarcode(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const d = String(raw).replace(/[\s-]/g, "");
  if (!/^\d+$/.test(d)) return null;
  if (d.length === 13) return d;
  if (d.length === 12) return `0${d}`;
  return null;
}

const EAN_IN_TEXT = /(?:EAN|barcode|UPC|GTIN)\s*(?:code)?\s*(?:[:：#]|no\.?)?\s*(880\d{10})(?!\d)/gi;

/**
 * The barcode of a listing, from (in order) the variant's barcode field, its
 * SKU, and a labelled "EAN: …" in the description. Returns null unless exactly
 * one distinct valid Korean EAN is found: a description naming two barcodes
 * (a set, a bundle) is skipped.
 */
export function eanOf(input: { barcode?: string | null; sku?: string | null; text?: string | null }): string | null {
  const bc = normaliseBarcode(input.barcode);
  if (bc && isKoreanEan(bc)) return bc;
  const sku = normaliseBarcode(input.sku);
  if (sku && isKoreanEan(sku)) return sku;
  if (input.text) {
    const found = new Set<string>();
    for (const m of input.text.matchAll(EAN_IN_TEXT)) if (isKoreanEan(m[1])) found.add(m[1]);
    if (found.size === 1) return [...found][0];
  }
  return null;
}
