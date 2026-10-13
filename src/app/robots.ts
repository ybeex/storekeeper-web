import type { MetadataRoute } from "next";

const SITE = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3001").replace(/\/$/, "");

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: ["/", "/blog", "/legal"], disallow: ["/api/", "/dashboard", "/catalog", "/transactions", "/settings", "/team", "/items/"] }],
    sitemap: `${SITE}/sitemap.xml`,
  };
}
