import { type ReactNode } from "react";

export function HandInline({ children }: { children: ReactNode }) {
  return <span className="hand-inline">{children}</span>;
}
