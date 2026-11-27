import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "you@example.com" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Missing email or password");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase().trim() },
          include: { vendorProfile: true },
        });

        if (!user || !user.password) {
          throw new Error("No user found with this email");
        }

        if (user.status !== "ACTIVE") {
          throw new Error(
            user.banReason ? `Account ${user.status.toLowerCase()}: ${user.banReason}` : `Account is ${user.status.toLowerCase()}`
          );
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) {
          throw new Error("Invalid password");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          xp: user.xp,
          vendorId: user.vendorProfile?.id,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.xp = (user as any).xp;
        token.vendorId = (user as any).vendorId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        // Re-sync role, status, and vendorId dynamically on session check
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
          (session.user as any).vendorId = fresh.vendorProfile?.id;
          (session.user as any).vendorApprovalStatus = fresh.vendorProfile?.approvalStatus;
        }
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
  secret: process.env.NEXTAUTH_SECRET || "porta-design-secret-key-gamified-3d-2026-supersecure",
};
