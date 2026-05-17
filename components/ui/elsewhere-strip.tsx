export type ElsewhereLink = { label: string; href: string };

export function ElsewhereStrip({
  label = "find me elsewhere —",
  links,
}: {
  label?: string;
  links: ElsewhereLink[];
}) {
  return (
    <div className="elsewhere-strip">
      <span className="label">{label}</span>
      {links.map((l) => (
        <a key={l.href + l.label} href={l.href}>
          {l.label}
        </a>
      ))}
    </div>
  );
}
