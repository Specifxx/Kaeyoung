import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-20 text-center">
      <p className="eyebrow">404</p>
      <h1 className="h-display mt-2 text-4xl">Page not found</h1>
      <p className="mt-3 text-soft">This product may have sold out everywhere and left the list. Try a search, or head home.</p>
      <Link prefetch={false} href="/" className="btn-pop btn-buy mt-6 px-6">
        Back home
      </Link>
    </div>
  );
}
