import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Admin forms are small; refuse anything bigger than 256 KB before parsing it.
  experimental: { serverActions: { bodySizeLimit: "256kb" } },
  images: {
    // Only our own images may be optimised: no remote hosts, no SVG, no query strings.
    // Our own portfolio images and images uploaded in Admin → Content → Media.
    localPatterns: [
      { pathname: "/work/**", search: "" },
      { pathname: "/media/**", search: "" },
    ],
    remotePatterns: [],
    dangerouslyAllowSVG: false,
    qualities: [75],
    minimumCacheTTL: 2678400,
  },
  // v5: retired pages point to their closest live page.
  async redirects() {
    const moved: [string, string][] = [
      ["/gamification", "/services"],
      ["/business-analytics", "/services"],
      ["/financial-consulting", "/services"],
      ["/services/corporate-website", "/services/business-website"],
    ];
    return moved.flatMap(([from, to]) => [
      { source: from, destination: to, permanent: true },
      { source: `/:locale(ru|hy)${from}`, destination: `/:locale${to}`, permanent: true },
    ]);
  },
  async headers() {
    const security = [
      // HTTPS only for two years, subdomains included, eligible for browser preload lists.
      { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
      { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
      { key: "Origin-Agent-Cluster", value: "?1" },
      { key: "X-DNS-Prefetch-Control", value: "off" },
      { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
      {
        key: "Permissions-Policy",
        value:
          "accelerometer=(), autoplay=(self), camera=(), display-capture=(), encrypted-media=(), fullscreen=(self), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), midi=(), payment=(), picture-in-picture=(self), publickey-credentials-get=(self), screen-wake-lock=(), sync-xhr=(), usb=(), xr-spatial-tracking=(), interest-cohort=(), browsing-topics=()",
      },
    ];
    return [
      { source: "/:path*", headers: security },
      { source: "/api/:path*", headers: [{ key: "Cache-Control", value: "no-store" }, { key: "X-Robots-Tag", value: "noindex" }] },
      { source: "/admin/:path*", headers: [{ key: "Cache-Control", value: "no-store" }, { key: "X-Robots-Tag", value: "noindex, nofollow" }] },
      { source: "/(fonts|scene|work)/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }] },
    ];
  },
};

export default withNextIntl(nextConfig);
