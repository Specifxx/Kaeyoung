// KaeYoung's drawings (owner, 2026-10-30: "pretty … very graphic, like Korean
// beauty sites"): simple flat bottles, jars and tubes in the pastel set, drawn
// in SVG so they cost nothing to load and follow the theme. No brand's
// product or packaging is drawn: these are generic shapes.
import type { CatKey } from "@/site";

/** Each routine step's tile colour (globals.css .tint-*). */
export const CAT_TINT: Record<CatKey, string> = {
  cleansers: "tint-sky",
  toners: "tint-lavender",
  serums: "tint-peach",
  moisturisers: "tint-mint",
  sunscreen: "tint-butter",
  masks: "tint-rose",
  "eye-care": "tint-lavender",
  "lip-care": "tint-rose",
  makeup: "tint-peach",
  "body-hair": "tint-mint",
  other: "tint-sky",
};

const INK = "#5b3550";
const ROSE = "#f07aa6";
const PEACH = "#ffb592";
const LAV = "#b9a6f5";
const MINT = "#7fd3b2";
const BUTTER = "#ffd66b";
const SKY = "#8ec5ff";
const WHITE = "#fffdfd";

const S = { stroke: INK, strokeWidth: 1.6, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };

/** A small drawing for a routine step, 48×48. */
export function CatIcon({ cat, size = 40 }: { cat: CatKey; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden>
      {ICONS[cat]}
    </svg>
  );
}

const ICONS: Record<CatKey, React.ReactNode> = {
  // foam pump bottle
  cleansers: (
    <g {...S}>
      <path d="M21 6h8v4h-8z" fill={WHITE} />
      <path d="M29 7h5" />
      <rect x="18" y="10" width="14" height="5" rx="1.5" fill={SKY} />
      <rect x="14" y="15" width="22" height="27" rx="6" fill={WHITE} />
      <path d="M14 30h22" />
      <circle cx="25" cy="22.5" r="2.5" fill={SKY} />
    </g>
  ),
  // tall toner bottle
  toners: (
    <g {...S}>
      <rect x="19" y="5" width="10" height="7" rx="2" fill={LAV} />
      <path d="M17 14q0-2 2-2h10q2 0 2 2v26q0 3-3 3h-8q-3 0-3-3z" fill={WHITE} />
      <rect x="20" y="22" width="8" height="11" rx="1.5" fill={LAV} />
    </g>
  ),
  // dropper bottle
  serums: (
    <g {...S}>
      <path d="M21 4q3-2 6 0v6h-6z" fill={PEACH} />
      <rect x="19" y="10" width="10" height="5" rx="1.5" fill={WHITE} />
      <path d="M14 21q0-6 6-6h8q6 0 6 6v16q0 6-6 6h-8q-6 0-6-6z" fill={PEACH} />
      <path d="M19 24q0 4 5 4" stroke={WHITE} strokeWidth="2" />
    </g>
  ),
  // cream jar
  moisturisers: (
    <g {...S}>
      <rect x="9" y="16" width="30" height="8" rx="3" fill={MINT} />
      <path d="M11 24h26v12q0 6-6 6H17q-6 0-6-6z" fill={WHITE} />
      <path d="M17 32h14" />
      <circle cx="35" cy="9" r="2" fill={MINT} />
      <circle cx="40" cy="14" r="1.2" fill={MINT} />
    </g>
  ),
  // tube with a sun
  sunscreen: (
    <g {...S}>
      <path d="M15 8h14l-2 30H17z" fill={WHITE} transform="rotate(-18 22 24)" />
      <rect x="14" y="36" width="12" height="6" rx="1.5" fill={BUTTER} transform="rotate(-18 22 24)" />
      <circle cx="35" cy="13" r="5" fill={BUTTER} />
      <path d="M35 4v2M35 20v2M26 13h2M42 13h2M29 7l1.4 1.4M39.6 17.6 41 19M29 19l1.4-1.4M39.6 8.4 41 7" />
    </g>
  ),
  // sheet mask
  masks: (
    <g {...S}>
      <path d="M24 5c9 0 15 7 15 17s-6 21-15 21S9 32 9 22 15 5 24 5z" fill={WHITE} />
      <ellipse cx="18" cy="20" rx="3.5" ry="2" fill={ROSE} />
      <ellipse cx="30" cy="20" rx="3.5" ry="2" fill={ROSE} />
      <path d="M20 33q4 3 8 0" />
      <circle cx="16" cy="27" r="2" fill={ROSE} opacity=".35" stroke="none" />
      <circle cx="32" cy="27" r="2" fill={ROSE} opacity=".35" stroke="none" />
    </g>
  ),
  // hydrogel eye patches
  "eye-care": (
    <g {...S}>
      <path d="M6 22q8 14 17 2-8-6-17-2z" fill={LAV} />
      <path d="M42 22q-8 14-17 2 8-6 17-2z" fill={LAV} />
      <path d="M12 14q4-3 8 0M28 14q4-3 8 0" />
    </g>
  ),
  // lip balm stick
  "lip-care": (
    <g {...S}>
      <path d="M20 8q4-4 8 0v8h-8z" fill={ROSE} />
      <rect x="18" y="16" width="12" height="6" rx="1.5" fill={WHITE} />
      <rect x="16" y="22" width="16" height="20" rx="3" fill={ROSE} />
      <path d="M21 28v8" stroke={WHITE} strokeWidth="2" />
    </g>
  ),
  // cushion compact
  makeup: (
    <g {...S}>
      <ellipse cx="24" cy="15" rx="16" ry="6" fill={PEACH} />
      <path d="M8 15v4q0 6 16 6t16-6v-4" fill={WHITE} />
      <path d="M8 27q0 6 16 6t16-6v6q0 6-16 6T8 33z" fill={PEACH} />
      <circle cx="24" cy="15" r="2.2" fill={WHITE} />
    </g>
  ),
  // body lotion pump
  "body-hair": (
    <g {...S}>
      <path d="M22 4h4v6h-4zM26 6h7" />
      <rect x="19" y="10" width="10" height="5" rx="1.5" fill={MINT} />
      <path d="M13 21q0-6 6-6h10q6 0 6 6v17q0 5-5 5H18q-5 0-5-5z" fill={WHITE} />
      <path d="M18 28q3-3 6 0t6 0" stroke={MINT} strokeWidth="2.2" />
    </g>
  ),
  // sparkle
  other: (
    <g {...S}>
      <path d="M24 6q2 12 14 14-12 2-14 14-2-12-14-14 12-2 14-14z" fill={SKY} />
      <path d="M37 32q1 5 5 6-4 1-5 6-1-5-5-6 4-1 5-6z" fill={ROSE} />
    </g>
  ),
};

