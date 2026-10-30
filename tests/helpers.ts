/** A valid EAN-13 from its first 12 digits. */
export function ean(first12: string): string {
  let s = 0;
  for (let i = 0; i < 12; i++) s += Number(first12[i]) * (i % 2 ? 3 : 1);
  return first12 + ((10 - (s % 10)) % 10);
}
