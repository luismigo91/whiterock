import NextAuth from "next-auth";
import Nodemailer from "next-auth/providers/nodemailer";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./prisma";

export const authConfig = {
  adapter: PrismaAdapter(prisma) as never,
  providers: [
    Nodemailer({
      server: {
        host: process.env.SMTP_HOST || "localhost",
        port: Number(process.env.SMTP_PORT || 1025),
        auth: process.env.SMTP_USER
          ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
          : undefined,
      },
      from: process.env.SMTP_FROM || "noreply@whiterock.es",
      // In dev without SMTP, log magic link to console instead of sending
      async sendVerificationRequest({ identifier, url }: { identifier: string; url: string; provider: unknown }) {
        if (!process.env.SMTP_HOST) {
          console.log(`[auth] Magic link for ${identifier}: ${url}`);
          return;
        }
        // fallback to default nodemailer send (handled by provider internally)
        // This hook overrides default, so we re-implement send via nodemailer if needed
        const nodemailer = await import("nodemailer");
        const transport = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT || 587),
          auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
        });
        await transport.sendMail({
          to: identifier,
          from: process.env.SMTP_FROM || "noreply@whiterock.es",
          subject: "Tu acceso a Whiterock",
          text: `Entra en Whiterock con este enlace: ${url}`,
          html: `<p>Entra en Whiterock con este enlace:</p><p><a href="${url}">${url}</a></p>`,
        });
      },
    }),
  ],
  session: { strategy: "jwt" as const },
  trustHost: true,
  pages: {
    signIn: "/auth/signin",
  },
};

// Only init if NEXTAUTH_SECRET is set; otherwise handlers return 501 but auth still stubbed
let _handlers: { GET: unknown; POST: unknown } = {
  GET: async () => new Response("auth: configura NEXTAUTH_SECRET y SMTP_HOST (ver .env.example) — magic link deshabilitado", { status: 501, headers: { "Content-Type": "text/plain" } }),
  POST: async () => new Response("auth disabled", { status: 501 }),
};
let _auth: () => Promise<unknown> = async () => null;
let _signIn: (provider?: string, options?: Record<string, unknown>) => Promise<never> = async () => { throw new Error("auth disabled"); };
let _signOut: () => Promise<never> = async () => { throw new Error("auth disabled"); };

try {
  if (process.env.NEXTAUTH_SECRET) {
    const h = NextAuth(authConfig as never);
    // NextAuth v5 returns { handlers, auth, signIn, signOut }
    const maybe = h as unknown as { handlers?: { GET: unknown; POST: unknown }; auth?: unknown; signIn?: unknown; signOut?: unknown };
    _handlers = (maybe.handlers as never) ?? (h as unknown as typeof _handlers);
    _auth = (maybe.auth as never) ?? _auth;
    _signIn = (maybe.signIn as never) ?? _signIn;
    _signOut = (maybe.signOut as never) ?? _signOut;
  }
} catch (e) {
  console.warn("[auth] init failed", e);
}

export const handlers = _handlers;
export const auth = _auth as () => Promise<{ user?: { email?: string; name?: string } } | null>;
export const signIn = _signIn;
export const signOut = _signOut;
