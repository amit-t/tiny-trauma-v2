import Link from "next/link";
import { ArtSlot } from "@/components/ui/art-slot";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { FilterPill } from "@/components/ui/filter-pill";
import { HandInline } from "@/components/ui/hand-inline";
import { Input } from "@/components/ui/input";
import { SiteShell } from "@/components/layout/site-shell";
import { musings, shorts } from "@/lib/sample-data";
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
  const recent = musings.slice(0, 4);
  const featured = shorts.find((s) => s.featured) ?? shorts[0];

  return (
    <SiteShell activeHref="/">
      <section className="hero">
        <div className="kicker">
          <span className="pulse" aria-hidden />
          <span>
            last essay — may 12, 2026 <em>· four days ago</em>
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
          <span>{musings.length} essays</span>
          <span className="sep">·</span>
          <span>{shorts.length} short fictions</span>
          <span className="sep">·</span>
          <span>1,240 quiet readers</span>
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
          <Link href="/musings" className="more">
            all musings →
          </Link>
        </div>

        <div className="filters">
          {FILTERS.map((f) => (
            <FilterPill key={f.label} active={f.active} count={f.count}>
              {f.label}
            </FilterPill>
          ))}
        </div>

        <div className="grid">
          {recent.map((m) => (
            <article key={m.slug} className={`card t-${m.cardTint ?? "musing"}`}>
              <div className="art-slot">
                <span className="ph">illustration · 5:4</span>
              </div>
              <div className="chips">
                {m.tags.map((t) => (
                  <Chip key={t.label} tint={t.tint}>
                    {t.label}
                  </Chip>
                ))}
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
      </section>

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
        <form action="/newsletter">
          <div className="row">
            <Input placeholder="first name" required />
            <Input type="email" placeholder="you@somewhere.com" required />
          </div>
          <Button type="submit">subscribe →</Button>
          <p className="small">
            no spam. unsubscribe in one click. I read every reply, even the angry ones.
          </p>
        </form>
      </section>
    </SiteShell>
  );
}

function formatShortDate(d: Date): string {
  return d
    .toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })
    .toLowerCase();
}

function plain(s: string): string {
  return s.replace(/\*/g, "").replace(/==/g, "");
}
