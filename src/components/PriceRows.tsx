// The rows of a price table, shared by the product page and the quick view.
// Pinned rows (eBay first, Amazon second) sit above the stores, drawn like a
// store row and labelled "Paid link"; they are never counted as a store or the best price.
import type { Offer } from "@/lib/types";
import { OutLink } from "./OutLink";

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
  /** The price is the cheapest listing the last search found: shown as "from". */
  from?: boolean;
  /** Stores: what delivery costs (lib/shipping.ts deliveryNote), when known. */
  ship?: string | null;
  event: { source: string; region: string; placement: string; ean?: string };
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
        </div>
      )}
      {overseas.length > 0 && (
        <div className="rounded-xl border border-dashed border-line bg-card px-3.5 py-3" aria-label="Big retailers that deliver here">
          <p className="text-sm font-semibold">Big K-beauty retailers that deliver{overseasTo ? ` to ${overseasTo}` : ""}</p>
          <p className="mt-0.5 text-xs text-soft">
            Not part of the store comparison: we can&apos;t read their prices, so each button searches their site. Compare at their checkout, with delivery and any import charges.
          </p>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {overseas.map((r) => (
              <OutLink key={r.name} href={r.href} paid={r.paid} event={r.event} className="btn-pop border border-line bg-card px-3.5 py-1.5 text-sm text-ink hover:border-soft">
                {r.name} <span className="text-xs font-normal text-soft">· {r.sub}{r.paid ? " · Paid link" : ""}</span> <span aria-hidden>→</span>
              </OutLink>
            ))}
          </div>
        </div>
      )}
      <ol className="space-y-2">
        {stores.map((r) => (
          <li key={r.event.source}>
            <Row {...r} />
          </li>
        ))}
      </ol>
    </div>
  );
}

function Row({ name, sub, price, status, href, paid, highlight = false, brand, from = false, ship, event }: RowData) {
  const s = status ? STOCK[status] : null;
  return (
    <div
      className={`flex items-center gap-3 rounded-xl border px-3.5 py-3 bg-card ${
        highlight ? "border-ink/70" : "border-line"
      } ${status === "out" ? "opacity-60" : ""}`}
    >
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 font-semibold">
          <span className="truncate">{name}</span>
        </p>
        <p className="flex flex-wrap items-center gap-1.5 text-xs text-soft">
          {s && <span className={`chip ${s.cls}`}>{s.label}</span>}
          {sub && <span className={highlight ? "font-semibold text-save" : ""}>{sub}</span>}
          {ship && <span>{ship}</span>}
          {paid && <span>Paid link</span>}
        </p>
      </div>
      {price && (
        <span className={`text-lg font-semibold tabular-nums ${highlight ? "text-accent-deep" : ""}`}>
          {from && <span className="mr-1 text-xs font-normal text-soft">from</span>}
          {price}
        </span>
      )}
      <OutLink
        href={href}
        paid={paid}
        event={event}
        className={`btn-pop shrink-0 px-4 py-1.5 ${
          brand || (price && status !== "out") ? "btn-buy" : "border border-line bg-card text-ink hover:border-soft"
        }`}
      >
        {brand ? "Shop" : status === "out" ? "View" : price ? "Shop" : "Search"} <span aria-hidden>→</span>
      </OutLink>
    </div>
  );
}
