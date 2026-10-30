// Star ratings, drawn in plain HTML (server or client): five outline stars
// with a filled copy clipped to the average on top.
const PATH = "M10 1.6l2.6 5.3 5.8.8-4.2 4.1 1 5.8L10 14.9l-5.2 2.7 1-5.8L1.6 7.7l5.8-.8z";

function Row({ filled, size }: { filled: boolean; size: number }) {
  return (
    <span className="flex">
      {[0, 1, 2, 3, 4].map((i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 20 20" aria-hidden className="shrink-0">
          <path d={PATH} fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
        </svg>
      ))}
    </span>
  );
}

export function Stars({ value, size = 14, className = "" }: { value: number; size?: number; className?: string }) {
  const pct = Math.max(0, Math.min(100, (value / 5) * 100));
  return (
    <span role="img" aria-label={`${value.toFixed(1)} out of 5 stars`} className={`relative inline-flex text-star ${className}`}>
      <Row filled={false} size={size} />
      <span className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: `${pct}%` }}>
        <Row filled size={size} />
      </span>
    </span>
  );
}
