// One region's price table. Stores are in price order (orderable first), each
// with what delivery costs when its weekly quote is known (lib/shipping.ts);
// eBay and Amazon take the top two rows (owner, 2026-10-30), drawn exactly like
// a store row (owner, 2026-11-01: "blend in and look exactly the same"), then the
// beauty partners; all sit above the stores, labelled "Paid link", never counted
// as a store and never the "best price" (family rule: commission never re-ranks).
import { REGION_BY_CODE, type RegionCode } from "@/site";
import { amazonItemUrl, buyLink, amazonSearchUrl, ebayAffiliateUrl, ebaySearchUrl, ebayShopHost, partnerAwinId, partnerProductUrl, partnersFor, storePays, subId } from "@/lib/affiliate";
import { getPartnerPrices, getPromos, getShipping, storeName } from "@/lib/data";
import { STORE_BY_ID } from "@/content/stores";
import { awinProgrammeFor } from "@/lib/awin";
import { awinOffers, bestPerItem, dealNote, liveDeal, offerNote, type AwinPromotion } from "@/lib/promos";
import awinPromos from "@/lib/awin-promotions.json";
import { partnerPriceIn } from "@/lib/partner-feed";
import { AMAZON_CLOCK, amazonLive } from "@/lib/amazon-live";
import { deliveryNote } from "@/lib/shipping";
import { money } from "@/lib/format";
import type { EbayPick, Product } from "@/lib/types";
import { PriceRows, type RowData, type RowsData } from "./PriceRows";

const AWIN_OFFERS: AwinPromotion[] = Array.isArray((awinPromos as { promotions?: unknown }).promotions) ? ((awinPromos as { promotions: AwinPromotion[] }).promotions) : [];

