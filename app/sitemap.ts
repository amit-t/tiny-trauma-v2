import type { MetadataRoute } from "next";
import { getAllMusings, getAllShorts } from "@/lib/posts";

const SITE = "https://tinytrauma.in";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${SITE}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    {
      url: `${SITE}/musings`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${SITE}/shorts`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${SITE}/about`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.4,
    },
    {
      url: `${SITE}/newsletter`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];

  const musingPages: MetadataRoute.Sitemap = getAllMusings()
    .filter((m) => m.status === "published")
    .map((m) => ({
      url: `${SITE}/musings/${m.slug}`,
      lastModified: new Date(m.publishedAt),
      changeFrequency: "yearly",
      priority: 0.6,
    }));

  const shortPages: MetadataRoute.Sitemap = getAllShorts()
    .filter((s) => s.status === "published")
    .map((s) => ({
      url: `${SITE}/shorts/${s.slug}`,
      lastModified: new Date(s.publishedAt),
      changeFrequency: "yearly",
      priority: 0.6,
    }));

  return [...staticPages, ...musingPages, ...shortPages];
}
