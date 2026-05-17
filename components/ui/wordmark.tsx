import Link from "next/link";
import { cn } from "@/lib/utils";

type Size = "nav" | "hero";

export function Wordmark({
  size = "nav",
  href = "/",
  className,
}: {
  size?: Size;
  href?: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn("brand", size === "hero" ? "brand-hero" : "brand-nav", className)}
    >
      tiny <i>trauma</i>
    </Link>
  );
}
