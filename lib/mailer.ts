import "server-only";
import { render } from "@react-email/components";
import { Resend } from "resend";

import { env } from "./env";
import { SignInEmail } from "@/emails/sign-in";

let _resend: Resend | null = null;
function client(): Resend {
  if (!_resend) _resend = new Resend(env.RESEND_API_KEY);
  return _resend;
}

export async function sendMagicLinkEmail(to: string, url: string): Promise<void> {
  const html = await render(SignInEmail({ url }));
  const text = `here's your tiny trauma sign-in link. expires in 15 minutes.\n\n${url}\n\nif you didn't request this, ignore it.`;
  await client().emails.send({
    from: env.RESEND_FROM,
    to,
    replyTo: env.RESEND_REPLY_TO,
    subject: "your tiny trauma sign-in link",
    html,
    text,
  });
}
