import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import type { ReactNode } from "react";

/**
 * Email palette — light mode only. Dark backgrounds + custom webfonts are
 * unreliable across Gmail, iOS Mail and Outlook, so we ship Georgia/serif +
 * monospace fallbacks and a warm cream background. Coral accent survives.
 */
export const EMAIL_COLORS = {
  bg: "#F4EFE3",
  surface: "#FFFFFF",
  ink: "#1A1613",
  ink2: "#52483D",
  ink3: "#8A7F6E",
  accent: "#B4471F",
  accentHover: "#913719",
  onAccent: "#FFFFFF",
  border: "#D9CFB8",
};

export const EMAIL_SERIF =
  "Newsreader, Georgia, 'Iowan Old Style', 'Apple Garamond', serif";
export const EMAIL_MONO =
  "'IBM Plex Mono', SFMono-Regular, Menlo, Monaco, Consolas, monospace";

export function EmailLayout({
  preview,
  children,
  unsubscribeUrl,
}: {
  preview: string;
  children: ReactNode;
  unsubscribeUrl?: string;
}) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body
        style={{
          background: EMAIL_COLORS.bg,
          color: EMAIL_COLORS.ink,
          fontFamily: EMAIL_SERIF,
          margin: 0,
          padding: "32px 0",
        }}
      >
        <Container
          style={{
            maxWidth: 560,
            margin: "0 auto",
            padding: "40px 32px",
            background: EMAIL_COLORS.surface,
            borderRadius: 14,
          }}
        >
          <BrandMark />
          {children}
          {unsubscribeUrl && (
            <>
              <Hr style={{ borderColor: EMAIL_COLORS.border, margin: "32px 0 16px" }} />
              <Text
                style={{
                  fontFamily: EMAIL_MONO,
                  fontSize: 12,
                  lineHeight: 1.55,
                  color: EMAIL_COLORS.ink3,
                  margin: 0,
                }}
              >
                you&apos;re getting this because you asked. one-click{" "}
                <Link href={unsubscribeUrl} style={{ color: EMAIL_COLORS.accent }}>
                  unsubscribe
                </Link>
                . I read every reply.
              </Text>
            </>
          )}
        </Container>
        <Section style={{ textAlign: "center", marginTop: 16 }}>
          <Text
            style={{
              fontFamily: EMAIL_MONO,
              fontSize: 11.5,
              color: EMAIL_COLORS.ink3,
              margin: 0,
            }}
          >
            tiny trauma · bangalore · 2026
          </Text>
        </Section>
      </Body>
    </Html>
  );
}

function BrandMark() {
  return (
    <Text
      style={{
        fontFamily: EMAIL_SERIF,
        fontWeight: 800,
        fontSize: 28,
        letterSpacing: "-0.02em",
        color: EMAIL_COLORS.ink,
        margin: 0,
        textTransform: "lowercase",
      }}
    >
      tiny{" "}
      <span
        style={{
          fontStyle: "italic",
          color: EMAIL_COLORS.accent,
          fontWeight: 700,
        }}
      >
        trauma
      </span>
    </Text>
  );
}
