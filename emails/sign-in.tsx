import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

const COLORS = {
  bg: "#14110C",
  surface: "#1D1812",
  ink: "#ECE4D0",
  ink2: "#B5AB93",
  ink3: "#847B6A",
  accent: "#F08652",
  onAccent: "#14110C",
  border: "#2A2520",
};

const SERIF = '"Fraunces", Georgia, serif';
const MONO = '"IBM Plex Mono", ui-monospace, Menlo, monospace';

export type SignInEmailProps = {
  url: string;
  expiresInMinutes?: number;
};

export function SignInEmail({ url, expiresInMinutes = 15 }: SignInEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>{`your tiny trauma sign-in link — expires in ${expiresInMinutes} minutes`}</Preview>
      <Body
        style={{
          background: COLORS.bg,
          color: COLORS.ink,
          fontFamily: MONO,
          margin: 0,
          padding: "32px 0",
        }}
      >
        <Container
          style={{
            maxWidth: 520,
            margin: "0 auto",
            padding: "40px 32px",
            background: COLORS.surface,
            borderRadius: 14,
          }}
        >
          <Text
            style={{
              fontFamily: SERIF,
              fontWeight: 800,
              fontSize: 28,
              letterSpacing: "-0.02em",
              color: COLORS.ink,
              margin: 0,
              textTransform: "lowercase",
            }}
          >
            tiny{" "}
            <span style={{ fontStyle: "italic", color: COLORS.accent, fontWeight: 700 }}>
              trauma
            </span>
          </Text>

          <Section style={{ marginTop: 28 }}>
            <Text
              style={{
                fontFamily: SERIF,
                fontStyle: "italic",
                fontSize: 22,
                lineHeight: 1.4,
                color: COLORS.ink2,
                margin: 0,
              }}
            >
              here&apos;s your link. it expires in {expiresInMinutes} minutes, mostly
              because it should.
            </Text>
          </Section>

          <Section style={{ marginTop: 28 }}>
            <Button
              href={url}
              style={{
                background: COLORS.accent,
                color: COLORS.onAccent,
                fontFamily: MONO,
                fontWeight: 500,
                fontSize: 14,
                padding: "12px 22px",
                borderRadius: 8,
                textDecoration: "none",
              }}
            >
              sign in →
            </Button>
          </Section>

          <Text
            style={{
              fontFamily: MONO,
              fontSize: 12.5,
              lineHeight: 1.6,
              color: COLORS.ink3,
              marginTop: 24,
              wordBreak: "break-all",
            }}
          >
            or paste this into a browser:{" "}
            <Link href={url} style={{ color: COLORS.accent }}>
              {url}
            </Link>
          </Text>

          <Hr style={{ borderColor: COLORS.border, margin: "32px 0 16px" }} />

          <Text
            style={{
              fontFamily: MONO,
              fontSize: 12,
              lineHeight: 1.55,
              color: COLORS.ink3,
              margin: 0,
            }}
          >
            this is the only kind of email this place sends without you asking. if you
            didn&apos;t request it, ignore it — the link will expire on its own.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default SignInEmail;
