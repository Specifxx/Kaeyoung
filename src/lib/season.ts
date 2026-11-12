// The holiday look (owner, 2026-11-01: "make all of the sites Christmas themed … KaeYoung, maybe we can make it less
// gamified, professional Christmas"): from 1 November through Boxing Day, every year, by the VISITOR'S OWN calendar.
// Decided in the browser before first paint by SEASON_BOOT_SCRIPT, never on the server: every page is a static file built
// once a day, and the look turns itself off on 27 December with no deploy. globals.css keys everything on
// `html[data-season="christmas"]`; without JavaScript the site keeps its usual look.
//
// To switch it off early, set CHRISTMAS_TO to yesterday's month and day: no other file decides it. `?season=christmas`
// previews it out of season, `?season=off` hides it.

// The festive layer (owner, 2026-11-12: "more festive again", after the 2026-11-08 tone-down): TASTEFUL ACCENTS only, all
// behind the window above. A gift-guide banner on the home page (the old pill, upgraded), a 3px cranberry-and-pine
// hairline at the top of every page, and the same two colours on the gifts line and the Black Friday strip, through
// colour tokens. No snow, lights, hats, stripes, palette swap, animation or extra request. ONE OFF SWITCH: set this to
// false (any time after New Year, or just let the window end on 26 December) and the banner markup, the
// `data-festive` attribute and so the hairline and the accents are gone; the plain "Holiday Edit" pill remains until
// the window closes. DECISIONS.md, 2026-11-12.
export const CHRISTMAS_FESTIVE_LAYER = true;

export const CHRISTMAS_FROM = 1101; // mmdd, inclusive
export const CHRISTMAS_TO = 1226;

/** Whether a local calendar date falls in the holiday window (any year). */
export function isChristmas(d: Date): boolean {
  const k = (d.getMonth() + 1) * 100 + d.getDate();
  return k >= CHRISTMAS_FROM && k <= CHRISTMAS_TO;
}

export const SEASON_BOOT_SCRIPT = `(function(){try{var s=null,q=(typeof location!="undefined"&&location.search.match(/[?&]season=([a-z]+)/)||[])[1];if(q){if(q==="christmas")s=q}else{var n=new Date(),m=(n.getMonth()+1)*100+n.getDate();if(m>=${CHRISTMAS_FROM}&&m<=${CHRISTMAS_TO})s="christmas"}if(s){document.documentElement.setAttribute("data-season",s);${CHRISTMAS_FESTIVE_LAYER ? 'document.documentElement.setAttribute("data-festive","1");' : ""}}}catch(e){}})();`;
