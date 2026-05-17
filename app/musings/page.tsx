import Link from "next/link";
import { Chip } from "@/components/ui/chip";
import { FilterPill } from "@/components/ui/filter-pill";
import { HandInline } from "@/components/ui/hand-inline";
import { SiteShell } from "@/components/layout/site-shell";
import { musings } from "@/lib/sample-data";
import { renderInline } from "@/lib/render-prose";
import { formatMonthDay, padNum, stripMarkers } from "@/lib/format";

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
  const pick = musings.find((m) => m.featured) ?? musings[0];
  const rest = musings.filter((m) => m.slug !== pick.slug);

  const y2026 = rest.filter((m) => m.publishedAt.getFullYear() === 2026);
  const y2025 = rest.filter((m) => m.publishedAt.getFullYear() === 2025);

  return (
    <SiteShell activeHref="/musings">
      <section className="page-intro">
        <div className="kicker">
          <span>musings · 24 essays · since jan 2024</span>
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
          <strong style={{ color: "var(--ink)" }}>{musings.length}</strong> essays ·
          filtered by <em>all</em>
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
            <span>{formatMonthDay(pick.publishedAt)}, 2026</span>
            <span className="sep">·</span>
            <span>{pick.readingTimeMinutes} min read</span>
            <span className="chips">
              {pick.tags.map((t) => (
                <Chip key={t.label} tint={t.tint}>
                  {t.label}
                </Chip>
              ))}
            </span>
          </div>
        </div>
        <div className="art-slot" style={{ background: "var(--art-s)" }}>
          <span className="ph">illustration · 4:3</span>
        </div>
      </article>

      {y2026.length > 0 && (
        <>
          <YearSep label="2026" tail="so far" />
          <River items={y2026} />
        </>
      )}

      {y2025.length > 0 && (
        <>
          <YearSep label="2025" tail="(a selection)" />
          <River items={y2025} />
        </>
      )}

      <nav className="pager" aria-label="Pagination">
        <div>page 1 of 3 · {musings.length} essays</div>
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

function River({ items }: { items: typeof musings }) {
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
                {m.tags.map((t) => (
                  <Chip key={t.label} tint={t.tint}>
                    {t.label}
                  </Chip>
                ))}
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

function mockReads(num: number): number {
  // Deterministic-ish pseudo-reads so the page looks lived-in without a db.
  return 500 + ((num * 197) % 4000);
}
