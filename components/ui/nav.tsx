import Link from "next/link";
import { Wordmark } from "./wordmark";
import { ThemeToggle } from "../theme-toggle";

export type NavLink = {
  href: string;
  label: string;
  secondary?: boolean;
};

const DEFAULT_LINKS: NavLink[] = [
  { href: "/musings", label: "musings" },
  { href: "/shorts", label: "shorts" },
  { href: "/about", label: "about", secondary: true },
  { href: "/newsletter", label: "newsletter", secondary: true },
];

export function Nav({
  links = DEFAULT_LINKS,
  activeHref,
}: {
  links?: NavLink[];
  activeHref?: string;
}) {
  const showDesign = process.env.NODE_ENV !== "production";

  return (
    <header className="nav">
      <Wordmark size="nav" />
      <nav className="nav-links">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={[
              activeHref === l.href ? "active" : undefined,
              l.secondary ? "secondary" : undefined,
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {l.label}
          </Link>
        ))}
        {showDesign && (
          <Link
            href="/design"
            className={["secondary", activeHref === "/design" ? "active" : undefined]
              .filter(Boolean)
              .join(" ")}
          >
            design
          </Link>
        )}
        <ThemeToggle />
      </nav>
    </header>
  );
}
