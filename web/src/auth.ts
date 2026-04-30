import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import type { Role } from "@prisma/client";
import { prisma } from "@/lib/db";
import { prismaDevOr } from "@/lib/data/prisma-fallback";
import { env } from "@/lib/env";

/** Limit DB reads inside JWT refresh — without this, every `/api/auth/session` hits Postgres and can time out → ClientFetchError. */
const JWT_DB_REFRESH_SEC = 300;

const providers: NextAuthConfig["providers"] = [
  Credentials({
    name: "credentials",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password) return null;
      const email = String(credentials.email).toLowerCase().trim();
      const user = await prismaDevOr("auth.credentials", () => prisma.user.findUnique({ where: { email } }), null);
      if (!user?.passwordHash || user.bannedAt) return null;
      const ok = await bcrypt.compare(String(credentials.password), user.passwordHash);
      if (!ok) return null;
      return {
        id: user.id,
        email: user.email ?? undefined,
        name: user.name ?? undefined,
        image: user.image ?? undefined,
        role: user.role,
      };
    },
  }),
  ...(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
    ? [
        Google({
          clientId: env.GOOGLE_CLIENT_ID,
          clientSecret: env.GOOGLE_CLIENT_SECRET,
        }),
      ]
    : []),
];

export const { handlers, auth, signIn, signOut } = NextAuth({
  /** Required in many dev / proxy setups so host checks and session URLs match the request. */
  trustHost: true,
  basePath: "/api/auth",
  adapter: PrismaAdapter(prisma) as import("next-auth/adapters").Adapter,
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers,
  callbacks: {
    async jwt({ token, user, trigger, session: triggerSession }) {
      if (user) {
        token.id = user.id;
        const u = user as { id: string; role?: Role; email?: string | null; name?: string | null; image?: string | null };
        if (u.role) token.role = u.role;
        if (trigger === "update" && triggerSession && typeof triggerSession === "object") {
          if ("name" in triggerSession && typeof (triggerSession as { name?: string }).name === "string") {
            token.name = (triggerSession as { name: string }).name;
          }
        } else {
          const db = await prismaDevOr("auth.jwt", () => prisma.user.findUnique({ where: { id: u.id } }), null);
          if (db) {
            token.role = db.role;
            token.name = db.name;
            token.picture = db.image;
          }
        }
      } else if (token.id) {
        if (trigger === "update" && triggerSession && typeof triggerSession === "object") {
          const ts = triggerSession as { name?: string };
          if ("name" in ts && typeof ts.name === "string") token.name = ts.name;
        }
        const now = Math.floor(Date.now() / 1000);
        const last =
          typeof token.dbCheckedAt === "number" && Number.isFinite(token.dbCheckedAt) ? token.dbCheckedAt : 0;
        if (now - last >= JWT_DB_REFRESH_SEC) {
          const db = await prismaDevOr(
            "auth.jwt-refresh",
            () => prisma.user.findUnique({ where: { id: token.id as string } }),
            null,
          );
          token.dbCheckedAt = now;
          if (db) {
            token.role = db.role;
            token.name = db.name;
            token.picture = db.image;
          }
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string) ?? "";
        session.user.role = (token.role as Role) ?? "CUSTOMER";
        if (token.name) session.user.name = token.name as string;
        if (token.picture) session.user.image = token.picture as string;
      }
      return session;
    },
  },
});
