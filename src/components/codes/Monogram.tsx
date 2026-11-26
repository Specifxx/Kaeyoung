/** The store's initials on a soft tile: never its logo (we hold no licence for it). */
export function Monogram({ name, size = "lg" }: { name: string; size?: "lg" | "sm" }) {
  const letters = name
    .replace(/[^A-Za-zÀ-ÿ ]/g, "")
    .split(/\s+/)
    .filter((w) => w && !/^(the|of|and)$/i.test(w))
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  const tints = ["tint-sky", "tint-lavender", "tint-mint", "tint-butter", "tint-peach", "tint-rose"];
  const tint = tints[[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % tints.length];
  return (
    <span
      aria-hidden
      className={`${tint} grid shrink-0 place-items-center rounded-2xl border border-line/70 font-display font-semibold text-ink ${size === "lg" ? "h-12 w-12 text-lg sm:h-16 sm:w-16 sm:text-2xl" : "h-11 w-11 text-base"}`}
    >
      {letters}
    </span>
  );
}
