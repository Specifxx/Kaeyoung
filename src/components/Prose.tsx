import type { ReactNode } from "react";

/** Long-form page text (about, terms, privacy…): the shared article measure and heading scale (globals.css `.article-body`). */
export function Prose({ children }: { children: ReactNode }) {
  return <div className="article-body pb-4">{children}</div>;
}
