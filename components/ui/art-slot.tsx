import { type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export type ArtTint = "default" | "lavender" | "sage" | "butter" | "peach" | "slate";

const TINT_CLASS: Record<ArtTint, string> = {
  default: "",
  lavender: "tint-l",
  sage: "tint-s",
  butter: "tint-b",
  peach: "tint-p",
  slate: "tint-sl",
};

export function ArtSlot({
  tint = "default",
  aspectRatio,
  placeholder,
  children,
  className,
  style,
}: {
  tint?: ArtTint;
  aspectRatio?: string;
  placeholder?: string;
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  const merged: CSSProperties = { ...style };
  if (aspectRatio) merged.aspectRatio = aspectRatio;

  return (
    <div className={cn("art-slot", TINT_CLASS[tint], className)} style={merged}>
      {placeholder && <span className="ph">{placeholder}</span>}
      {children}
    </div>
  );
}
