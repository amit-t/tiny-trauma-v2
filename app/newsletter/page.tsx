import Link from "next/link";
import { HandInline } from "@/components/ui/hand-inline";
import { SiteShell } from "@/components/layout/site-shell";
import { SubscribeForm } from "@/components/subscribe-form";
import { listSentCampaigns } from "@/lib/campaigns";
import { pastLetters as samplePastLetters } from "@/lib/sample-data";
import { findMusing, findShort } from "@/lib/posts";
import { renderInline } from "@/lib/render-prose";
import { padNum, stripMarkers } from "@/lib/format";

import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Newsletter",
  description:
    "One short essay, in your inbox, most Sundays. Sometimes a short fiction on the side. No threads, no tips.",
};

type PastEntry = {
  key: string;
  number: number;
  date: string;
  href: string;
  title: string;
  summary: string;
  stat: string;
};

/**
 * Past letters come from the real campaigns table once any have been sent.
 * Until then we fall back to the sample data so the page never reads empty
 * in dev.
 */
async function loadPastLetters(): Promise<PastEntry[]> {
  const sent = await listSentCampaigns();
  if (sent.length === 0) {
    return samplePastLetters.map((p) => ({
      key: `sample-${p.number}`,
      number: p.number,
      date: p.date,
      href: `/musings/${p.musingSlug}`,
      title: p.summary.split(".")[0]!,
      summary: p.summary,
      stat: `${p.opens.toLocaleString()} opens`,
    }));
  }
  return sent.map((c) => {
    const post = c.postType === "musing" ? findMusing(c.postSlug) : findShort(c.postSlug);
    const path = c.postType === "musing" ? "musings" : "shorts";
    return {
      key: c.id,
      number: post?.number ?? 0,
      date: formatShortDate(c.sentAt ?? c.createdAt),
      href: `/${path}/${c.postSlug}`,
      title: post?.title ?? c.subject,
      summary: post?.dek ?? c.preheader,
      stat:
        c.openCount > 0 ? `${c.openCount.toLocaleString()} opens` : `${c.sentCount} sent`,
    };
  });
}

function formatShortDate(ms: number): string {
  return new Date(ms)
    .toLocaleDateString("en-US", { month: "short", day: "2-digit" })
    .toLowerCase();
}

const FAQ = [
  {
    q: (
      <>
        How often do you send it, <em>actually</em>?
      </>
    ),
    a: (
      <>
        Most Sundays since January 2024. I have missed three weeks in two years — once for
        a death, once for a flu, once because I couldn&apos;t get the ending right and
        refused to send a piece I didn&apos;t believe in.{" "}
        <em>I am proudest of the third one.</em>
      </>
    ),
  },
  {
    q: <>Is there a paid tier?</>,
    a: (
      <>
        No. There will probably never be a paid tier. If there ever is, the free essays
        will keep being free. The voice doesn&apos;t change at the paywall, and I am not
        interested in the kind of writing that would change at one.
      </>
    ),
  },
  {
    q: (
      <>
        What do you do with my <em>email address</em>?
      </>
    ),
    a: (
      <>
        I put it in a quiet self-hosted list, send you the essay, and never give it to
        anyone else. No analytics pixels. No referral programs. No third-party anything.
        Unsubscribe is one click and works the first time.
      </>
    ),
  },
  {
    q: <>Will you read my reply?</>,
    a: (
      <>
        <em>Yes.</em> Every one. Usually within a week. Sometimes within a month, if
        it&apos;s a hard one. The interesting replies, with permission, become the next
        essay. I have written four essays this year that started as a reader&apos;s reply.
      </>
    ),
  },
  {
    q: <>Can I forward an essay to someone?</>,
    a: (
      <>
        Please do. The handwritten line at the bottom of every essay —{" "}
        <em>&ldquo;if you found something here, tell someone&rdquo;</em> — is not
        decorative. Forwarding is how this place grows. Tell someone.
      </>
    ),
  },
];

