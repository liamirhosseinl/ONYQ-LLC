import type { MetadataRoute } from "next";
import { siteConfig } from "@/data/site-config.ts";
import { IS_PREVIEW } from "@/lib/site-mode.ts";

export default function robots(): MetadataRoute.Robots {
  if (IS_PREVIEW) {
    // Review deployments must never be indexed.
    return { rules: [{ userAgent: "*", disallow: "/" }] };
  }
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/", "/admin"] }],
    sitemap: `${siteConfig.url}/sitemap.xml`,
    host: siteConfig.url,
  };
}
