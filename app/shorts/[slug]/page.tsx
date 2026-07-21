import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteShell } from "@/components/layout/site-shell";
import { findShort, getAllShorts } from "@/lib/posts";
import { renderInline } from "@/lib/render-prose";
import { padNum, stripMarkers } from "@/lib/format";

import type { Metadata } from "next";

export const dynamicParams = false;

export async function generateStaticParams() {
  return getAllShorts().map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const s = findShort(slug);
  if (!s) return { title: "Not found" };
  return {
    title: stripMarkers(s.title),
    description: stripMarkers(s.dek),
    openGraph: {
      title: stripMarkers(s.title),
      description: stripMarkers(s.dek),
      type: "article",
      publishedTime: s.publishedAt,
    },
  };
}

export default async function ShortPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const s = findShort(slug);
  if (!s) notFound();
  if (s.status === "draft" && process.env.NODE_ENV === "production") notFound();

  const sorted = getAllShorts();
  const idx = sorted.findIndex((x) => x.slug === s.slug);
  const prev = sorted[idx + 1];

  return (
    <SiteShell activeHref="/shorts">
      <header className="short-head">
        <div className="kicker">
          <span>● short fiction</span>
          <span className="num">№ {padNum(s.number)}</span>
          {s.status === "draft" && (
            <span className="chip b" style={{ marginLeft: 8 }}>
              draft
            </span>
          )}
        </div>
        <h1>{renderInline(s.title)}</h1>
        <div className="byline">
          <span>by Amit T</span>
          <span className="sep">·</span>
          <span>{formatLongDate(s.publishedAt)}</span>
          <span className="sep">·</span>
          <span>~ {s.wordCount} words</span>
        </div>
      </header>

      <div className="short-hero">
        <span className="ph">cover illustration · 16:9</span>
        <span className="corner">↘</span>
      </div>

      <section className="short-body" dangerouslySetInnerHTML={{ __html: s.body }} />

      <div className="afterthought">
        <div className="label">a small afterthought, from the author:</div>
        <div className="text">
          ↳ this one came out of a real cart. the kettle is real. the city, also.
        </div>
      </div>

      <div className="after">
        <div className="left">
          <span className="by">by Amit T · short no. {padNum(s.number)}</span>
        </div>
        <div className="actions">
          <a href="#">copy link</a>
          <a href="#">share</a>
          <a href="#">forward</a>
        </div>
      </div>

      <nav className="pn-short" aria-label="More to read">
        {prev ? (
          <Link href={`/shorts/${prev.slug}`}>
            <div className="dir">← previous short · no. {padNum(prev.number)}</div>
            <h4>{renderInline(prev.title)}</h4>
          </Link>
        ) : (
          <span />
        )}
        <Link href="/shorts" className="next">
          <div className="dir">all shorts →</div>
          <h4>
            Back to the <em>library</em>
          </h4>
        </Link>
      </nav>
    </SiteShell>
  );
}

function formatLongDate(iso: string): string {
  return new Date(iso)
    .toLocaleDateString("en-US", { month: "long", day: "2-digit", year: "numeric" })
    .toLowerCase();
}
