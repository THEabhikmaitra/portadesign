import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/authGuard";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const design = await prisma.design.findUnique({
      where: { slug: params.slug },
      include: {
        versions: {
          orderBy: { versionNumber: "desc" },
          take: 1,
        },
        user: {
          select: { id: true, name: true, role: true },
        },
      },
    });

    if (!design) {
      return NextResponse.json({ error: "Design not found" }, { status: 404 });
    }

    return NextResponse.json({ design });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const body = await req.json();
    const action = String(body.action || "");

    if (action === "increment_view" || action === "increment_share") {
      const updated = await prisma.design.update({
        where: { slug: params.slug },
        data:
          action === "increment_view"
            ? { viewCount: { increment: 1 } }
            : { shareCount: { increment: 1 } },
        select: { id: true, slug: true, viewCount: true, shareCount: true, remixCount: true },
      });
      return NextResponse.json({ success: true, design: updated });
    }

    const auth = await requireRole(["BUYER", "VENDOR", "ADMIN"]);
    if (auth.error) return auth.error;

    const existing = await prisma.design.findUnique({ where: { slug: params.slug } });
    if (!existing) {
      return NextResponse.json({ error: "Design not found" }, { status: 404 });
    }
    if (existing.userId !== auth.actor.id && auth.actor.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updated = await prisma.design.update({
      where: { slug: params.slug },
      data: {
        ...(typeof body.isPublic === "boolean" ? { isPublic: body.isPublic } : {}),
        ...(typeof body.title === "string" && body.title.trim() ? { title: body.title.trim().slice(0, 120) } : {}),
        ...(typeof body.description === "string" ? { description: body.description.trim().slice(0, 500) } : {}),
      },
    });

    return NextResponse.json({ success: true, design: updated });
  } catch (error: any) {
    console.error("PATCH /api/designs/[slug] error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const auth = await requireRole(["BUYER", "VENDOR", "ADMIN"]);
    if (auth.error) return auth.error;

    const existing = await prisma.design.findUnique({ where: { slug: params.slug } });
    if (!existing) {
      return NextResponse.json({ error: "Design not found" }, { status: 404 });
    }
    if (existing.userId !== auth.actor.id && auth.actor.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.design.delete({ where: { slug: params.slug } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
