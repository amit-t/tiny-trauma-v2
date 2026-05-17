import Link from "next/link";
import { HandAside } from "@/components/ui/hand-aside";
import { SiteShell } from "@/components/layout/site-shell";

export default function NotFound() {
  return (
    <SiteShell>
      <section className="page-intro">
        <div className="kicker">
          <span>error · 404</span>
        </div>
        <h1>
          This page does not exist, <em>and probably never did.</em>
        </h1>
        <p className="lede">
          <HandAside>↳ try the</HandAside> <Link href="/musings">musings</Link>? Or the{" "}
          <Link href="/shorts">shorts</Link>, which are sometimes lighter on a Sunday.
        </p>
      </section>
    </SiteShell>
  );
}
