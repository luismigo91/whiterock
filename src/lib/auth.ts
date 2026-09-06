import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./prisma";

// Lazy dynamic import to avoid hard failure if next-auth not configured
// For MVP without DATABASE_URL, fallback to mock session
export const authConfig = {
  adapter: PrismaAdapter(prisma) as never,
  providers: [] as never[], // email provider added when SMTP configured
  session: { strategy: "jwt" as const },
  trustHost: true,
};

let _handlers: { GET: unknown; POST: unknown } = { GET: async () => new Response("auth disabled", { status: 501 }), POST: async () => new Response("auth disabled", { status: 501 }) };
try {
  if (process.env.NEXTAUTH_SECRET) {
    const h = NextAuth(authConfig as never);
    // NextAuth v5 returns {handlers, auth, signIn, signOut}
    _handlers = (h as unknown as { handlers?: { GET: unknown; POST: unknown } }).handlers ?? (h as unknown as { GET: unknown; POST: unknown });
  }
} catch {}

export const handlers = _handlers;
export const auth = async () => null as never;
export const signIn = async () => {};
export const signOut = async () => {};
