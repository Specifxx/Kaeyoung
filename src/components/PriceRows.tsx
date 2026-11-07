// The rows of a price table, shared by the product page and the quick view.
// Pinned rows (eBay first, Amazon second) sit above the stores, drawn like a
// store row and labelled "Paid link"; they are never counted as a store or the best price.
import type { Offer } from "@/lib/types";
import { OutLink } from "./OutLink";
import { AMAZON_PRICE_DISCLAIMER, AmazonPrice } from "./AmazonPrice";
import { StoreVote } from "./StoreVote";
import { CartAddButton } from "./cart/CartAddButton";

const STOCK: Record<Offer["st"], { label: string; cls: string }> = {
  in: { label: "In stock", cls: "bg-save-pale text-save" },
  out: { label: "Sold out", cls: "bg-subtle text-soft" },
};

export interface RowData {
  name: string;
  sub: string | null;
  price: string | null;
  status: Offer["st"] | null;
  href: string;
  paid: boolean;
  highlight?: boolean;
  /** eBay and Amazon: pinned first (owner, 2026-10-30), drawn exactly like a store row (owner, 2026-11-01). */
  brand?: "ebay" | "amazon";
  /** eBay or Amazon with no price to show: an "Also check on …" search row, tinted to stand out (owner, 2026-11-06). */
  check?: boolean;
  /** A link to our own page (the quick view's Amazon row): same tab, never an outbound click. */
  internal?: boolean;
  /** The price is the cheapest listing the last search found: shown as "from". */
  from?: boolean;
  /** Stores: what delivery costs (lib/shipping.ts deliveryNote), when known. */
  ship?: string | null;
  /** A multi-buy or free gift the store's own cart applied today (lib/promos.ts dealNote): a note, never the price. */
  deal?: string | null;
  /** the store's own name for that discount ("Buy 2 save 10%") */
  dealLabel?: string | null;
  /** The retailer's live Awin offers and vouchers (lib/promos.ts offerNote), with their end dates. */
  offer?: string | null;
  /** Amazon's own price from the Creators API (lib/amazon-live.ts): shown with its time, hidden after 24 hours. */
  live?: { at: string; timeZone: string; zoneLabel: string };
  /** the link opens the store's checkout with the item in it (lib/affiliate.ts buyLink) */
  checkout?: boolean;
  event: { source: string; region: string; placement: string; ean?: string; to?: string };
  /** Stores only: the store's own listing URL, for the shared thumbs up / down (StoreVote.tsx). */
  vote?: string;
  /** In-stock stores only: the cart list's line (components/cart, owner 2026-11-06). */
  cart?: { title: string; image: string | null; priceCents: number; currency: string };
}

export interface RowsData {
  pinned: RowData[];
  /** Big international retailers (YesStyle, Stylevana…): search links, no price. */
  overseas?: RowData[];
  /** the region's name, for "Big retailers that deliver to Australia" */
  overseasTo?: string;
  stores: RowData[];
}

export function PriceRows({ pinned, overseas = [], overseasTo, stores }: RowsData) {
  return (
    <div className="space-y-2">
      {pinned.length > 0 && (
        <div className="space-y-2" aria-label="Also sold by">
          {pinned.map((r) => (
            <Row key={r.name} {...r} />
          ))}
          {pinned.some((r) => r.live) && <p className="px-1 text-[11px] text-soft">* Amazon price: {AMAZON_PRICE_DISCLAIMER}</p>}
        </div>
      )}
      <ol data-reveal="stagger" className="space-y-2">
        {stores.map((r) => (
          <li key={r.event.source}>
            <Row {...r} />
          </li>
        ))}
      </ol>
      {/* Below every store row (owner, 2026-11-06: the price rows run straight on from eBay and Amazon). */}
      {overseas.length > 0 && (
        <div className="rounded-xl border border-dashed border-line bg-card px-3.5 py-3" aria-label="Big retailers that deliver here">
          <p className="text-sm font-semibold">Big K-beauty retailers that deliver{overseasTo ? ` to ${overseasTo}` : ""}</p>
          <p className="mt-0.5 text-xs text-soft">
            Not part of the store comparison: we can&apos;t read their prices, so each button searches their site. Compare at their checkout, with delivery and any import charges.
          </p>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {overseas.map((r) => (
              <OutLink key={r.name} href={r.href} paid={r.paid} event={r.event} className="btn-pop border border-line bg-card px-3.5 py-1.5 text-sm text-ink hover:border-soft">
                {r.name} <span className="text-xs font-normal text-soft">· {r.sub}{r.paid ? " · Paid link" : ""}</span>
                {r.offer && <span className="text-xs font-medium text-accent-deep">· {r.offer}</span>} <span aria-hidden>→</span>
              </OutLink>
            ))}
          </div>
        </div>
      )}
      {stores.some((r) => r.checkout) && (
        <p className="px-1 text-[11px] text-soft">&ldquo;Buy&rdquo; opens that store&apos;s own checkout with this item in the bag. You pay the store directly.</p>
      )}
    </div>
  );
}

