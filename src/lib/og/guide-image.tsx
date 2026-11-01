import fs from "node:fs";
import path from "node:path";
import { ImageResponse } from "next/og";
import { REGION_BY_CODE, type RegionCode } from "@/site";
import { money, niceDate, pct } from "@/lib/format";
import { storeName } from "@/lib/data";
import type { ShareRow } from "./share-rows";

// A price guide's share card: the region's best-stocked products where the same
// barcode costs clearly more at one store than another, cheapest and dearest
// side by side. Drawn once per guide at the day's build (generateStaticParams),
// never per request. Text only, in the site's light pastel look: no product
// photo (the stores' own, not ours to put on a card) and no brand packaging.
// Reddit and X keep a post's thumbnail forever, so look at every card before
// a post goes out.
export const GUIDE_IMAGE_SIZE = { width: 1200, height: 630 };

const INK = "#2d1f2e";
const SOFT = "#786676";
const LINE = "#f3e1e8";
const ACCENT = "#de487e";
const SAVE = "#167d50";
const SAVE_PALE = "#e4f5ec";

const font = (f: string) => fs.readFileSync(path.join(process.cwd(), "src/lib/og/fonts", f));
const ICON =
  "data:image/svg+xml;base64," +
  Buffer.from(fs.readFileSync(path.join(process.cwd(), "src/app/icon.svg"))).toString("base64");

/** The size moves to the line under the name, so a long name loses words, never its size. */
const shortName = (name: string) => name.replace(/\s*\(?\d+(\.\d+)?\s*(ml|g|oz|fl\.? ?oz|ea|pcs|sheets?|pads?)\b.*$/i, "").trim() || name;

export function guideImage(opts: { region: RegionCode; title: string; kicker: string; rows: ShareRow[]; asOf: string | null }) {
  const { region, title, kicker, rows, asOf } = opts;
  const r = REGION_BY_CODE[region];
  const cell = { display: "flex", justifyContent: "flex-end", width: 150 } as const;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          padding: "36px 60px 30px",
          color: INK,
          fontFamily: "Inter",
          backgroundColor: "#fffafb",
          backgroundImage: "radial-gradient(circle at 0% 0%, #ffe4d6 0%, rgba(255,250,251,0) 45%), radial-gradient(circle at 100% 0%, #ece6ff 0%, rgba(255,250,251,0) 40%)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
            <img src={ICON} width={44} height={44} />
            <div style={{ display: "flex", fontFamily: "Fraunces", fontSize: 32 }}>KaeYoung</div>
          </div>
          <div style={{ display: "flex", fontSize: 18, letterSpacing: 2, color: SOFT, textTransform: "uppercase" }}>{kicker}</div>
        </div>
        <div style={{ display: "flex", marginTop: 18, fontFamily: "Fraunces", fontSize: 44, lineHeight: 1.08, letterSpacing: -1 }}>{title}</div>
        {rows.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", marginTop: 18, backgroundColor: "#ffffff", border: `2px solid ${LINE}`, borderRadius: 22, padding: "8px 26px" }}>
            <div style={{ display: "flex", fontSize: 15, letterSpacing: 2, color: SOFT, padding: "8px 0 6px", borderBottom: `2px solid ${LINE}` }}>
              <div style={{ display: "flex", flex: 1 }}>{`SAME PRODUCT, SAME SIZE · ${r.currency}`}</div>
              <div style={cell}>CHEAPEST</div>
              <div style={cell}>DEAREST</div>
              <div style={{ ...cell, width: 130 }}>SAVE</div>
            </div>
            {rows.map((x, i) => (
              <div key={x.slug} style={{ display: "flex", alignItems: "center", padding: "8px 0", borderTop: i ? `1px solid ${LINE}` : "none" }}>
                <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0, paddingRight: 16 }}>
                  <div style={{ display: "flex", fontSize: 23, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{shortName(x.name)}</div>
                  <div style={{ display: "flex", fontSize: 16, color: SOFT, marginTop: 2 }}>{`${x.size && !/^1 [a-z]+$/i.test(x.size) ? `${x.size} · ` : ""}${x.stores} stores · cheapest at ${storeName(x.loStore)}`}</div>
                </div>
                <div style={{ ...cell, fontSize: 25, fontWeight: 700, color: ACCENT }}>{money(x.lo, region)}</div>
                <div style={{ ...cell, fontSize: 23, color: SOFT }}>{money(x.hi, region)}</div>
                <div style={{ ...cell, width: 130 }}>
                  <div style={{ display: "flex", fontSize: 20, fontWeight: 700, color: SAVE, backgroundColor: SAVE_PALE, borderRadius: 999, padding: "4px 14px" }}>{`−${pct(x.save)}`}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: "flex", marginTop: 26, fontSize: 30, color: SOFT }}>Korean skincare prices from real K-beauty stores, matched by the barcode on the box.</div>
        )}
        <div style={{ display: "flex", marginTop: "auto", fontSize: 17, color: SOFT, justifyContent: "space-between" }}>
          <div style={{ display: "flex" }}>{`Item prices before shipping${asOf ? `, ${niceDate(asOf)}` : ""}. Matched by barcode.`}</div>
          <div style={{ display: "flex", color: INK, fontWeight: 700 }}>kaeyoung.com</div>
        </div>
      </div>
    ),
    {
      ...GUIDE_IMAGE_SIZE,
      fonts: [
        { name: "Fraunces", data: font("fraunces-latin-500-normal.woff"), weight: 500, style: "normal" },
        { name: "Inter", data: font("inter-latin-500-normal.woff"), weight: 500, style: "normal" },
        { name: "Inter", data: font("inter-latin-700-normal.woff"), weight: 700, style: "normal" },
      ],
    },
  );
}
