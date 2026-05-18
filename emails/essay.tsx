import { Hr, Link, Section, Text } from "@react-email/components";
import { EMAIL_COLORS, EMAIL_MONO, EMAIL_SERIF, EmailLayout } from "./_layout";

export type EssayEmailProps = {
  subject: string;
  preheader: string;
  personalNote?: string | null;
  /** HTML body string from velite. Already includes pullquotes/asides. */
  bodyHtml: string;
  /** "musing" / "short" — small kicker at the top. */
  kind: "musing" | "short";
  number: number;
  publicUrl: string;
  unsubscribeUrl: string;
  /**
   * Optional. The send helper forwards this to Resend as a tag so the
   * webhook can attribute opens/clicks/bounces back to the right campaign.
   */
  campaignId?: string | null;
};

/**
 * Renders the body HTML inline. We rely on the writer's discipline (only `==`,
 * `>>>`, `[[aside]]` marks plus `*em*`) to keep the output mail-client-safe.
 * Inline styles are injected for the class hooks emitted by the remark
 * plugins, since email clients drop `<style>` and won't load globals.css.
 */
export function EssayEmail({
  subject,
  preheader,
  personalNote,
  bodyHtml,
  kind,
  number,
  publicUrl,
  unsubscribeUrl,
}: EssayEmailProps) {
  const styledHtml = injectInlineStyles(bodyHtml);

  return (
    <EmailLayout preview={preheader || subject} unsubscribeUrl={unsubscribeUrl}>
      <Section style={{ marginTop: 24 }}>
        <Text
          style={{
            fontFamily: EMAIL_MONO,
            fontSize: 12,
            letterSpacing: "0.04em",
            color: EMAIL_COLORS.ink3,
            margin: 0,
          }}
        >
          ● {kind} · № {String(number).padStart(3, "0")}
        </Text>
        <Text
          style={{
            fontFamily: EMAIL_SERIF,
            fontSize: 30,
            lineHeight: 1.1,
            letterSpacing: "-0.025em",
            fontWeight: 600,
            color: EMAIL_COLORS.ink,
            margin: "10px 0 0",
          }}
        >
          {subject}
        </Text>
      </Section>

      {personalNote && personalNote.trim() && (
        <Section
          style={{
            marginTop: 20,
            paddingTop: 16,
            borderTop: `1px solid ${EMAIL_COLORS.border}`,
          }}
        >
          <Text
            style={{
              fontFamily: EMAIL_SERIF,
              fontStyle: "italic",
              fontSize: 15.5,
              lineHeight: 1.55,
              color: EMAIL_COLORS.ink2,
              margin: 0,
            }}
          >
            {personalNote}
          </Text>
          <Text
            style={{
              fontFamily: EMAIL_MONO,
              fontSize: 11.5,
              color: EMAIL_COLORS.ink3,
              margin: "6px 0 0",
            }}
          >
            — a small note before the essay
          </Text>
        </Section>
      )}

      <Hr style={{ borderColor: EMAIL_COLORS.border, margin: "24px 0" }} />

      <div
        // The body is server-rendered HTML from velite; the styler below
        // adds the inline rules each mail client needs.
        dangerouslySetInnerHTML={{ __html: styledHtml }}
        style={{
          fontFamily: EMAIL_SERIF,
          fontSize: 17,
          lineHeight: 1.7,
          color: EMAIL_COLORS.ink,
        }}
      />

      <Text
        style={{
          fontFamily: EMAIL_MONO,
          fontSize: 12.5,
          color: EMAIL_COLORS.ink3,
          marginTop: 28,
        }}
      >
        read this on the web:{" "}
        <Link href={publicUrl} style={{ color: EMAIL_COLORS.accent }}>
          {publicUrl}
        </Link>
      </Text>
    </EmailLayout>
  );
}

export default EssayEmail;

/**
 * Rewrites the velite-emitted HTML to use inline styles so it survives Gmail,
 * iOS Mail and Outlook. Targets only the three classes our remark plugins emit
 * plus generic `<p>` / `<em>` / `<h2>` / `<a>` defaults.
 */
function injectInlineStyles(html: string): string {
  const c = EMAIL_COLORS;
  const serif = EMAIL_SERIF;
  return html
    .replace(/<p>/g, `<p style="margin:0 0 14px;line-height:1.7;color:${c.ink};">`)
    .replace(
      /<h2>/g,
      `<h2 style="font-family:${serif};font-size:24px;font-weight:600;letter-spacing:-0.015em;color:${c.ink};margin:32px 0 12px;">`,
    )
    .replace(/<em>/g, `<em style="font-style:italic;color:${c.accent};">`)
    .replace(
      /<a /g,
      `<a style="color:${c.accent};border-bottom:1px solid currentColor;text-decoration:none;" `,
    )
    .replace(
      /<span class="hand-inline">/g,
      `<span style="font-family:${serif};font-style:italic;color:${c.accent};font-weight:600;font-size:1.05em;">`,
    )
    .replace(
      /<span class="aside-line">/g,
      `<span style="display:block;font-family:${serif};font-style:italic;color:${c.accent};font-size:18px;margin:18px 0;">`,
    )
    .replace(
      /<blockquote class="pullquote">/g,
      `<blockquote style="margin:24px 0;padding:18px 22px;background:${c.bg};border-left:3px solid ${c.accent};border-radius:6px;font-family:${serif};font-style:italic;font-size:19px;line-height:1.4;color:${c.ink};">`,
    )
    .replace(/<div class="body">/g, `<div>`)
    .replace(
      /<span class="src">/g,
      `<span style="display:block;margin-top:12px;font-family:${EMAIL_MONO};font-size:12px;font-style:normal;color:${c.ink3};">`,
    );
}
