// The product page's ratings and reviews, in the static HTML (Google reads
// them, and the Product JSON-LD's aggregateRating matches what is shown).
import { SITE } from "@/site";
import { niceDate } from "@/lib/format";
import { skinLabel, starsText, type ProductReviews } from "@/lib/reviews";
import { Stars } from "./Stars";
import { ReviewForm } from "./ReviewForm";

export function ReviewsSection({ ean, slug, name, data, open }: { ean: string; slug: string; name: string; data: ProductReviews | undefined; open: boolean }) {
  const n = data?.n ?? 0;
  return (
    <section id="reviews" className="mt-12 scroll-mt-20">
      <h2 className="h-display mb-4 text-2xl">Ratings and reviews</h2>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="space-y-4">
          {n > 0 ? (
            <div className="card p-5">
              <div className="flex items-end gap-3">
                <p className="text-5xl font-semibold tabular-nums tracking-tight">{starsText(data!.avg)}</p>
                <div className="pb-1.5">
                  <Stars value={data!.avg} size={18} />
                  <p className="mt-0.5 text-sm text-soft">
                    {n} rating{n === 1 ? "" : "s"} from K Young shoppers
                  </p>
                </div>
              </div>
              <ul className="mt-4 space-y-1.5" aria-label="Ratings by stars">
                {[5, 4, 3, 2, 1].map((s) => {
                  const c = data!.dist[s - 1];
                  return (
                    <li key={s} className="flex items-center gap-2 text-xs text-soft">
                      <span className="w-7 tabular-nums">{s}★</span>
                      <span className="h-2 flex-1 overflow-hidden rounded-full bg-subtle">
                        <span className="block h-full rounded-full bg-star" style={{ width: `${(c / n) * 100}%` }} />
                      </span>
                      <span className="w-6 text-right tabular-nums">{c}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : (
            <p className="card p-5 text-sm text-soft">{open ? `No ratings yet. Used ${name}? Be the first to rate it.` : "No ratings yet."}</p>
          )}
          {open && <ReviewForm ean={ean} name={name} />}
        </div>

        <div>
          {data?.reviews.length ? (
            <ul className="space-y-3">
              {data.reviews.map((r) => (
                <li key={r.id} className="card p-5">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <Stars value={r.s} size={14} />
                    {r.t && <p className="font-semibold">{r.t}</p>}
                  </div>
                  <p className="mt-2 whitespace-pre-line text-[15px] leading-relaxed">{r.b}</p>
                  <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-soft">
                    <span className="font-medium text-ink">{r.n}</span>
                    {r.k && <span className="chip bg-subtle text-ink">{skinLabel(r.k)} skin</span>}
                    <span>{niceDate(r.d)}</span>
                    <a
                      href={`mailto:${SITE.email}?subject=${encodeURIComponent(`Report review ${r.id}`)}&body=${encodeURIComponent(`Review ${r.id} on ${SITE.url}/product/${slug} (${ean}) because: `)}`}
                      rel="nofollow"
                      className="ml-auto underline-offset-2 hover:underline"
                    >
                      Report
                    </a>
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            n > 0 && <p className="text-sm text-soft">No written reviews yet, just star ratings.</p>
          )}
          {n > 0 && <p className="mt-3 text-xs leading-relaxed text-soft">Ratings come from K Young visitors and are not verified purchases. They never change the order of prices.</p>}
        </div>
      </div>
    </section>
  );
}
