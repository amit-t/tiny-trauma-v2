import { type ReactNode } from "react";

export function PullQuote({
  children,
  source,
}: {
  children: ReactNode;
  source?: ReactNode;
}) {
  return (
    <blockquote className="pullquote">
      <div className="body">{children}</div>
      {source && <span className="src">{source}</span>}
    </blockquote>
  );
}
