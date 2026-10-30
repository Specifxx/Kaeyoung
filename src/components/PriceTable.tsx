// One region's price table. Stores are in price order (orderable first);
// eBay and Amazon take the top two rows in their own button colours, then the
// beauty partners (owner, 2026-10-30); all sit pinned
// above them, labelled, never counted as a store and never the "best price"
// (family rule: paid rows pinned, commission never re-ranks).
import { REGION_BY_CODE, type RegionCode } from "@/site";
import { amazonSearchUrl, ebayAffiliateUrl, ebaySearchUrl, ebayShopHost, partnersFor, storePays, storeUrl, subId } from "@/lib/affiliate";
import { storeName } from "@/lib/data";
import { money } from "@/lib/format";
import type { EbayPick, Offer, Product } from "@/lib/types";
import { OutLink } from "./OutLink";

const STOCK: Record<Offer["st"], { label: string; cls: string }> = {
  in: { label: "In stock", cls: "bg-save-pale text-save" },
  out: { label: "Sold out", cls: "bg-subtle text-soft" },
};

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

export function PriceTable({ f, region, ebay, placement = "table" }: { f: Product; region: RegionCode; ebay?: EbayPick; placement?: string }) {
  const offers = f.offers[region] ?? [];
  const r = REGION_BY_CODE[region];
  const best = offers.find((o) => o.st !== "out");
  const q = searchQuery(f);
  const sub = subId(region, `${placement}_pinned`, f.ean);
  const ebayUrl = ebay ? ebayAffiliateUrl(ebay.u, sub) : ebaySearchUrl(q, region, sub);
  const amazonUrl = amazonSearchUrl(q, region, sub);
  const partners = partnersFor(region, q, sub);
  return (
    <div className="space-y-2">
      {(ebayUrl || amazonUrl || partners.length > 0) && (
        <div className="space-y-2" aria-label="Also sold by">
          {ebayUrl && (
            <Row
              name="eBay"
              sub={ebay ? vsBest(ebay.p, best?.p) : `new listings on ${ebayShopHost(region)?.replace("www.", "")}`}
              brand="ebay"
              price={ebay ? money(ebay.p, region) : null}
              status={null}
              href={ebayUrl}
              paid
              event={{ source: "ebay", region, placement: `${placement}_pinned`, ean: f.ean }}
            />
          )}
          {amazonUrl && (
            <Row
              name="Amazon"
              sub={`${r.amazonHost?.replace("www.", "")} · check the seller`}
              brand="amazon"
              price={null}
              status={null}
              href={amazonUrl}
              paid
              event={{ source: "amazon", region, placement: `${placement}_pinned`, ean: f.ean }}
            />
          )}
          {partners.map(({ p, href }) => (
            <Row
              key={p.key}
              name={`Search ${p.name}`}
              sub={p.note}
              price={null}
              status={null}
              href={href}
              paid
              event={{ source: p.key, region, placement: `${placement}_pinned`, ean: f.ean }}
            />
          ))}
        </div>
      )}
      <ol className="space-y-2">
        {offers.map((o) => (
          <li key={o.s}>
            <Row
              name={storeName(o.s)}
              sub={o === best ? "Cheapest store" : null}
              price={money(o.p, region)}
              status={o.st}
              href={storeUrl(o.s, o.u)}
              paid={storePays(o.s)}
              highlight={o === best}
              event={{ source: o.s, region, placement, ean: f.ean }}
            />
          </li>
        ))}
      </ol>
    </div>
  );
}

function Row({
  name,
  sub,
  price,
  status,
  href,
  paid,
  highlight = false,
  tint = "bg-card",
  brand,
  event,
}: {
  name: string;
  sub: string | null;
  price: string | null;
  status: Offer["st"] | null;
  href: string;
  paid: boolean;
  highlight?: boolean;
  tint?: string;
  /** eBay and Amazon: pinned first, their own button colour (owner, 2026-10-30) */
  brand?: "ebay" | "amazon";
  event: { source: string; region: string; placement: string; ean?: string };
}) {
  const s = status ? STOCK[status] : null;
  return (
    <div
      className={`flex items-center gap-3 rounded-xl border px-3.5 py-3 ${tint} ${
        highlight ? "border-ink/70" : "border-line"
      } ${status === "out" ? "opacity-60" : ""}`}
    >
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 font-semibold">
          <span className={brand ? "shrink-0" : "truncate"}>{name}</span>
          {brand && <span className="chip chip-first">Shown first</span>}
        </p>
        <p className="flex flex-wrap items-center gap-1.5 text-xs text-soft">
          {s && <span className={`chip ${s.cls}`}>{s.label}</span>}
          {sub && <span className={highlight ? "font-semibold text-save" : ""}>{sub}</span>}
          {paid && <span>Paid link</span>}
        </p>
      </div>
      {price && <span className={`text-lg font-semibold tabular-nums ${highlight ? "text-accent-deep" : ""}`}>{price}</span>}
      <OutLink
        href={href}
        paid={paid}
        event={event}
        className={`btn-pop shrink-0 px-4 py-1.5 ${
          brand === "ebay" ? "btn-ebay" : brand === "amazon" ? "btn-amazon" : status === "out" || !price ? "border border-line bg-card text-ink hover:border-soft" : "btn-buy"
        }`}
      >
        {brand ? <><span className="hidden sm:inline">{price ? "Buy" : "Shop"} on</span>{name}</> : status === "out" ? "View" : price ? "Shop" : "Search"} <span aria-hidden>→</span>
      </OutLink>
    </div>
  );
}
