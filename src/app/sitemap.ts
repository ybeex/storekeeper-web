import type { MetadataRoute } from "next";
import { POSTS } from "@/lib/blog";
import { LEGAL } from "@/lib/legal-content";

const SITE = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3001").replace(/\/$/, "");

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ["", "/about", "/contact", "/blog", "/legal", "/login", "/register"];
  return [
    ...pages.map((p) => ({ url: `${SITE}${p}` })),
    ...POSTS.map((p) => ({ url: `${SITE}/blog/${p.slug}`, lastModified: p.date })),
    ...LEGAL.map((d) => ({ url: `${SITE}/legal/${d.slug}` })),
  ];
}
