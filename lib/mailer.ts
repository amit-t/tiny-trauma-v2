import "server-only";
import { render } from "@react-email/components";
import { Resend } from "resend";

import { env } from "./env";
import { SignInEmail } from "@/emails/sign-in";
import {
  ConfirmSubscriptionEmail,
  type ConfirmSubscriptionEmailProps,
} from "@/emails/confirm-subscription";
import { WelcomeEmail, type WelcomeEmailProps } from "@/emails/welcome";
import { EssayEmail, type EssayEmailProps } from "@/emails/essay";

let _resend: Resend | null = null;
function client(): Resend {
  if (!_resend) _resend = new Resend(env.RESEND_API_KEY);
  return _resend;
}

async function send({
  to,
  subject,
  html,
  text,
  tags,
}: {
  to: string;
  subject: string;
  html: string;
  text: string;
  tags?: { name: string; value: string }[];
}) {
  return client().emails.send({
    from: env.RESEND_FROM,
    to,
    replyTo: env.RESEND_REPLY_TO,
    subject,
    html,
    text,
    tags,
  });
}

export async function sendMagicLinkEmail(to: string, url: string): Promise<void> {
  const html = await render(SignInEmail({ url }));
  const text = `here's your tiny trauma sign-in link. expires in 15 minutes.\n\n${url}\n\nif you didn't request this, ignore it.`;
  await send({ to, subject: "your tiny trauma sign-in link", html, text });
}

export async function sendConfirmSubscriptionEmail(
  to: string,
  props: ConfirmSubscriptionEmailProps,
): Promise<void> {
  const html = await render(ConfirmSubscriptionEmail(props));
  const text = `confirm your tiny trauma subscription:\n\n${props.confirmUrl}\n\nif you didn't ask for this, ignore — nothing will be sent until you click.`;
  await send({ to, subject: "confirm your tiny trauma subscription", html, text });
}

export async function sendWelcomeEmail(
  to: string,
  props: WelcomeEmailProps,
): Promise<void> {
  const html = await render(WelcomeEmail(props));
  const hasStarters = props.starterEssays.length > 0;
  const lines = [
    "you're on the list. the next Sunday letter will find you.",
    "",
    ...(hasStarters
      ? [
          "in the meantime, a few essays to start with:",
          ...props.starterEssays.slice(0, 3).map((e) => ` - ${e.title}: ${e.url}`),
          "",
        ]
      : []),
    "you can always reply. I read every email.",
    "— Amit",
  ];
  await send({
    to,
    subject: hasStarters
      ? "you're in. ↳ a few essays to start with"
      : "you're in. the first letter will find you.",
    html,
    text: lines.join("\n"),
  });
}

export async function sendEssayEmail(to: string, props: EssayEmailProps): Promise<void> {
  const html = await render(EssayEmail(props));
  const text = `${props.subject}\n\n${props.publicUrl}\n\nunsubscribe: ${props.unsubscribeUrl}`;
  const tags = props.campaignId
    ? [{ name: "campaign_id", value: props.campaignId }]
    : undefined;
  await send({ to, subject: props.subject, html, text, tags });
}
