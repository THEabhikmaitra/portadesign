import React from "react";
import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SiteHeader } from "@/components/ui/SiteHeader";
import { SiteFooter } from "@/components/ui/SiteFooter";
import { ProfileClient } from "@/components/profile/ProfileClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "My Profile & Saved Designs",
  description: "Manage your saved 3D prefab room designs, download PDF spec sheets, and update your profile.",
  robots: { index: false, follow: false },
};

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;

  let initialProfile: any = null;
  if (userId) {
    const row = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        xp: true,
        createdAt: true,
        designs: {
          orderBy: { updatedAt: "desc" },
          include: {
            versions: {
              orderBy: { versionNumber: "desc" },
              take: 1,
              select: {
                versionNumber: true,
                bomJson: true,
                sceneJson: true,
              },
            },
          },
        },
        _count: { select: { quotesSent: true } },
      },
    });
    if (row) {
      initialProfile = {
        ...row,
        createdAt: row.createdAt.toISOString(),
        designs: row.designs.map((d) => ({
          ...d,
          updatedAt: d.updatedAt.toISOString(),
        })),
      };
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col">
      <SiteHeader />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <ProfileClient initialProfile={initialProfile} />
      </main>
      <SiteFooter />
    </div>
  );
}
