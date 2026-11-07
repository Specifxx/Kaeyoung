// Products the low-traction cull left out (lib/focus.ts, owner 2026-11-07): data/public/culled.json maps a culled slug to its
// category key, so its old URL 301s there instead of a 404. A product that qualifies again leaves the file and is back at the
// same URL. Server-only.
import fs from "node:fs";
import path from "node:path";

let map: Record<string, string> | null = null;

/** Where a culled product's URL goes ("/serums", or "/" for a category with no hub), or null when it was never culled. */
export function culledTarget(slug: string): string | null {
  if (!map) {
    try {
      map = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), process.env.KY_DATA_DIR || "data/public", "culled.json"), "utf8")) as Record<string, string>;
    } catch {
      map = {};
    }
  }
  if (!Object.prototype.hasOwnProperty.call(map, slug)) return null;
  const cat = map[slug];
  return cat && cat !== "other" ? `/${cat}` : "/";
}
