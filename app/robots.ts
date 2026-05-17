import type { MetadataRoute } from "next";

const SITE = "https://tinytrauma.in";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: "/admin/" }],
    sitemap: `${SITE}/sitemap.xml`,
  };
}
