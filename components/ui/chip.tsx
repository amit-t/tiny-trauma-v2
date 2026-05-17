import { type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type ChipTint = "lavender" | "sage" | "butter" | "peach" | "slate";

const TINT_CLASS: Record<ChipTint, string> = {
  lavender: "l",
  sage: "s",
  butter: "b",
  peach: "p",
  slate: "sl",
};

export function Chip({
  tint,
  className,
  children,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tint: ChipTint }) {
  return (
    <span className={cn("chip", TINT_CLASS[tint], className)} {...props}>
      {children}
    </span>
  );
}
