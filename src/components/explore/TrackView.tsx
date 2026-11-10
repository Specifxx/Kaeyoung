"use client";
// Records this product page in the visitor's own "Recently viewed" list (./recent.ts).
// Renders nothing.
import { useEffect } from "react";
import { pushRecent, readRecent, writeRecent, type RecentItem } from "./recent";

export function TrackView({ prefix, item }: { prefix: string; item: Omit<RecentItem, "t"> }) {
  useEffect(() => {
    writeRecent(prefix, pushRecent(readRecent(prefix), { ...item, t: Date.now() }));
  }, [prefix, item]);
  return null;
}
