import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
} from "./email";

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  baseURL: process.env.BETTER_AUTH_URL ?? appUrl,

  emailAndPassword: {
    enabled: true,
    // Set RESEND_API_KEY in .env to enable verification enforcement.
    // When the key is present and valid, emails go out via Resend automatically.
    requireEmailVerification:
      !!process.env.RESEND_API_KEY &&
      !process.env.RESEND_API_KEY.includes("your_resend"),
    sendResetPassword: async ({ user, url }) => {
      try {
        await sendPasswordResetEmail(user.email, user.name ?? "there", url);
      } catch (err) {
        console.error("[Auth] Failed to send password reset email:", err);
      }
    },
  },

  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      try {
        await sendVerificationEmail(user.email, user.name ?? "there", url);
        // Also send a welcome email on first sign-up
        await sendWelcomeEmail(user.email, user.name ?? "there");
      } catch (err) {
        console.error("[Auth] Failed to send verification email:", err);
      }
    },
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // refresh every 24h
  },

  trustedOrigins: [appUrl, "http://localhost:3000", "http://localhost:3001"],
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;
