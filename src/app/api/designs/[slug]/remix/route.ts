import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/authGuard";

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;
    const auth = await requireRole(["BUYER", "VENDOR", "ADMIN"]);
    if (auth.error) return auth.error;

    const parent = await prisma.design.findUnique({
      where: { slug },
      include: {
        versions: {
          orderBy: { versionNumber: "desc" },
          take: 1,
        },
      },
    });

    if (!parent) {
      return NextResponse.json({ error: "Original design not found" }, { status: 404 });
    }

    await prisma.design.update({
      where: { id: parent.id },
      data: { remixCount: { increment: 1 } },
    });

    const latestVersion = parent.versions[0];
    const newSlug = `remix-${parent.slug.substring(0, 20)}-${Math.random().toString(36).substring(2, 7)}`;

    const remixedDesign = await prisma.design.create({
      data: {
        userId: auth.actor.id,
        title: `Remix: ${parent.title}`,
        slug: newSlug,
        description: `Forked from ${parent.title}. Customized container spec and layout.`,
        isPublic: true,
        parentDesignId: parent.id,
        previewImage: parent.previewImage,
        versions: {
          create: [
            {
              versionNumber: 1,
              commitNote: `Forked from ${parent.slug} v${latestVersion?.versionNumber || 1}`,
              sceneJson: latestVersion?.sceneJson || "{}",
              bomJson: latestVersion?.bomJson || "{}",
              snapshotUrl: latestVersion?.snapshotUrl,
            },
          ],
        },
      },
      include: { versions: true },
    });

    await prisma.user.update({
      where: { id: auth.actor.id },
      data: { xp: { increment: 100 } },
    });

    return NextResponse.json({ design: remixedDesign, success: true });
  } catch (error: any) {
    console.error("POST /api/designs/[slug]/remix error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
