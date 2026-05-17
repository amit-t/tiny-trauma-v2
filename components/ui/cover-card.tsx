import Link from "next/link";
import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

export type CoverColor = "a" | "b" | "c" | "d" | "e" | "f";

export function CoverCard({
  href,
  issue,
  title,
  dek,
  meta,
  corner,
  color = "a",
  className,
}: {
  href: string;
  issue: string;
  title: ReactNode;
  dek?: ReactNode;
  meta?: ReactNode;
  corner?: ReactNode;
  color?: CoverColor;
  className?: string;
}) {
  return (
    <Link href={href} className={cn("cover-card", `c-${color}`, className)}>
      <div className="cover">
        <span className="no">{issue}</span>
        {corner && <span className="corner-mark">{corner}</span>}
        <span className="title">{title}</span>
      </div>
      {(dek || meta) && (
        <div>
          {dek && <p className="dek">{dek}</p>}
          {meta && <div className="meta">{meta}</div>}
        </div>
      )}
    </Link>
  );
}
