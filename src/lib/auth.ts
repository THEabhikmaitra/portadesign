import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";

const googleClientId = process.env.GOOGLE_CLIENT_ID?.trim() || "";
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim() || "";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  providers: [
    GoogleProvider({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== "google") return false;

      const email = user.email?.toLowerCase().trim();
      if (!email) return false;

      let dbUser = await prisma.user.findUnique({
        where: { email },
        include: { vendorProfile: true },
      });

      if (!dbUser) {
        const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
        dbUser = await prisma.user.create({
          data: {
            email,
            name: user.name?.trim() || email.split("@")[0],
            password: "",
            role: adminCount === 0 ? "ADMIN" : "BUYER",
            status: "ACTIVE",
          },
          include: { vendorProfile: true },
        });
      } else if (dbUser.status !== "ACTIVE") {
        return false;
      }

      user.id = dbUser.id;
      (user as any).role = dbUser.role;
      (user as any).xp = dbUser.xp;
      (user as any).vendorId = dbUser.vendorProfile?.id;
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.xp = (user as any).xp;
        token.vendorId = (user as any).vendorId;
        if (user.image) token.picture = user.image;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        const fresh = await prisma.user.findUnique({
          where: { id: String(token.id) },
          select: {
            id: true,
            role: true,
            status: true,
            xp: true,
            name: true,
            email: true,
            vendorProfile: { select: { id: true, approvalStatus: true } },
          },
        });
        if (fresh) {
          (session.user as any).id = fresh.id;
          (session.user as any).role = fresh.role;
          (session.user as any).status = fresh.status;
          (session.user as any).xp = fresh.xp;
          (session.user as any).name = fresh.name;
          (session.user as any).email = fresh.email;
          (session.user as any).image =
            (typeof token.picture === "string" && token.picture) ||
            session.user.image ||
            null;
          (session.user as any).vendorId = fresh.vendorProfile?.id;
          (session.user as any).vendorApprovalStatus = fresh.vendorProfile?.approvalStatus;
        }
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/signin",
  },
  secret: process.env.NEXTAUTH_SECRET || "porta-design-secret-key-gamified-3d-2026-supersecure",
};