/** The hero drawing: a shelf of generic K-beauty products among petals. */
export function HeroArt({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 420 340" className={className} aria-hidden role="presentation">
      <defs>
        <linearGradient id="ky-glass" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffd3e2" />
          <stop offset="1" stopColor="#f58fb5" />
        </linearGradient>
        <linearGradient id="ky-lav" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#efe9ff" />
          <stop offset="1" stopColor="#c3b2fb" />
        </linearGradient>
        <linearGradient id="ky-peach" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffe9dd" />
          <stop offset="1" stopColor="#ffb999" />
        </linearGradient>
      </defs>
      {/* soft round backdrop */}
      <circle cx="215" cy="170" r="150" fill="#ffe9f1" />
      <circle cx="320" cy="95" r="60" fill="#efe9ff" />
      <circle cx="95" cy="250" r="55" fill="#e3f7ef" />
      {/* shelf */}
      <rect x="55" y="268" width="320" height="12" rx="6" fill="#f7cfdd" />
      <g {...S} strokeWidth="2.2">
        {/* tall toner */}
        <rect x="92" y="98" width="30" height="20" rx="5" fill="#c3b2fb" />
        <path d="M80 126q0-8 8-8h38q8 0 8 8v134q0 8-8 8H88q-8 0-8-8z" fill="url(#ky-lav)" />
        <rect x="92" y="170" width="30" height="46" rx="5" fill={WHITE} />
        {/* serum dropper */}
        <path d="M178 54q10-8 20 0v26h-20z" fill="#f58fb5" />
        <rect x="171" y="80" width="34" height="18" rx="5" fill={WHITE} />
        <path d="M152 128q0-30 30-30h12q30 0 30 30v112q0 28-28 28h-16q-28 0-28-28z" fill="url(#ky-glass)" />
        <path d="M170 140q0 22 22 24" stroke={WHITE} strokeWidth="5" opacity=".8" />
        {/* cream jar */}
        <rect x="246" y="200" width="98" height="24" rx="8" fill="#8fdcbf" />
        <path d="M252 224h86v30q0 14-14 14h-58q-14 0-14-14z" fill={WHITE} />
        <path d="M270 246h50" stroke="#8fdcbf" strokeWidth="4" />
        {/* tube leaning */}
        <g transform="rotate(16 300 150)">
          <path d="M280 70h44l-6 112h-32z" fill="url(#ky-peach)" />
          <rect x="284" y="180" width="32" height="18" rx="4" fill="#ffb592" />
          <path d="M290 100h24" />
        </g>
      </g>
      {/* petals and sparkles */}
      <g fill="#f58fb5" opacity=".85">
        <path d="M60 80q12-14 22 0-10 12-22 0z" />
        <path d="M352 236q12-14 22 0-10 12-22 0z" transform="rotate(30 363 236)" />
        <path d="M250 40q10-12 18 0-8 10-18 0z" transform="rotate(-20 259 40)" />
      </g>
      <g fill="#ffd66b">
        <path d="M372 150q2 10 10 12-8 2-10 12-2-10-10-12 8-2 10-12z" />
        <path d="M44 170q1.5 7 7 8.5-5.5 1.5-7 8.5-1.5-7-7-8.5 5.5-1.5 7-8.5z" />
      </g>
      <g fill="#b9a6f5">
        <circle cx="140" cy="50" r="5" />
        <circle cx="392" cy="60" r="4" />
        <circle cx="30" cy="120" r="3.5" />
      </g>
    </svg>
  );
}
