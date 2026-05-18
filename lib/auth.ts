import "server-only";

import { betterAuth } from "better-auth";
import { magicLink } from "better-auth/plugins";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

import { db } from "./db";
import { env } from "./env";
import { sendMagicLinkEmail } from "./mailer";

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg" }),
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  emailAndPassword: { enabled: false },
  plugins: [
    magicLink({
      expiresIn: 60 * 15,
      disableSignUp: false,
      sendMagicLink: async ({ email, url }) => {
        await sendMagicLinkEmail(email, url);
      },
    }),
  ],
});
