import Link from "next/link";
import { notFound } from "next/navigation";
import { Chip } from "@/components/ui/chip";
import { Marginalia } from "@/components/ui/marginalia";
import { SiteShell } from "@/components/layout/site-shell";
import { findMusing, musings, shorts } from "@/lib/sample-data";
import { renderInline, renderProse } from "@/lib/render-prose";
import { formatLongDate, padNum, stripMarkers } from "@/lib/format";

import type { Metadata } from "next";

export async function generateStaticParams() {
  return musings.map((m) => ({ slug: m.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const m = findMusing(slug);
  if (!m) return { title: "Not found" };
  return {
    title: stripMarkers(m.title),
    description: stripMarkers(m.dek),
    openGraph: {
      title: stripMarkers(m.title),
      description: stripMarkers(m.dek),
      type: "article",
      publishedTime: m.publishedAt.toISOString(),
    },
  };
}

export default async function MusingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const m = findMusing(slug);
  if (!m) notFound();

  // Prev / next in publication order (newest first in array → prev = next in array)
  const sorted = [...musings].sort(
    (a, b) => b.publishedAt.getTime() - a.publishedAt.getTime(),
  );
  const idx = sorted.findIndex((x) => x.slug === m.slug);
  const prev = sorted[idx + 1];
  const nextShort = shorts.find((s) => s.featured) ?? shorts[0];

  return (
    <SiteShell activeHref="/musings">
      <article className="reading">
        <Marginalia
          groups={[
            { label: "essay no.", value: `№ ${padNum(m.number)}` },
            { label: "published", value: formatLongDate(m.publishedAt) },
            { label: "reading time", value: `${m.readingTimeMinutes} minutes` },
            {
              label: "filed under",
              value: (
                <span style={{ display: "inline-flex", gap: 6, flexWrap: "wrap" }}>
                  {m.tags.map((t) => (
                    <Chip key={t.label} tint={t.tint}>
                      {t.label}
                    </Chip>
                  ))}
                </span>
              ),
            },
          ]}
          backHref="/musings"
          backLabel="← all musings"
        />

        <div>
          <header className="article-head">
            <div className="kicker">
              <span>● essay · musing</span>
            </div>
            <h1>{renderInline(m.title)}</h1>
            <p className="standfirst">{renderInline(m.dek)}</p>
            <div className="byline">
              <span>by Amit T</span>
              <span className="sep">·</span>
              <span>{m.readingTimeMinutes} min read</span>
            </div>
          </header>

          <div className="lead-art">
            <span className="ph">illustration · 16:9</span>
          </div>

          <section className="prose">{renderProse(m.body, "musing")}</section>

          <div className="share">
            <span className="label">tell someone:</span>
            <a href="#">copy link</a>
            <a href="#">share to twitter</a>
            <a href="#">forward by email</a>
          </div>

          <div className="reply">
            <h3>
              Got a theory <em>three?</em>
            </h3>
            <p>
              I read every reply. The interesting ones become the next essay, with
              permission. Email is best — there&apos;s a link in the footer. Or just hit
              reply on Sunday&apos;s newsletter.
            </p>
            <Link href="/newsletter" className="link">
              subscribe to the newsletter →
            </Link>
          </div>

          <nav className="pn" aria-label="More to read">
            {prev ? (
              <Link href={`/musings/${prev.slug}`}>
                <div className="dir">← previous · no. {padNum(prev.number)}</div>
                <h4>{renderInline(prev.title)}</h4>
              </Link>
            ) : (
              <span />
            )}
            <Link href={`/shorts/${nextShort.slug}`} className="next">
              <div className="dir">next · short · no. {padNum(nextShort.number)} →</div>
              <h4>{renderInline(nextShort.title)}</h4>
            </Link>
          </nav>
        </div>

        <div aria-hidden />
      </article>
    </SiteShell>
  );
}
