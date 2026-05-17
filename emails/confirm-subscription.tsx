import { Button, Link, Section, Text } from "@react-email/components";
import { EMAIL_COLORS, EMAIL_MONO, EMAIL_SERIF, EmailLayout } from "./_layout";

export type ConfirmSubscriptionEmailProps = {
  confirmUrl: string;
  unsubscribeUrl?: string;
};

export function ConfirmSubscriptionEmail({
  confirmUrl,
  unsubscribeUrl,
}: ConfirmSubscriptionEmailProps) {
  return (
    <EmailLayout
      preview="confirm your tiny trauma subscription"
      unsubscribeUrl={unsubscribeUrl}
    >
      <Section style={{ marginTop: 24 }}>
        <Text
          style={{
            fontFamily: EMAIL_SERIF,
            fontStyle: "italic",
            fontSize: 22,
            lineHeight: 1.4,
            color: EMAIL_COLORS.ink2,
            margin: 0,
          }}
        >
          one click, mostly because that&apos;s the only spam protection that ever worked.
        </Text>
        <Text
          style={{
            fontFamily: EMAIL_MONO,
            fontSize: 14,
            lineHeight: 1.7,
            color: EMAIL_COLORS.ink2,
            marginTop: 20,
          }}
        >
          confirm below and you&apos;re in. you&apos;ll get one short essay on a Sunday,
          sometimes a short fiction on the side, and a small footnote about what I&apos;m
          reading. nothing else.
        </Text>
      </Section>

      <Section style={{ marginTop: 24 }}>
        <Button
          href={confirmUrl}
          style={{
            background: EMAIL_COLORS.accent,
            color: EMAIL_COLORS.onAccent,
            fontFamily: EMAIL_MONO,
            fontWeight: 500,
            fontSize: 14,
            padding: "12px 22px",
            borderRadius: 8,
            textDecoration: "none",
          }}
        >
          confirm and start reading →
        </Button>
      </Section>

      <Text
        style={{
          fontFamily: EMAIL_MONO,
          fontSize: 12.5,
          lineHeight: 1.6,
          color: EMAIL_COLORS.ink3,
          marginTop: 24,
          wordBreak: "break-all",
        }}
      >
        or paste this:{" "}
        <Link href={confirmUrl} style={{ color: EMAIL_COLORS.accent }}>
          {confirmUrl}
        </Link>
      </Text>

      <Text
        style={{
          fontFamily: EMAIL_MONO,
          fontSize: 12.5,
          lineHeight: 1.55,
          color: EMAIL_COLORS.ink3,
          marginTop: 16,
        }}
      >
        if you didn&apos;t ask for this, ignore it. nothing will be sent until you click.
      </Text>
    </EmailLayout>
  );
}

export default ConfirmSubscriptionEmail;