export default function NewsletterPage() {
  return (
    <SiteShell activeHref="/newsletter">
      <section className="page-intro">
        <div className="kicker">
          <span>newsletter · sundays · since jan 2024</span>
        </div>
        <h1>
          Sunday <em>letters.</em>
        </h1>
        <p className="lede">
          One short essay, in your inbox, most Sundays. Sometimes a short fiction on the
          side. <HandInline>no threads, no tips, mostly.</HandInline> Designed to be read
          with the second cup of coffee, before the day asks for anything.
        </p>
      </section>

      <section className="subscribe-card">
        <div>
          <h2>
            Get the small things, <em>weekly.</em>
          </h2>
          <p className="pitch">
            1,240 quiet readers. No spam. Unsubscribe in one click. I read every reply —
            even the angry ones, especially the angry ones.
          </p>
        </div>
        <SubscribeForm variant="card" source="newsletter" />
      </section>

      <section className="what">
        <div className="sect-h-row" style={{ marginBottom: 0 }}>
          <h2 className="sect-h">
            What lands in your <em>inbox.</em>
          </h2>
          <span className="aside">three things, mostly</span>
        </div>
        <div className="what-grid">
          <article className="what-card">
            <span className="glyph">①</span>
            <h3>
              One <em>musing.</em>
            </h3>
            <p>
              A short essay, 600–1,200 words. About the dad in the noodle commercial, or
              the auto-rickshaw, or the friend I owe a haircut. Written between 11 p.m.
              and midnight, edited Sunday morning over coffee.
            </p>
            <span className="meta">every sunday · ~ 4 min read</span>
          </article>
          <article className="what-card">
            <span className="glyph">②</span>
            <h3>
              A small <em>fiction</em>, sometimes.
            </h3>
            <p>
              About once a month, a short fiction joins the essay — a few hundred words
              about someone doing something slightly strange. Often unresolved. Always
              unexplained.
            </p>
            <span className="meta">~ monthly · ~ 5 min read</span>
          </article>
          <article className="what-card">
            <span className="glyph">③</span>
            <h3>
              One <em>footnote.</em>
            </h3>
            <p>
              A single line at the bottom of the email — what I&apos;m reading, what
              I&apos;m writing, what I&apos;m avoiding. Three sentences total.{" "}
              <em>The currently strip, but earlier.</em>
            </p>
            <span className="meta">every sunday · 10 seconds</span>
          </article>
        </div>
      </section>

      <section className="past">
        <div className="sect-h-row" style={{ marginBottom: 0 }}>
          <h2 className="sect-h">
            Past <em>letters.</em>
          </h2>
          <Link
            href="/musings"
            className="aside"
            style={{
              color: "var(--ink-2)",
              borderBottom: "1px solid var(--border)",
              paddingBottom: 2,
            }}
          >
            browse the full archive →
          </Link>
        </div>
        <PastList />
      </section>

      <section className="faq">
        <div className="sect-h-row" style={{ marginBottom: 0 }}>
          <h2 className="sect-h">
            The <em>small</em> questions.
          </h2>
          <span className="aside">five quick answers</span>
        </div>
        <div className="faq-grid">
          {FAQ.map((item, i) => (
            <div key={i} className="faq-item">
              <div className="q">{item.q}</div>
              <div className="a">{item.a}</div>
            </div>
          ))}
        </div>
      </section>

      <section
        style={{
          textAlign: "center",
          padding: "56px 0 24px",
          borderTop: "1px solid var(--rule)",
          marginTop: 24,
        }}
      >
        <div
          className="hand-aside"
          style={{ fontSize: 28, marginBottom: 16, transform: "rotate(-2deg)" }}
        >
          ↳ one more time, for the road —
        </div>
        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(36px, 5vw, 56px)",
            lineHeight: 1,
            fontWeight: 700,
            letterSpacing: "-0.03em",
            fontVariationSettings: "'opsz' 60, 'SOFT' 50",
            color: "var(--ink)",
            maxWidth: "16ch",
            margin: "0 auto",
          }}
        >
          get the <em style={{ color: "var(--accent)", fontStyle: "italic" }}>small</em>{" "}
          things, weekly.
        </h2>
        <div
          style={{
            margin: "28px auto 0",
            maxWidth: 480,
            padding: "0 16px",
          }}
        >
          <SubscribeForm variant="mini" source="footer" />
        </div>
        <p style={{ color: "var(--ink-3)", fontSize: 12.5, marginTop: 12 }}>
          no spam · unsubscribe in one click · I read every reply.
        </p>
      </section>
    </SiteShell>
  );
}

async function PastList() {
  const items = await loadPastLetters();
  return (
    <div className="past-list">
      {items.map((p) => (
        <article key={p.key} className="past-item">
          <div className="when">
            <span className="num">№ {padNum(p.number)}</span>
            {p.date}
          </div>
          <div>
            <h4>
              <Link href={p.href} title={stripMarkers(p.summary)}>
                {renderInline(p.title)}
              </Link>
            </h4>
            <p className="summary">{renderInline(p.summary)}</p>
          </div>
          <div className="stat">{p.stat}</div>
        </article>
      ))}
    </div>
  );
}
