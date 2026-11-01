// The mark: a rose-to-peach rounded square with a white "K" drawn in strokes
// and one white dewdrop. Same as src/app/icon.svg.
export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden>
      <defs>
        <linearGradient id="ky-mark" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f05d93" />
          <stop offset="1" stopColor="#ffa07a" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="60" height="60" rx="16" fill="url(#ky-mark)" />
      <path d="M23 16v32M24 34l17-18M30 28l14 20" stroke="#fff" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <circle cx="47" cy="22" r="4.5" fill="#fff" opacity=".9" />
    </svg>
  );
}

export function Logo() {
  return (
    <span className="flex items-center gap-2.5">
      <LogoMark />
      <span className="flex flex-col leading-none">
        <span className="font-display text-[22px] font-semibold tracking-tight text-ink">KaeYoung</span>
        <span className="mt-0.5 hidden text-[10px] font-medium uppercase tracking-[0.2em] text-soft sm:block">Stay young</span>
      </span>
    </span>
  );
}
