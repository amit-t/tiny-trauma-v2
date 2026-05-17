import Link from "next/link";
import { HandInline } from "@/components/ui/hand-inline";
import { SiteShell } from "@/components/layout/site-shell";
import { SubscribeForm } from "@/components/subscribe-form";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description:
    "I'm Amit. this is where I keep things. Mostly essays. Sometimes fiction. Always small.",
};

export default function AboutPage() {
  return (
    <SiteShell activeHref="/about">
      <section className="page-intro">
        <div className="kicker">
          <span>about · this place &amp; the person behind it</span>
        </div>
        <h1>
          A small <em>introduction.</em>
        </h1>
        <p className="lede">
          I&apos;m Amit. <HandInline>this is where I keep things.</HandInline> Mostly
          essays. Sometimes fiction. Always small. I started it because I needed somewhere
          to put the noticing that does not have anywhere else to go.
        </p>
      </section>

      <div className="about-grid">
        <section className="prose">
          <p className="lede">
            A personal blog for people who like sentences more than they like
            infographics, and who would rather read someone overthink an auto-rickshaw
            than a productivity system.
          </p>
          <p>
            I grew up in a smallish town and now live in Bangalore. I work in software,
            which means I spend most of my day naming things badly, breaking things
            politely, and trying to convince smart, slightly tired people that an idea is
            worth one more week. The writing here is not about any of that.
          </p>
          <p>
            The writing here is about <em>noticing</em> — the small moments that
            don&apos;t make a story but don&apos;t go away either. The thing the
            auto-rickshaw driver said. The way my mother asks a question without asking
            it. The friend I owe a haircut and an apology. The advertisement that cracked
            me open on a Tuesday for no good reason.
          </p>
          <p>
            I am suspicious of advice. I am wary of takes. I am not interested in becoming
            a brand, and I am still working out, honestly, whether I am interested in
            becoming a writer or whether I just like the parts of being a writer that
            involve being alone in a room with a kettle.{" "}
            <em>Both, probably. Neither, also probably.</em>
          </p>
          <h2>How I think about the writing</h2>
          <p>
            I try to write like I am leaving a note for one person, not a thousand. The
            voice is dry. The pieces are short on purpose — most of them are written
            between 11 p.m. and midnight, in one sitting, and edited the next morning over
            coffee. If a piece needs a research note or a footnote, it goes in the margin
            or at the bottom, never in the middle of the prose.
          </p>
          <p>
            The <Link href="/musings">musings</Link> are essays. They argue with
            themselves. They try not to land where they&apos;re expected to. The{" "}
            <Link href="/shorts">shorts</Link> are fictions — very small ones, often about
            people doing slightly strange things, never quite explained. I think the line
            between the two is thinner than I pretend.
          </p>
          <p>
            About once a week, on Sundays, I send one of these out as a newsletter. I read
            every reply. The interesting ones, with permission, sometimes become the next
            essay.{" "}
            <em>
              The angry ones, with no permission, sometimes also become the next essay.
            </em>
          </p>
          <h2>
            What this is <em>not</em>
          </h2>
          <p>
            It is not advice. It is not a self-help project. It is not a journal that I am
            pretending is a publication, and it is not a publication that I am pretending
            is a journal. It is not optimised for SEO. There are no affiliate links. There
            is no course. <em>There will probably never be a course.</em>
          </p>
          <p>
            If you&apos;ve read this far, you&apos;re already the right kind of reader,
            and you&apos;re welcome to stay as long as you like.
          </p>
        </section>

        <aside className="side">
          <div className="photo">
            <span className="ph">author photo · 4:5</span>
            <span className="scribble">it&apos;s me, hi.</span>
          </div>
          <div>
            <h3>Amit T</h3>
            <p className="bio">
              Engineering-trained, Bangalore-based, slightly literary, occasionally funny.{" "}
              <em>He / him. Replies, mostly.</em>
            </p>
          </div>
          <div className="facts">
            <Fact k="writing since" v="january 2024" />
            <Fact k="based in" v="bangalore, india" />
            <Fact k="posts so far" v="24 essays · 7 shorts" />
            <Fact
              k="cadence"
              v={
                <>
                  most sundays, <em>mostly</em>
                </>
              }
            />
            <Fact k="readers" v="1,240 quiet ones" />
            <Fact k="day job" v="software, vaguely" />
          </div>
          <div className="cta">
            <h4>
              get the small things, <em>weekly.</em>
            </h4>
            <p>
              one short essay every sunday, sometimes a short fiction on the side. no
              threads. no tips.
            </p>
            <SubscribeForm variant="side" source="about" />
          </div>
        </aside>
      </div>

      <section className="design-banner">
        <div>
          <h3>
            About the <em>design.</em>
          </h3>
          <p>
            If you care about that sort of thing — yes, the type is Fraunces (variable,
            optical 9–144) and IBM Plex Mono. The handwriting is Caveat, used very
            sparingly. The palette is warm cream / soft dark with a single coral accent
            and a yellow marker. Dark is canonical. There are exactly two drop shadows on
            the entire site, and one of them is a mistake I haven&apos;t found yet.
          </p>
          <a className="link" href="#">
            read the longer note on the design →
          </a>
        </div>
        <div className="scribble">
          ↳ if you spot the second shadow,
          <br />
          email me. I&apos;ll buy you chai.
        </div>
      </section>

      <section className="contact">
        <div className="kicker">say hello</div>
        <h2>
          Write back, <em>if you want.</em>
        </h2>
        <p className="email">
          <a href="mailto:hi@tinytrauma.in">hi@tinytrauma.in</a>
        </p>
        <span className="hand">I read every email. I reply to most.</span>
      </section>
    </SiteShell>
  );
}

function Fact({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="row">
      <span className="k">{k}</span>
      <span className="v">{v}</span>
    </div>
  );
}