/** The deal and offer lines under a row, in the accent colour: the store's word, dated, never part of the price. */
function Deals({ deal, dealLabel, offer }: Pick<RowData, "deal" | "dealLabel" | "offer">) {
  if (!deal && !offer) return null;
  return (
    <>
      {deal && (
        <span className="block w-full text-xs font-medium text-accent-deep">
          <span className="chip mr-1.5 bg-accent/10 text-accent-deep">{dealLabel ?? "Multi-buy"}</span>
          {deal} <span className="font-normal text-soft">· applied in the store&apos;s cart</span>
        </span>
      )}
      {offer && (
        <span className="block w-full text-xs font-medium text-accent-deep">
          <span className="chip mr-1.5 bg-accent/10 text-accent-deep">Offer</span>
          {offer}
        </span>
      )}
    </>
  );
}

function Row({ name, sub, price, status, href, paid, highlight = false, brand, check = false, internal = false, from = false, ship, live, checkout = false, deal, dealLabel, offer, event, vote, cart }: RowData) {
  const s = status ? STOCK[status] : null;
  return (
    <div
      className={`mo-row flex items-center gap-3 rounded-xl border px-3.5 py-3 ${check ? "border-accent/50 bg-accent/5" : "bg-card"} ${
        // eBay with a price: a green outline (owner, 2026-11-06); the cheapest store a sky-blue one, so it never reads as eBay's
        // green or Amazon's amber (owner, 2026-11-07: "the cheapest listing should also have an outline too").
        check ? "" : brand === "ebay" && price ? "border-save" : brand === "amazon" && price ? "border-[#f59e0b]" : highlight ? "border-[#0ea5e9]" : "border-line"
      } ${status === "out" ? "opacity-60" : ""}`}
    >
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 font-semibold">
          <span className={check ? "min-w-0" : "min-w-0 max-w-full truncate"}>{name}</span>
          {vote && <StoreVote url={vote} name={name} className="shrink-0 text-xs font-normal text-soft" />}
        </p>
        <p className="flex flex-wrap items-center gap-1.5 text-xs text-soft">
          {s && <span className={`chip ${s.cls}`}>{s.label}</span>}
          {sub && <span className={highlight ? "font-semibold text-save" : ""}>{sub}</span>}
          {ship && <span>{ship}</span>}
          {paid && <span>Paid link</span>}
          {/* Phones: the cart list's add button as a word on this line, where the row has no width to spare. */}
          {cart && vote && (
            <CartAddButton inline href={href} productUrl={vote} storeName={name} title={cart.title} priceCents={cart.priceCents} currency={cart.currency} image={cart.image} className="text-xs sm:hidden" />
          )}
          <Deals deal={deal} dealLabel={dealLabel} offer={offer} />
        </p>
      </div>
      {price && live && <AmazonPrice price={price} at={live.at} timeZone={live.timeZone} zoneLabel={live.zoneLabel} />}
      {price && !live && (
        <span className={`text-lg font-semibold tabular-nums ${highlight ? "text-accent-deep" : ""}`}>
          {from && <span className="mr-1 text-xs font-normal text-soft">from</span>}
          {price}
        </span>
      )}
      {cart && vote && (
        <CartAddButton href={href} productUrl={vote} storeName={name} title={cart.title} priceCents={cart.priceCents} currency={cart.currency} image={cart.image} className="hidden text-soft sm:inline-flex" />
      )}
      {internal ? (
        <a href={href} className="btn-pop btn-buy shrink-0 px-4 py-1.5">
          {check && brand ? `Check ${brand === "ebay" ? "eBay" : "Amazon"}` : brand ? "Shop" : status === "out" ? "View" : checkout ? "Buy" : price ? "Shop" : "Search"} <span aria-hidden>→</span>
        </a>
      ) : (
        <OutLink
          href={href}
          paid={paid}
          event={event}
          title={checkout ? `Opens ${name}'s checkout with this item` : undefined}
          className={`btn-pop shrink-0 px-4 py-1.5 ${
            brand || (price && status !== "out") ? "btn-buy" : "border border-line bg-card text-ink hover:border-soft"
          }`}
        >
          {check && brand ? `Check ${brand === "ebay" ? "eBay" : "Amazon"}` : brand ? "Shop" : status === "out" ? "View" : checkout ? "Buy" : price ? "Shop" : "Search"} <span aria-hidden>→</span>
        </OutLink>
      )}
    </div>
  );
}
