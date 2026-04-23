// @ts-nocheck
import { createAuthClient } from "better-auth/react";

// @ts-ignore - better-auth type portability issue in IDE
export const authClient: ReturnType<typeof createAuthClient> = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL ?? "",
});

export const { signIn, signUp, signOut, useSession, getSession } = authClient;