/** A retailer's live Awin offers in this region, as one note ("Code GLOW15: 15% off (ends 30 Nov)"), or null. */
function offersNote(advertiserId: number | null, region: RegionCode): string | null {
  const live = awinOffers(AWIN_OFFERS, advertiserId, region);
  return live.length ? live.map(offerNote).join(" · ") : null;
}

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
  // Amazon's own listing and price when this build's Creators API lookup matched the barcode (2026-11-05), else a search.
  // The quick view carries the same tagged link (owner, 2026-11-06: a visitor-opened view of this one product is the
  // Associates policy's "pop-up windows in conjunction with your Site promoting Products closely associated with the
  // materials on your Site"), but never Amazon's price: that stays on the product page (24-hour licence, CLAUDE.md).
  const quick = placement.startsWith("quickview");
  const found = amazonLive(f.ean, region);
  const liveUrl = found && amazonItemUrl(found.asin, region, sub);
  const live = quick ? null : found;
  const amazonUrl = liveUrl ?? amazonSearchUrl(q, region, sub);
  const clock = AMAZON_CLOCK[region];
  const pinned: RowData[] = [];
  const cartTitle = f.brand && !f.name.toLowerCase().startsWith(f.brand.toLowerCase()) ? `${f.brand} ${f.name}` : f.name;
  if (ebayUrl)
    pinned.push({
      // No listing priced: a standout "Also check on eBay" search row instead (owner, 2026-11-06).
      name: ebay ? "eBay" : "Also check on eBay",
      // The cheapest new local listing the last search found, delivered: listings come and go, so "from".
      sub: ebay ? `New, ${ebay.sh ? "incl. postage" : "free postage"}` : `New listings on ${ebayShopHost(region)?.replace("www.", "")}`,
      check: !ebay,
      brand: "ebay",
      price: ebay ? money(ebay.p, region) : null,
      from: !!ebay,
      // A priced eBay row works like a store row (owner, 2026-11-06): in stock, thumbs and the cart list.
      status: ebay ? "in" : null,
      href: ebayUrl,
      ...(ebay ? { vote: ebay.u, cart: { title: cartTitle, image: f.img, priceCents: ebay.p, currency: r.currency } } : {}),
      paid: true,
      event: { source: "ebay", region, placement: `${placement}_pinned`, ean: f.ean },
    });
  // Amazon only with a real price (owner, 2026-11-12): no price, no row, and never in the quick view.
  if (amazonUrl && live)
    pinned.push({
      name: "Amazon",
      sub: liveUrl ? `${r.amazonHost?.replace("www.", "")} · new, this exact barcode` : `${r.amazonHost?.replace("www.", "")} · check the seller`,
      check: !live,
      brand: "amazon",
      price: liveUrl && live ? money(live.p, region) : null,
      // Amazon's own listing works like a store row too; the cart list drops its price after 24 hours (lib/cart-list.ts).
      status: liveUrl && live ? "in" : null,
      href: amazonUrl,
      ...(liveUrl && live ? { vote: liveUrl, cart: { title: cartTitle, image: f.img, priceCents: live.p, currency: r.currency } } : {}),
      live: liveUrl && live && clock ? { at: live.at, timeZone: clock.timeZone, zoneLabel: clock.label } : undefined,
      paid: true,
      event: { source: "amazon", region, placement: `${placement}_pinned`, ean: f.ean },
    });
  // Big international retailers (YesStyle, Stylevana…). One whose affiliate
  // product feed lists this exact barcode (lib/partner-feed.ts, 2026-11-06) gets
  // a row like eBay's and Amazon's, with its own price and a tracked link to the
  // product: pinned, labelled, never a store and never the best price. The rest
  // are a search link each, in their own labelled group, never ranked.
  const overseas: RowData[] = [];
  const feeds = getPartnerPrices();
  for (const { p, href, paid } of partnersFor(region, q, sub)) {
    const event = { source: p.key, region, placement: `${placement}_overseas`, ean: f.ean };
    const fed = paid ? partnerPriceIn(feeds, p.key, region, f.ean) : null;
    const productHref = fed && partnerProductUrl(p, fed.u, sub);
    const offer = paid ? offersNote(partnerAwinId(p), region) : null;
    if (fed && productHref) {
      pinned.push({ name: p.name, sub: `${p.note}, this exact barcode`, price: money(fed.p, region), status: "in", href: productHref, paid: true, offer, event: { ...event, placement: `${placement}_pinned` } });
      continue;
    }
    overseas.push({ name: p.name, sub: p.note, price: null, status: null, href, paid, offer, event });
  }
  const ship = getShipping();
  const promos = getPromos();
  const fmt = (m: number) => money(m, region);
  const stores: RowData[] = offers.map((o) => {
    const link = buyLink(o);
    // A multi-buy or free gift the store's own cart applied (lib/promos.ts): a note, never the row's price or its rank.
    const d = o.st === "in" ? liveDeal(promos, o.s, f.ean, o.p) : null;
    const per = d && bestPerItem(d);
    const lowest = !!(per && best && per.q > 1 && per.each < best.p);
    const store = STORE_BY_ID[o.s];
    return {
      name: storeName(o.s),
      sub: o === best ? "Lowest store price" : null,
      // A sold-out row keeps its place at the bottom with no price (2026-11-06): a stale price there read as a deal.
      price: o.st === "out" ? null : money(o.p, region),
      status: o.st,
      href: link.href,
      vote: o.u,
      checkout: link.to === "checkout",
      paid: storePays(o.s),
      highlight: o === best,
      ship: deliveryNote(ship[o.s], o.p, fmt),
      deal: d ? `${dealNote(d, fmt)}${lowest ? ` · lowest per item if you buy ${per!.q}` : ""}` : null,
      dealLabel: d ? (d.l ?? (d.t.length ? "Multi-buy" : "Free gift")) : null,
      offer: store ? offersNote((p => (p && !p.link ? p.id : null))(awinProgrammeFor(store.base)), region) : null,
      event: { source: o.s, region, placement, ean: f.ean, to: link.to },
      ...(o.st !== "out" ? { cart: { title: cartTitle, image: f.img, priceCents: o.p, currency: r.currency } } : {}),
    };
  });
  return { pinned, overseas, overseasTo: r.name, stores };
}

export function PriceTable({ f, region, ebay, placement = "table" }: { f: Product; region: RegionCode; ebay?: EbayPick; placement?: string }) {
  return <PriceRows {...priceRows(f, region, ebay, placement)} />;
}
