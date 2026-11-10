// Picks for the explore layer (components/explore/, 2026-11-10). Build time only.
import { popularity } from "@/lib/ratings";
import type { Product } from "@/lib/types";

/** Up to `n` photos of the most popular products in `list`, for a category tile. */
export function topPhotos(list: Product[], n = 3): string[] {
  return list
    .filter((f) => f.img)
    .map((f) => ({ f, p: popularity(f) }))
    .sort((a, b) => b.p - a.p || a.f.name.localeCompare(b.f.name))
    .slice(0, n)
    .map((x) => x.f.img!);
}
