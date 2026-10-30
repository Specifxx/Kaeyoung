// Shown the instant a product link is clicked, while the page's file loads
// (owner, 2026-10-30: "bring the users to the page first then load the
// prices"). The page itself is static, with every price in its HTML.
export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-4 pb-10 pt-5" aria-busy="true" aria-label="Loading">
      <div className="qv-shimmer mb-4 h-4 w-48 rounded" />
      <section className="grid grid-cols-1 gap-8 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="qv-shimmer mx-auto aspect-square w-full max-w-[240px] rounded-2xl sm:max-w-sm md:max-w-none" />
        <div className="space-y-3">
          <div className="qv-shimmer h-3 w-24 rounded" />
          <div className="qv-shimmer h-9 w-4/5 rounded" />
          <div className="qv-shimmer h-9 w-3/5 rounded" />
          <div className="qv-shimmer mt-6 h-40 w-full rounded-2xl" />
        </div>
      </section>
      <div className="mt-10 space-y-2">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="qv-shimmer h-14 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
