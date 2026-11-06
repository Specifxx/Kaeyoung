// The side rails' tiles for one region (lib/side-rails.ts): one static JSON per region and release (force-static, every region
// prerendered), fetched by components/SideRails.tsx only on a screen wide enough for the rails or once the phone dock may show.
import { REGIONS } from "@/site";
import { railsFor } from "@/lib/side-rails";

export const dynamic = "force-static";
export const dynamicParams = false;
export function generateStaticParams() {
  return REGIONS.map((r) => ({ region: r.code.toLowerCase() }));
}

export function GET(_req: Request, { params }: { params: { region: string } }) {
  const r = REGIONS.find((x) => x.code.toLowerCase() === params.region);
  if (!r) return new Response("Not found", { status: 404 });
  return new Response(JSON.stringify(railsFor(r.code)), {
    headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=3600, s-maxage=86400" },
  });
}
