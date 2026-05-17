import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

export function HandAside({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <span className={cn("hand-aside", className)}>{children}</span>;
}
