import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/authGuard";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const isPublicOnly = searchParams.get("public") === "true";
    const session = await getServerSession(authOptions);

    const where: any = {};
    if (isPublicOnly) {
      where.isPublic = true;
    } else if ((session?.user as any)?.id) {
      where.userId = (session?.user as any).id;
    } else {
      where.isPublic = true;
    }

    const designs = await prisma.design.findMany({
      where,
      include: {
        versions: {
          orderBy: { versionNumber: "desc" },
          take: 1,
        },
        user: {
          select: { id: true, name: true, role: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ designs });
  } catch (error: any) {
    console.error("GET /api/designs error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireRole(["BUYER", "VENDOR", "ADMIN"]);
    if (auth.error) return auth.error;

    const userId = auth.actor.id;
    const body = await req.json();
    const {
      title,
      description,
      isPublic = true,
      commitNote = "Initial layout",
      sceneJson,
      bomJson,
      snapshotBase64,
    } = body;

    if (!title || !sceneJson) {
      return NextResponse.json({ error: "Title and scene configuration required" }, { status: 400 });
    }

    const cleanTitle = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
    const slug = `${cleanTitle || "room"}-${Math.random().toString(36).substring(2, 7)}`;

    let previewImagePath: string | null = null;
    if (snapshotBase64 && snapshotBase64.startsWith("data:image")) {
      try {
        const uploadsDir = path.join(process.cwd(), "public", "uploads", "previews");
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }
        const fileName = `${slug}.png`;
        const filePath = path.join(uploadsDir, fileName);
        const base64Data = snapshotBase64.replace(/^data:image\/\w+;base64,/, "");
        fs.writeFileSync(filePath, Buffer.from(base64Data, "base64"));
        previewImagePath = `/uploads/previews/${fileName}`;
      } catch (err) {
        console.error("Snapshot save warning:", err);
      }
    }

    const design = await prisma.design.create({
      data: {
        userId,
        title,
        slug,
        description,
        isPublic,
        previewImage: previewImagePath,
        versions: {
          create: [
            {
              versionNumber: 1,
              commitNote,
              sceneJson,
              bomJson: bomJson || "{}",
              snapshotUrl: previewImagePath,
            },
          ],
        },
      },
      include: {
        versions: true,
      },
    });

    await prisma.user.update({
      where: { id: userId },
      data: { xp: { increment: 150 } },
    });

    return NextResponse.json({ design, success: true });
  } catch (error: any) {
    console.error("POST /api/designs error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
