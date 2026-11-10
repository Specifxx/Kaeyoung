// Icons drawn on every store row (the thumbs in StoreVote.tsx, the cart button in cart/CartAddButton.tsx), defined
// once per page here and placed with <use>. A product page draws those rows for six regions, so the full paths on
// each row were a quarter of its HTML (DECISIONS.md 2026-11-10, "Heavy pages"). The paths set no fill: they inherit
// it from the <svg> that uses them, so CSS can fill a pressed thumb.
export const UP_PATH = "M2 10h3v10H2zM7 20h9.3a2 2 0 0 0 2-1.6l1.6-7A2 2 0 0 0 18 9h-5V5a2 2 0 0 0-2-2l-4 7z";
export const DOWN_PATH = "M2 4h3v10H2zM7 4h9.3a2 2 0 0 1 2 1.6l1.6 7A2 2 0 0 1 18 15h-5v4a2 2 0 0 1-2 2l-4-7z";

export function IconSprite() {
  return (
    <svg width="0" height="0" aria-hidden="true" focusable="false" style={{ position: "absolute", overflow: "hidden" }}>
      <symbol id="i-up" viewBox="0 0 22 24">
        <path d={UP_PATH} stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      </symbol>
      <symbol id="i-down" viewBox="0 0 22 24">
        <path d={DOWN_PATH} stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      </symbol>
      <symbol id="i-cart-add" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="20" r="1.4" />
        <circle cx="18" cy="20" r="1.4" />
        <path d="M2.5 3h2.6l2.2 11.2a1.6 1.6 0 0 0 1.6 1.3h8.7a1.6 1.6 0 0 0 1.6-1.2L21 7H6" />
        <path d="M13 8.5v4.5M10.75 10.75h4.5" />
      </symbol>
    </svg>
  );
}
