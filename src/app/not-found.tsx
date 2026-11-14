import Link from "next/link";
import { SearchBox } from "@/components/SearchBox";

const WAYS: [string, string][] = [
  ["/popular", "Popular"],
  ["/deals", "Deals today"],
  ["/brands", "All brands"],
];

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 pb-20 pt-14 text-center sm:pt-20">
      <p className="eyebrow">404</p>
      <h1 className="h-display mt-2 text-4xl">Page not found</h1>
      <p className="mx-auto mt-3 max-w-md leading-relaxed text-soft">This product may have sold out everywhere and left the list. Try a search, or head home.</p>
      <div className="mt-7 text-left">
        <SearchBox big />
      </div>
      <nav aria-label="Ways back" className="mt-6 flex flex-wrap justify-center gap-2">
        <Link prefetch={false} href="/" className="btn-pop btn-buy h-10 px-6">
          Back home
        </Link>
        {WAYS.map(([href, label]) => (
          <Link key={href} prefetch={false} href={href} className="inline-flex h-10 items-center rounded-full border border-line bg-card px-4 text-sm font-medium text-ink transition-colors hover:border-soft">
            {label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
