import Link from "next/link";
import { Chip } from "@/components/ui/chip";
import { DraftPill } from "@/components/ui/draft-pill";
import { FilterPill } from "@/components/ui/filter-pill";
import { HandInline } from "@/components/ui/hand-inline";
import { SiteShell } from "@/components/layout/site-shell";
import { getPublishedMusings, tagToTint } from "@/lib/posts";
import { renderInline } from "@/lib/render-prose";
import { padNum, stripMarkers } from "@/lib/format";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Musings",
  description:
    "Short essays about the small daily friction — the stuff that isn't dramatic enough to make a story but isn't quiet enough to forget.",
};

const FILTERS = [
  { label: "all", count: 24, active: true },
  { label: "grief", count: 5 },
  { label: "phones", count: 7 },
  { label: "bangalore", count: 9 },
  { label: "small humiliations", count: 11 },
  { label: "love", count: 3 },
  { label: "family", count: 4 },
  { label: "competence", count: 2 },
];

export default function MusingsPage() {
  const all = getPublishedMusings();
  const pick = all.find((m) => m.featured) ?? all[0];
  const rest = all.filter((m) => m.slug !== pick.slug);

  const buckets = new Map<number, typeof rest>();
  for (const m of rest) {
    const y = new Date(m.publishedAt).getFullYear();
    if (!buckets.has(y)) buckets.set(y, []);
    buckets.get(y)!.push(m);
  }
  const years = [...buckets.keys()].sort((a, b) => b - a);

  return (
    <SiteShell activeHref="/musings">
      <section className="page-intro">
        <div className="kicker">
          <span>musings · {all.length} essays · since jan 2024</span>
        </div>
        <h1>
          Notes from <em>noticing.</em>
        </h1>
        <p className="lede">
          Short essays about <HandInline>the small daily friction</HandInline> — the stuff
          that isn&apos;t dramatic enough to make a story but isn&apos;t quiet enough to
          forget. Read in order, or pick a tag and tumble down.
        </p>
      </section>

      <div className="filters">
        {FILTERS.map((f) => (
          <FilterPill key={f.label} active={f.active} count={f.count}>
            {f.label}
          </FilterPill>
        ))}
      </div>

      <div className="toolbar">
        <div className="count">
          <strong style={{ color: "var(--ink)" }}>{all.length}</strong> essays · filtered
          by <em>all</em>
        </div>
        <div className="sort">
          sort by
          <select defaultValue="newest" aria-label="Sort essays">
            <option value="newest">newest first</option>
            <option value="oldest">oldest first</option>
            <option value="shortest">shortest first</option>
            <option value="longest">longest first</option>
          </select>
        </div>
      </div>

      <article className="pick">
        <div>
          <div className="kicker">
            <span>● editor&apos;s pick · the one I&apos;d start with</span>
          </div>
          <h2>
            <Link href={`/musings/${pick.slug}`}>{renderInline(pick.title)}</Link>
          </h2>
          <p className="dek">{renderInline(pick.dek)}</p>
          <div className="by">
            <span>
              {formatMonthDay(pick.publishedAt)},{" "}
              {new Date(pick.publishedAt).getFullYear()}
            </span>
            <span className="sep">·</span>
            <span>{pick.readingTimeMinutes} min read</span>
            <span className="chips">
              <Chip tint="lavender">musing</Chip>
              {pick.tags.map((t) => (
                <Chip key={t} tint={tagToTint(t)}>
                  {t}
                </Chip>
              ))}
            </span>
          </div>
        </div>
        <div className="art-slot" style={{ background: "var(--art-s)" }}>
          <span className="ph">illustration · 4:3</span>
        </div>
      </article>

      {years.map((y, i) => (
        <div key={y}>
          <YearSep label={String(y)} tail={i === 0 ? "so far" : "(a selection)"} />
          <River items={buckets.get(y)!} />
        </div>
      ))}

      <nav className="pager" aria-label="Pagination">
        <div>page 1 of 3 · {all.length} essays</div>
        <div className="pages">
          <span style={{ color: "var(--ink-4)" }}>←</span>
          <a className="active">1</a>
          <a>2</a>
          <a>3</a>
          <a>→</a>
        </div>
        <div>
          jump to{" "}
          <Link
            href="/shorts"
            style={{
              color: "var(--ink-2)",
              borderBottom: "1px solid var(--border)",
              paddingBottom: 2,
            }}
          >
            shorts →
          </Link>
        </div>
      </nav>
    </SiteShell>
  );
}

function YearSep({ label, tail }: { label: string; tail: string }) {
  return (
    <div className="year-sep">
      <div className="y">
        {label} <em>{tail}</em>
      </div>
      <div className="ruleline" />
    </div>
  );
}

function River({ items }: { items: ReturnType<typeof getPublishedMusings> }) {
  return (
    <section className="river">
      {items.map((m) => {
        const reads = mockReads(m.number);
        return (
          <article key={m.slug} className="river-item">
            <div className="when">
              <span className="num">№ {padNum(m.number)}</span>
              {formatMonthDay(m.publishedAt)}
            </div>
            <div className="mid">
              <h3>
                <Link href={`/musings/${m.slug}`} title={stripMarkers(m.title)}>
                  {renderInline(m.title)}
                </Link>
              </h3>
              <p className="dek">{renderInline(m.dek)}</p>
              <div className="chips">
                <Chip tint="lavender">musing</Chip>
                {m.tags.map((t) => (
                  <Chip key={t} tint={tagToTint(t)}>
                    {t}
                  </Chip>
                ))}
                {m.status === "draft" && <DraftPill />}
              </div>
            </div>
            <div className="right">
              <span className="reads">{m.readingTimeMinutes} min read</span>
              <span>{reads.toLocaleString()} reads</span>
            </div>
          </article>
        );
      })}
    </section>
  );
}

function formatMonthDay(iso: string): string {
  return new Date(iso)
    .toLocaleDateString("en-US", { month: "short", day: "2-digit" })
    .toLowerCase();
}

function mockReads(num: number): number {
  return 500 + ((num * 197) % 4000);
}
