import { getPublishedForFeeds } from "@/lib/posts";
import { stripMarkers } from "@/lib/format";

const SITE = "https://tinytrauma.in";
const TITLE = "tiny trauma";
const DESCRIPTION =
  "A personal blog about the small daily friction between who you are and everything around you. Honest, slightly literary, sometimes funny, occasionally devastating, never a wellness tip.";

export async function GET() {
  const posts = getPublishedForFeeds();
  const items = posts
    .map((p) => {
      const path = p.type === "musing" ? "musings" : "shorts";
      const url = `${SITE}/${path}/${p.slug}`;
      const title = escapeXml(stripMarkers(p.title));
      const dek = escapeXml(stripMarkers(p.dek));
      return `    <item>
      <title>${title}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <description>${dek}</description>
      <category>${p.type}</category>
      <pubDate>${new Date(p.publishedAt).toUTCString()}</pubDate>
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(TITLE)}</title>
    <link>${SITE}</link>
    <atom:link href="${SITE}/feed.xml" rel="self" type="application/rss+xml" />
    <description>${escapeXml(DESCRIPTION)}</description>
    <language>en</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
