import { test } from "node:test";
import assert from "node:assert/strict";
import { eanOf, isKoreanEan, normaliseBarcode, validEan13 } from "@/lib/ean";
import { ean } from "./helpers";

const SNAIL = ean("880941647000");

test("EAN-13 check digit", () => {
  assert.ok(validEan13(SNAIL));
  assert.ok(!validEan13(SNAIL.slice(0, 12) + ((Number(SNAIL[12]) + 1) % 10)));
  assert.ok(!validEan13("12345"));
});

test("only Korea's 880 prefix is K-beauty", () => {
  assert.ok(isKoreanEan(SNAIL));
  assert.ok(!isKoreanEan(ean("490430118637")), "a Japanese barcode (Hada Labo) is not covered");
  assert.ok(!isKoreanEan(ean("069690100002")), "a US barcode is not covered");
});

test("barcode, then SKU, then one labelled EAN in the text", () => {
  assert.equal(eanOf({ barcode: SNAIL }), SNAIL);
  assert.equal(eanOf({ barcode: "", sku: SNAIL }), SNAIL);
  assert.equal(eanOf({ sku: "COSRX-SNAIL-100" }), null);
  assert.equal(eanOf({ text: `<p>EAN: ${SNAIL}</p>` }), SNAIL);
  assert.equal(eanOf({ text: `EAN: ${SNAIL} / EAN: ${ean("880941647001")}` }), null, "two barcodes: a set, skipped");
  assert.equal(normaliseBarcode(" 8809 4164-70000 "), "8809416470000");
});
