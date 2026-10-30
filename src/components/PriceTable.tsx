// One region's price table. Stores are in price order (orderable first), each
// with what delivery costs when its weekly quote is known (lib/shipping.ts);
// eBay and Amazon take the top two rows in their own button colours, then the
// beauty partners (owner, 2026-10-30); all sit pinned
// above them, labelled, never counted as a store and never the "best price"
// (family rule: paid rows pinned, commission never re-ranks).
import { REGION_BY_CODE, type RegionCode } from "@/site";
import { amazonSearchUrl, ebayAffiliateUrl, ebaySearchUrl, ebayShopHost, partnersFor, storePays, storeUrl, subId } from "@/lib/affiliate";
import { getShipping, storeName } from "@/lib/data";
import { deliveryNote } from "@/lib/shipping";
import { money } from "@/lib/format";
import type { EbayPick, Product } from "@/lib/types";
import { PriceRows, type RowData, type RowsData } from "./PriceRows";

export function searchQuery(f: Product): string {
  return f.name.replace(/[()]/g, " ").replace(/\s+/g, " ").trim();
}

/** How an eBay price compares with the cheapest store: never re-ranked, just said. */
function vsBest(p: number, bestP: number | undefined): string {
  if (bestP == null) return "new, Buy It Now";
  if (p < bestP) return "cheaper than every store";
  if (p === bestP) return "same as the cheapest store";
  return `+${Math.round(((p - bestP) / bestP) * 100)}% vs cheapest store`;
}

/** One region's rows, eBay first and Amazon second, then partners, then the
 *  stores in price order. Plain data, so the quick view (/q/<slug>) draws the
 *  same rows as the product page. */
export function priceRows(f: Product, region: RegionCode, ebay?: EbayPick, placement = "table"): RowsData {
  const offers = f.offers[region] ?? [];
  const r = REGION_BY_CODE[region];
  const best = offers.find((o) => o.st !== "out");
  const q = searchQuery(f);
  const sub = subId(region, `${placement}_pinned`, f.ean);
  const ebayUrl = ebay ? ebayAffiliateUrl(ebay.u, sub) : ebaySearchUrl(q, region, sub);
  const amazonUrl = amazonSearchUrl(q, region, sub);
  const pinned: RowData[] = [];
  if (ebayUrl)
    pinned.push({
      name: "eBay",
      sub: ebay ? vsBest(ebay.p, best?.p) : `new listings on ${ebayShopHost(region)?.replace("www.", "")}`,
      brand: "ebay",
      price: ebay ? money(ebay.p, region) : null,
      status: null,
      href: ebayUrl,
      paid: true,
      event: { source: "ebay", region, placement: `${placement}_pinned`, ean: f.ean },
    });
  if (amazonUrl)
    pinned.push({
      name: "Amazon",
      sub: `${r.amazonHost?.replace("www.", "")} · check the seller`,
      brand: "amazon",
      price: null,
      status: null,
      href: amazonUrl,
      paid: true,
      event: { source: "amazon", region, placement: `${placement}_pinned`, ean: f.ean },
    });
  // Big international retailers (YesStyle, Stylevana…): no price feed we can
  // read, so a search link each, in their own labelled group, never ranked.
  const overseas: RowData[] = partnersFor(region, q, sub).map(({ p, href, paid }) => ({
    name: p.name,
    sub: p.note,
    price: null,
    status: null,
    href,
    paid,
    event: { source: p.key, region, placement: `${placement}_overseas`, ean: f.ean },
  }));
  const ship = getShipping();
  const stores: RowData[] = offers.map((o) => ({
    name: storeName(o.s),
    sub: o === best ? "Lowest item price" : null,
    price: money(o.p, region),
    status: o.st,
    href: storeUrl(o.s, o.u),
    paid: storePays(o.s),
    highlight: o === best,
    ship: deliveryNote(ship[o.s], o.p, (m) => money(m, region)),
    event: { source: o.s, region, placement, ean: f.ean },
  }));
  return { pinned, overseas, overseasTo: r.name, stores };
}

export function PriceTable({ f, region, ebay, placement = "table" }: { f: Product; region: RegionCode; ebay?: EbayPick; placement?: string }) {
  return <PriceRows {...priceRows(f, region, ebay, placement)} />;
}
