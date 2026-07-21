import { ArtSlot } from "@/components/ui/art-slot";
import { Button } from "@/components/ui/button";
import { Chip, type ChipTint } from "@/components/ui/chip";
import { ColophonFooter } from "@/components/ui/colophon-footer";
import { CoverCard } from "@/components/ui/cover-card";
import { FilterPill } from "@/components/ui/filter-pill";
import { HandAside } from "@/components/ui/hand-aside";
import { HandInline } from "@/components/ui/hand-inline";
import { Input } from "@/components/ui/input";
import { Marginalia } from "@/components/ui/marginalia";
import { Nav } from "@/components/ui/nav";
import { PullQuote } from "@/components/ui/pull-quote";
import { Wordmark } from "@/components/ui/wordmark";
import { CONTACT_EMAIL } from "@/lib/site";

const CHIP_TINTS: ChipTint[] = ["lavender", "sage", "butter", "peach", "slate"];
const ART_TINTS = ["default", "lavender", "sage", "butter", "peach", "slate"] as const;

export default function DesignShowcase() {
  return (
    <div className="wrap">
      <Nav activeHref="/design" />

      <main style={{ paddingBottom: 64 }}>
        <Section title="colors">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
              gap: 12,
              marginTop: 16,
            }}
          >
            {[
              "--bg",
              "--surface",
              "--raised",
              "--art",
              "--ink",
              "--ink-2",
              "--ink-3",
              "--ink-4",
              "--border",
              "--rule",
              "--accent",
              "--accent-h",
              "--hi",
              "--on-accent",
            ].map((v) => (
              <Swatch key={v} variable={v} />
            ))}
          </div>
        </Section>

        <Section title="type scale">
          <div style={{ display: "grid", gap: 24, marginTop: 16 }}>
            <SpecimenRow label="display">
              <span className="t-display" style={{ display: "block" }}>
                the small daily friction.
              </span>
            </SpecimenRow>
            <SpecimenRow label="h1">
              <span className="t-h1" style={{ display: "block" }}>
                musings — <em style={{ color: "var(--accent)" }}>essays</em>, drafts,
                marginalia.
              </span>
            </SpecimenRow>
            <SpecimenRow label="h2">
              <span className="t-h2" style={{ display: "block" }}>
                a personal blog about ordinary friction.
              </span>
            </SpecimenRow>
            <SpecimenRow label="h3">
              <span className="t-h3" style={{ display: "block" }}>
                the man at the chai stall has started recognising the auto.
              </span>
            </SpecimenRow>
            <SpecimenRow label="h4">
              <span className="t-h4" style={{ display: "block" }}>
                about the place
              </span>
            </SpecimenRow>
            <SpecimenRow label="lede">
              <span className="t-lede" style={{ display: "block" }}>
                <em>honest, slightly literary, sometimes funny, never a wellness tip.</em>
              </span>
            </SpecimenRow>
            <SpecimenRow label="body">
              <p className="t-body" style={{ maxWidth: "52ch" }}>
                There is a kind of friction so small you don&apos;t bother naming it until
                it costs you something — a friendship, a Sunday, the patience to be kind
                to the auto guy.
              </p>
            </SpecimenRow>
            <SpecimenRow label="small">
              <span className="t-small">7 min read · vol. 02 · issue 19</span>
            </SpecimenRow>
            <SpecimenRow label="caption">
              <span className="t-caption">phase 1 · design system</span>
            </SpecimenRow>
          </div>
        </Section>

        <Section title="wordmark">
          <div
            style={{ display: "flex", gap: 56, alignItems: "baseline", flexWrap: "wrap" }}
          >
            <Wordmark size="nav" />
            <Wordmark size="hero" />
          </div>
        </Section>

        <Section title="buttons">
          <div
            style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}
          >
            <Button>subscribe →</Button>
            <Button variant="secondary">read on</Button>
            <Button variant="ghost">cancel</Button>
            <Button size="sm">small</Button>
            <Button variant="secondary" size="sm">
              small secondary
            </Button>
          </div>
        </Section>

        <Section title="inputs">
          <div style={{ display: "grid", gap: 12, maxWidth: 420 }}>
            <Input placeholder="your email, optionally a name" />
            <Input type="email" placeholder="hi@somewhere.in" />
          </div>
        </Section>

        <Section title="chips">
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {CHIP_TINTS.map((t) => (
              <Chip key={t} tint={t}>
                {t}
              </Chip>
            ))}
          </div>
        </Section>

        <Section title="filter pills">
          <div className="filters" style={{ marginBottom: 0 }}>
            <FilterPill active>
              all <span className="count">87</span>
            </FilterPill>
            <FilterPill>
              musings <span className="count">42</span>
            </FilterPill>
            <FilterPill>
              shorts <span className="count">31</span>
            </FilterPill>
            <FilterPill count={9}>bangalore</FilterPill>
          </div>
        </Section>

        <Section title="hand inline + aside">
          <p className="t-body" style={{ maxWidth: "52ch" }}>
            A personal blog about <HandInline>the small daily friction</HandInline>{" "}
            between who you are and everything around you.
          </p>
          <div style={{ marginTop: 24 }}>
            <HandAside>and the auto guy already knows your address.</HandAside>
          </div>
        </Section>

        <Section title="art slot tints">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 16,
            }}
          >
            {ART_TINTS.map((t) => (
              <ArtSlot key={t} tint={t} aspectRatio="4/3" placeholder={`art · ${t}`} />
            ))}
          </div>
        </Section>

        <Section title="cover card (shorts)">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 32,
            }}
          >
            <CoverCard
              href="#"
              color="a"
              issue="No. 14"
              corner="hand-set"
              title={
                <>
                  the auto <em>knows</em> the dog
                </>
              }
              dek="five hundred words on a corner in koramangala."
              meta={<span>fiction · 4 min</span>}
            />
            <CoverCard
              href="#"
              color="b"
              issue="No. 15"
              title={
                <>
                  cold enough <em>for snow</em>
                </>
              }
              dek="a found notebook, badly transcribed."
              meta={<span>fiction · 6 min</span>}
            />
            <CoverCard
              href="#"
              color="c"
              issue="No. 16"
              title={
                <>
                  things i <em>didn&apos;t</em> say at dinner
                </>
              }
              meta={<span>fiction · 3 min</span>}
            />
          </div>
        </Section>

        <Section title="pull quote">
          <PullQuote source="— field notes, a corner in koramangala">
            And then he said, <em>baba, gaadi se pehchaanta hoon</em> — meaning the dog,
            not me, and not unkindly.
          </PullQuote>
        </Section>

        <Section title="marginalia (essay reading view)">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "12rem minmax(0, 38rem)",
              gap: 56,
              alignItems: "start",
            }}
          >
            <Marginalia
              groups={[
                { label: "filed", value: "may 2026" },
                { label: "tags", value: "bangalore · animals" },
                { label: "reading time", value: "7 min" },
              ]}
              backHref="#"
              backLabel="back to musings"
            />
            <article className="t-body">
              <p>
                There is a corner in Koramangala where, most evenings, an auto driver eats
                one samosa and waits for a dog. The dog knows the auto — not the man, the
                auto.
              </p>
              <p>
                It is one of those small noticings you only commit to the page so you
                don&apos;t lose it. The reading column is the rest of the page; this is
                the column for the things that do not fit.
              </p>
            </article>
          </div>
        </Section>

        <ColophonFooter
          about={
            <>
              <strong style={{ color: "var(--ink)" }}>tiny trauma</strong> is a personal
              blog by Amit T. Short essays, shorter fictions. Always honest.
            </>
          }
          currently={[
            { label: "reading", value: <em>Cold Enough for Snow</em> },
            { label: "writing", value: "phase 1 of this thing." },
            { label: "noticing", value: "the design tokens finally stayed put." },
          ]}
          elsewhere={[
            { label: "twitter", href: "#" },
            { label: "instagram", href: "#" },
            { label: "rss", href: "#" },
            { label: CONTACT_EMAIL, href: `mailto:${CONTACT_EMAIL}` },
          ]}
          base={
            <>
              <span>
                © 2026 tiny trauma · set in fraunces &amp; ibm plex mono · made in
                bangalore
              </span>
              <span>phase 1 · design system</span>
            </>
          }
        />
      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ padding: "56px 0", borderTop: "1px solid var(--rule)" }}>
      <h2
        className="t-h4"
        style={{
          color: "var(--ink-3)",
          textTransform: "lowercase",
          marginBottom: 24,
        }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

function SpecimenRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "6rem 1fr",
        gap: 24,
        alignItems: "baseline",
      }}
    >
      <span className="t-caption">{label}</span>
      <div>{children}</div>
    </div>
  );
}

function Swatch({ variable }: { variable: string }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "44px 1fr",
        gap: 12,
        alignItems: "center",
        padding: 8,
        border: "1px solid var(--border)",
        borderRadius: 8,
      }}
    >
      <span
        style={{
          width: 44,
          height: 44,
          borderRadius: 6,
          background: `var(${variable})`,
          border: "1px solid var(--border)",
        }}
      />
      <code
        style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--ink-2)" }}
      >
        {variable}
      </code>
    </div>
  );
}
