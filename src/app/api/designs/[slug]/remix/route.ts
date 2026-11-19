import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;

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

    const session = await getServerSession(authOptions);
    let userId = (session?.user as any)?.id;
    if (!userId) {
      const defaultBuyer = await prisma.user.findFirst({
        where: { role: "BUYER" },
      });
      userId = defaultBuyer?.id;
    }

    if (!userId) {
      return NextResponse.json({ error: "User required to remix design" }, { status: 401 });
    }

    // Increment original design remix count
    await prisma.design.update({
      where: { id: parent.id },
      data: { remixCount: { increment: 1 } },
    });

    // Create new forked design
    const latestVersion = parent.versions[0];
    const newSlug = `remix-${parent.slug.substring(0, 20)}-${Math.random().toString(36).substring(2, 7)}`;

    const remixedDesign = await prisma.design.create({
      data: {
        userId,
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
      include: {
        versions: true,
      },
    });

    // Award XP for remixing
    await prisma.user.update({
      where: { id: userId },
      data: { xp: { increment: 100 } },
    });

    return NextResponse.json({
      success: true,
      remixedDesign,
      slug: newSlug,
    });
  } catch (error: any) {
    console.error("POST /api/designs/[slug]/remix error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
