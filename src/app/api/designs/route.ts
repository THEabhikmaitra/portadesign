import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const isPublicOnly = searchParams.get("public") === "true";

    const session = await getServerSession(authOptions);

    const where: any = {};
    if (isPublicOnly) {
      where.isPublic = true;
    } else if (session?.user) {
      where.userId = (session.user as any).id;
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
    const session = await getServerSession(authOptions);
    // If not logged in, fallback to default demo Buyer user
    let userId = (session?.user as any)?.id;
    if (!userId) {
      const defaultBuyer = await prisma.user.findFirst({
        where: { role: "BUYER" },
      });
      userId = defaultBuyer?.id;
    }

    if (!userId) {
      return NextResponse.json({ error: "User required to save design" }, { status: 401 });
    }

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

    // Generate unique SEO slug
    const cleanTitle = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
    const slug = `${cleanTitle}-${Math.random().toString(36).substring(2, 7)}`;

    // Save snapshot image to /public/uploads/previews/
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

    // Award XP to user for creating a design
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
