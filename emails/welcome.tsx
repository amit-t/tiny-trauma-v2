import { Link, Section, Text } from "@react-email/components";
import { EMAIL_COLORS, EMAIL_MONO, EMAIL_SERIF, EmailLayout } from "./_layout";

export type WelcomeEmailProps = {
  starterEssays: { url: string; title: string }[];
  unsubscribeUrl: string;
};

export function WelcomeEmail({ starterEssays, unsubscribeUrl }: WelcomeEmailProps) {
  return (
    <EmailLayout
      preview={
        starterEssays.length > 0
          ? "you're in. ↳ a few essays to start with"
          : "you're in. the first letter will find you."
      }
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
          you&apos;re on the list. the next Sunday letter will find you.
        </Text>
        {starterEssays.length > 0 && (
          <Text
            style={{
              fontFamily: EMAIL_MONO,
              fontSize: 14,
              lineHeight: 1.7,
              color: EMAIL_COLORS.ink2,
              marginTop: 20,
            }}
          >
            in the meantime, a few essays to start with — these are the ones I&apos;d
            press into your hand if we were standing next to a kettle:
          </Text>
        )}
      </Section>

      {starterEssays.length > 0 && (
        <Section style={{ marginTop: 20 }}>
          {starterEssays.slice(0, 3).map((e) => (
            <Text
              key={e.url}
              style={{
                fontFamily: EMAIL_SERIF,
                fontSize: 18,
                lineHeight: 1.35,
                color: EMAIL_COLORS.ink,
                margin: "8px 0",
              }}
            >
              ↳{" "}
              <Link
                href={e.url}
                style={{
                  color: EMAIL_COLORS.ink,
                  borderBottom: `1px solid ${EMAIL_COLORS.border}`,
                }}
              >
                {e.title}
              </Link>
            </Text>
          ))}
        </Section>
      )}

      <Text
        style={{
          fontFamily: EMAIL_MONO,
          fontSize: 13,
          lineHeight: 1.7,
          color: EMAIL_COLORS.ink2,
          marginTop: 24,
        }}
      >
        you can always reply. I read every email, even the angry ones. especially the
        angry ones.
      </Text>

      <Text
        style={{
          fontFamily: EMAIL_SERIF,
          fontStyle: "italic",
          fontSize: 16,
          color: EMAIL_COLORS.ink2,
          marginTop: 16,
        }}
      >
        — Amit
      </Text>
    </EmailLayout>
  );
}

export default WelcomeEmail;
