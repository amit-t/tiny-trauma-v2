import { Nav, type NavLink } from "@/components/ui/nav";
import { ColophonFooter } from "@/components/ui/colophon-footer";
import { currentlyBlock } from "@/lib/sample-data";
import { renderInline } from "@/lib/render-prose";

const ELSEWHERE = [
  { label: "twitter", href: "#" },
  { label: "instagram", href: "#" },
  { label: "rss", href: "/feed.xml" },
  { label: "hi@tinytrauma.in", href: "mailto:hi@tinytrauma.in" },
];

export function SiteShell({
  children,
  activeHref,
  navLinks,
}: {
  children: React.ReactNode;
  activeHref?: string;
  navLinks?: NavLink[];
}) {
  return (
    <div className="wrap">
      <Nav activeHref={activeHref} links={navLinks} />
      <main>{children}</main>
      <ColophonFooter
        about={
          <>
            <strong style={{ color: "var(--ink)" }}>tiny trauma</strong> is a personal
            blog by Amit T, an engineering-trained Bangalorean who overthinks most things,
            occasionally to useful effect. Short essays, shorter fictions. Mostly small.
            Sometimes funny. Always honest.
          </>
        }
        currently={[
          { label: "reading", value: renderInline(currentlyBlock.reading) },
          { label: "writing", value: renderInline(currentlyBlock.writing) },
          { label: "noticing", value: renderInline(currentlyBlock.noticing) },
        ]}
        elsewhere={ELSEWHERE}
        base={
          <>
            <span>
              © {new Date().getFullYear()} tiny trauma · set in fraunces &amp; ibm plex
              mono · made in bangalore
            </span>
            <span>vol. 02 · issue 19</span>
          </>
        }
      />
    </div>
  );
}
