import Link from "next/link";
import { notFound } from "next/navigation";
import { Chip } from "@/components/ui/chip";
import { Marginalia } from "@/components/ui/marginalia";
import { SiteShell } from "@/components/layout/site-shell";
import { findMusing, getAllMusings, getPublishedShorts, tagToTint } from "@/lib/posts";
import { renderInline } from "@/lib/render-prose";
import { padNum, stripMarkers } from "@/lib/format";

import type { Metadata } from "next";

export async function generateStaticParams() {
  return getAllMusings().map((m) => ({ slug: m.slug }));
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
      publishedTime: m.publishedAt,
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
  if (m.status === "draft" && process.env.NODE_ENV === "production") notFound();

  const sorted = getAllMusings();
  const idx = sorted.findIndex((x) => x.slug === m.slug);
  const prev = sorted[idx + 1];
  const shorts = getPublishedShorts();
  const nextShort = shorts.find((s) => s.featured) ?? shorts[0] ?? null;

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
                  <Chip tint="lavender">musing</Chip>
                  {m.tags.map((t) => (
                    <Chip key={t} tint={tagToTint(t)}>
                      {t}
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
              {m.status === "draft" && (
                <span className="chip b" style={{ marginLeft: 8 }}>
                  draft
                </span>
              )}
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

          <section className="prose" dangerouslySetInnerHTML={{ __html: m.body }} />

          <div className="end-mark">— end.</div>

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
            {nextShort ? (
              <Link href={`/shorts/${nextShort.slug}`} className="next">
                <div className="dir">
                  next · short · no. {padNum(nextShort.number)} →
                </div>
                <h4>{renderInline(nextShort.title)}</h4>
              </Link>
            ) : (
              <span />
            )}
          </nav>
        </div>

        <div aria-hidden />
      </article>
    </SiteShell>
  );
}

function formatLongDate(iso: string): string {
  return new Date(iso)
    .toLocaleDateString("en-US", { month: "long", day: "2-digit", year: "numeric" })
    .toLowerCase();
}
