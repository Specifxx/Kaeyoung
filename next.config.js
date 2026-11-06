/** @type {import('next').NextConfig} */
// Cost notes (DECISIONS.md "A fully static site"): every page is prerendered at
// the day's one [deploy] build from the committed data/, so a visit is a CDN
// file, never a function. The only function is eBay's account-deletion hook.
module.exports = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Store photos are hotlinked from the stores' CDNs at the size we ask for;
  // Vercel image optimisation is billed per source image, so it stays off.
  images: { unoptimized: true },
  // Product pages and quick-view files outside the prebuilt top 500 render on their
  // first request (DECISIONS.md 2026-11-06), so those functions must carry the data
  // they read: data.ts and ratings.ts read data/public, PriceTable data/amazon-live.
  // Without it data.ts's loader falls back to empty and every such page is a 404.
  experimental: {
    outputFileTracingIncludes: {
      "/product/[slug]": ["./data/public/**", "./data/amazon-live/**"],
      "/q/[slug]": ["./data/public/**", "./data/amazon-live/**"],
    },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};
