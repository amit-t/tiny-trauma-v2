import { type ReactNode } from "react";

export type MarginGroup = {
  label: string;
  value: ReactNode;
};

export function Marginalia({
  groups,
  backHref,
  backLabel = "back",
}: {
  groups: MarginGroup[];
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <aside className="margin">
      {groups.map((g) => (
        <div key={g.label} className="grp">
          <div className="lbl">{g.label}</div>
          <div className="val">{g.value}</div>
        </div>
      ))}
      {backHref && (
        <a href={backHref} className="back">
          {backLabel}
        </a>
      )}
    </aside>
  );
}
