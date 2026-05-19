import Link from "next/link";
import { ArtSlot } from "@/components/ui/art-slot";
import { Chip } from "@/components/ui/chip";
import { DraftPill } from "@/components/ui/draft-pill";
import { FilterPill } from "@/components/ui/filter-pill";
import { HandInline } from "@/components/ui/hand-inline";
import { SiteShell } from "@/components/layout/site-shell";
import { SubscribeForm } from "@/components/subscribe-form";
import {
  cardTintFromHero,
  getPublishedMusings,
  getPublishedShorts,
  tagToTint,
} from "@/lib/posts";
import { renderInline } from "@/lib/render-prose";

const FILTERS: { label: string; count: number; active?: boolean }[] = [
  { label: "all", count: 24, active: true },
  { label: "grief", count: 5 },
  { label: "phones", count: 7 },
  { label: "bangalore", count: 9 },
  { label: "small humiliations", count: 11 },
  { label: "love", count: 3 },
];

export default function Home() {
  const allMusings = getPublishedMusings();
  const allShorts = getPublishedShorts();
  const recent = allMusings.slice(0, 4);
  const featured = allShorts.find((s) => s.featured) ?? allShorts[0];
  const lastPub = allMusings[0];

  return (
    <SiteShell activeHref="/">
      <section className="hero">
        <div className="kicker">
          <span className="pulse" aria-hidden />
          <span>
            {lastPub ? (
              <>
                last essay — {formatLongDate(lastPub.publishedAt)}{" "}
                <em>· {timeAgo(lastPub.publishedAt)}</em>
              </>
            ) : (
              <>
                opening soon — <em>· no essays yet</em>
              </>
            )}
          </span>
        </div>
        <h1>
          a small life, <em>mostly.</em>
        </h1>
        <p className="lede">
          A personal blog about <HandInline>the small daily friction</HandInline> between
          who you are and everything around you. Honest, slightly literary, sometimes
          funny, occasionally devastating, never a wellness tip. New essays most Sundays.{" "}
          <Link href="/newsletter">subscribe</Link>, if that sounds right.
        </p>
        <div className="meta-row">
          <span>{allMusings.length} essays</span>
          <span className="sep">·</span>
          <span>{allShorts.length} short fictions</span>
          <span className="sep">·</span>
          <span>a small, quiet list</span>
        </div>
      </section>

      <ArtSlot
        className="lead-photo"
        placeholder="lead photograph · 16:9"
        aspectRatio="16/9"
      >
        <div className="cap">photo · brigade road auto stand · 8:47 a.m., may 2026</div>
      </ArtSlot>

      <section>
        <div className="sect-head">
          <h2>
            Recent <em>musings.</em>
          </h2>
          {allMusings.length > 0 && (
            <Link href="/musings" className="more">
              all musings →
            </Link>
          )}
        </div>

        {allMusings.length > 0 && (
          <div className="filters">
            {FILTERS.map((f) => (
              <FilterPill key={f.label} active={f.active} count={f.count}>
                {f.label}
              </FilterPill>
            ))}
          </div>
        )}

        {recent.length > 0 ? (
          <div className="grid">
            {recent.map((m) => (
              <article key={m.slug} className={`card t-${cardTintFromHero(m.heroTint)}`}>
                <div className="art-slot">
                  <span className="ph">illustration · 5:4</span>
                </div>
                <div className="chips">
                  <Chip tint="lavender">musing</Chip>
                  {m.tags.map((t) => (
                    <Chip key={t} tint={tagToTint(t)}>
                      {t}
                    </Chip>
                  ))}
                  {m.status === "draft" && <DraftPill />}
                </div>
                <h3>
                  <Link href={`/musings/${m.slug}`}>{renderInline(m.title)}</Link>
                </h3>
                <p className="dek">{renderInline(m.dek)}</p>
                <div className="by">
                  <span>{formatShortDate(m.publishedAt)}</span>
                  <span className="sep">·</span>
                  <span>{m.readingTimeMinutes} min read</span>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="lede" style={{ color: "var(--ink-2)", fontStyle: "italic" }}>
            no essays yet. the first sunday letter is being written.{" "}
            <Link href="/newsletter">subscribe</Link>
            {" "}if you want it in your inbox when it lands.
          </p>
        )}
      </section>

      {featured && (
        <section className="featured">
          <Link
            href={`/shorts/${featured.slug}`}
            className="art-slot"
            aria-label={`Read featured short: ${plain(featured.title)}`}
          >
            <span className="ph">illustration · 4:5</span>
          </Link>
          <div className="text">
            <div className="kicker">
              <span>● featured short fiction</span>
            </div>
            <h2>{renderInline(featured.title)}</h2>
            <p className="dek">{renderInline(featured.dek)}</p>
            <Link href={`/shorts/${featured.slug}`} className="read-cta">
              read the short →
            </Link>
          </div>
        </section>
      )}

      <section className="newsletter-band">
        <div>
          <h2>
            Get the small <em>things</em> in your inbox.
          </h2>
          <p className="pitch">
            One short essay every Sunday. Sometimes a short fiction on the side. No
            threads, no tips, no productivity. I read every reply.
          </p>
        </div>
        <SubscribeForm variant="band" source="home" />
      </section>
    </SiteShell>
  );
}

function formatShortDate(iso: string): string {
  return new Date(iso)
    .toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })
    .toLowerCase();
}

function formatLongDate(iso: string): string {
  return new Date(iso)
    .toLocaleDateString("en-US", { month: "long", day: "2-digit", year: "numeric" })
    .toLowerCase();
}

function timeAgo(iso: string): string {
  const days = Math.max(
    0,
    Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000),
  );
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  return `${Math.floor(days / 365)} years ago`;
}

function plain(s: string): string {
  return s.replace(/\*/g, "").replace(/==/g, "");
}
