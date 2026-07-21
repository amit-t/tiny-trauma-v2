import { NEWSLETTER_URL } from "@/lib/site";

export type SubscribeVariant = "band" | "side" | "card" | "mini";

/**
 * The newsletter is hosted on Substack. This site is a static export with
 * no runtime, so there is nothing to POST to — this is a plain link, not a
 * form. The variants exist only to match the surrounding layouts (the
 * newsletter band, the about aside, the subscribe card, the footer CTA).
 */
export function SubscribeLink({
  variant,
  label = "subscribe on substack →",
}: {
  variant: SubscribeVariant;
  label?: string;
}) {
  return (
    <div className="subscribe-link">
      <a className="btn btn-primary" href={NEWSLETTER_URL} rel="noopener noreferrer">
        {label}
      </a>
      {variant !== "mini" && (
        <p className="small">
          free · unsubscribe in one click · I read every reply, even the angry ones.
        </p>
      )}
    </div>
  );
}
