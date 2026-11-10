"use client";
// The product tiles of a TileGrid (ProductTile.tsx), drawn from compact rows. Server-rendered like any client
// component, so the HTML holds every tile, name and price; only the rows (not the markup) ride the RSC payload.
// Short classes (.pt-*) live in globals.css. The quick view (QuickView.tsx) reads the name, brand and photo from the
// tile itself and the slug from its href, so the link carries an empty data-qv.
import Link from "next/link";
import { REGION_BY_CODE, type RegionCode } from "@/site";
import { money } from "@/lib/format";
import { Stars } from "./reviews/Stars";

/** [slug, name, brand, img, rating×10, ratings, per region [minor price | -1 sold out | -2 not sold, stores, save %]] */
export type TileRow = [string, string, string, string, number, number, [number, number, number][]];

export function Tiles({ rows, codes, one }: { rows: TileRow[]; codes: RegionCode[]; one: boolean }) {
  // `one`: a list already split by region shows its prices without the region switch.
  const cls = (code: RegionCode, extra = "") => (one ? extra || undefined : `rp rp-${code}${extra ? ` ${extra}` : ""}`);
  return (
    <>
      {rows.map(([slug, name, brand, img, stars, n, prices]) => {
        const short = brand && name.startsWith(brand) ? name.slice(brand.length).trim() : name;
        return (
          <Link key={slug} prefetch={false} href={`/product/${slug}`} data-qv="" className="card tile-hover pt">
            <div className="pt-i">
              {img ? (
                <img src={img} alt={name} loading="lazy" decoding="async" referrerPolicy="no-referrer" className="pt-im" />
              ) : (
                <div className="pt-ph" aria-label={`${name} (no photo yet)`} role="img">
                  <span aria-hidden>{brand || "K-beauty"}</span>
                </div>
              )}
              {prices.map(([, , save], i) =>
                save ? (
                  <span key={codes[i]} className={cls(codes[i], "pt-s")}>
                    {`Save ${save}%`}
                  </span>
                ) : null,
              )}
            </div>
            <div className="pt-b">
              {brand && <p className="eyebrow truncate">{brand}</p>}
              <h3 className="pt-n">{short}</h3>
              {n > 0 && (
                <p className="pt-st">
                  <Stars value={stars / 10} size={12} /> {n}
                </p>
              )}
              <div className="pt-r">
                {prices.map(([p, stores], i) => {
                  const code = codes[i];
                  return p >= 0 ? (
                    <p key={code} className={cls(code)}>
                      <b>{money(p, code)}</b>
                      <small>{`${stores} store${stores === 1 ? "" : "s"}`}</small>
                    </p>
                  ) : (
                    <p key={code} className={cls(code, "pt-x")}>
                      {`${p === -1 ? "Sold out" : "Not sold"} ${REGION_BY_CODE[code].phrase}${p === -1 ? "" : " yet"}`}
                    </p>
                  );
                })}
              </div>
            </div>
          </Link>
        );
      })}
    </>
  );
}
