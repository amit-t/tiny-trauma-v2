import Link from "next/link";
import { HandInline } from "@/components/ui/hand-inline";
import { SiteShell } from "@/components/layout/site-shell";
import { shorts } from "@/lib/sample-data";
import { renderInline } from "@/lib/render-prose";
import { formatMonthDay, padNum, stripMarkers } from "@/lib/format";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shorts",
  description:
    "Very small stories about people doing slightly strange things. A few hundred words each, printable on a single sheet.",
};

export default function ShortsPage() {
  const featured = shorts.find((s) => s.featured) ?? shorts[0];
  const rest = shorts.filter((s) => s.slug !== featured.slug);

  return (
    <SiteShell activeHref="/shorts">
      <section className="page-intro">
        <div className="kicker">
          <span>shorts · {shorts.length} fictions · since aug 2024</span>
        </div>
        <h1>
          Short fictions, <em>numbered.</em>
        </h1>
        <p className="lede">
          Very small stories about people doing slightly strange things.{" "}
          <HandInline>no morals, mostly.</HandInline> Each one a few hundred words,
          printable on a single sheet, designed to be read at the dinner table or in an
          auto.
        </p>
      </section>

      <article className="featured-short">
        <Link
          href={`/shorts/${featured.slug}`}
          className="cover"
          aria-label={`Read featured short: ${stripMarkers(featured.title)}`}
        >
          <span className="no">№ {padNum(featured.number)} — short fiction</span>
          <span className="corner">read me first ↘</span>
          <span className="title">{renderInline(featured.title)}</span>
        </Link>
        <div className="text">
          <div className="kicker">
            <span>● featured · the newest one</span>
          </div>
          <p className="opener">
            <span className="quote-mark">&ldquo;</span>
            {renderInline(featured.dek)}
            <span className="quote-mark">&rdquo;</span>
          </p>
          <div className="footer-row">
            <span>{formatMonthDay(featured.publishedAt)}, 2026</span>
            <span style={{ color: "var(--ink-4)" }}>·</span>
            <span>~ {featured.wordCount} words</span>
            <span style={{ color: "var(--ink-4)" }}>·</span>
            <Link href={`/shorts/${featured.slug}`} className="read-cta">
              read the short →
            </Link>
          </div>
        </div>
      </article>

      <section className="covers">
        {rest.map((s) => (
          <article key={s.slug} className={`cover-card c-${s.coverColor ?? "a"}`}>
            <Link
              href={`/shorts/${s.slug}`}
              className="cover"
              aria-label={`Read short: ${stripMarkers(s.title)}`}
            >
              <span className="no">№ {padNum(s.number)}</span>
              <span className="corner-mark">↘</span>
              <span className="title">{renderInline(s.title)}</span>
            </Link>
            <h3>
              <Link href={`/shorts/${s.slug}`}>{renderInline(s.title)}</Link>
            </h3>
            <p className="dek">{renderInline(s.dek)}</p>
            <div className="meta">
              <span>
                {formatMonthDay(s.publishedAt)}, {s.publishedAt.getFullYear()}
              </span>
              <span>~ {s.wordCount} words</span>
            </div>
          </article>
        ))}
      </section>

      <div style={{ height: 48 }} />
    </SiteShell>
  );
}
