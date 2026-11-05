// One region's price table. Stores are in price order (orderable first), each
// with what delivery costs when its weekly quote is known (lib/shipping.ts);
// eBay and Amazon take the top two rows (owner, 2026-10-30), drawn exactly like
// a store row (owner, 2026-11-01: "blend in and look exactly the same"), then the
// beauty partners; all sit above the stores, labelled "Paid link", never counted
// as a store and never the "best price" (family rule: commission never re-ranks).
import { REGION_BY_CODE, type RegionCode } from "@/site";
import { amazonItemUrl, amazonSearchUrl, ebayAffiliateUrl, ebaySearchUrl, ebayShopHost, partnersFor, storePays, storeUrl, subId } from "@/lib/affiliate";
import { getShipping, storeName } from "@/lib/data";
import { AMAZON_CLOCK, amazonLive } from "@/lib/amazon-live";
import { deliveryNote } from "@/lib/shipping";
import { money } from "@/lib/format";
import type { EbayPick, Product } from "@/lib/types";
import { PriceRows, type RowData, type RowsData } from "./PriceRows";

export function searchQuery(f: Product): string {
  return f.name.replace(/[()]/g, " ").replace(/\s+/g, " ").trim();
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
  // Never in the quick view (2026-11-02): Amazon's Operating Agreement allows no Amazon link in a pop-up window.
  // Amazon's own listing and price when this build's Creators API lookup matched the barcode (2026-11-05), else a search.
  const live = placement.startsWith("quickview") ? null : amazonLive(f.ean, region);
  const liveUrl = live && amazonItemUrl(live.asin, region, sub);
  const amazonUrl = placement.startsWith("quickview") ? null : (liveUrl ?? amazonSearchUrl(q, region, sub));
  const clock = AMAZON_CLOCK[region];
  const pinned: RowData[] = [];
  if (ebayUrl)
    pinned.push({
      name: "eBay",
      // The cheapest new local listing the last search found, delivered: listings come and go, so "from".
      sub: ebay ? `New, ${ebay.sh ? "incl. postage" : "free postage"}` : `New listings on ${ebayShopHost(region)?.replace("www.", "")}`,
      brand: "ebay",
      price: ebay ? money(ebay.p, region) : null,
      from: !!ebay,
      status: null,
      href: ebayUrl,
      paid: true,
      event: { source: "ebay", region, placement: `${placement}_pinned`, ean: f.ean },
    });
  if (amazonUrl)
    pinned.push({
      name: "Amazon",
      sub: liveUrl ? `${r.amazonHost?.replace("www.", "")} · new, this exact barcode` : `${r.amazonHost?.replace("www.", "")} · check the seller`,
      brand: "amazon",
      price: liveUrl && live ? money(live.p, region) : null,
      status: null,
      href: amazonUrl,
      live: liveUrl && live && clock ? { at: live.at, timeZone: clock.timeZone, zoneLabel: clock.label } : undefined,
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
