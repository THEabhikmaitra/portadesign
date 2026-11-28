import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/authGuard";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const auth = await requireRole(["BUYER", "VENDOR", "ADMIN"]);
    if (auth.error) return auth.error;

    const user = await prisma.user.findUnique({
      where: { id: auth.actor.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        xp: true,
        createdAt: true,
        designs: {
          include: {
            versions: {
              orderBy: { versionNumber: "desc" },
              take: 1,
            },
          },
          orderBy: { updatedAt: "desc" },
        },
        _count: {
          select: { quotesSent: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error: any) {
    console.error("GET /api/profile error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = await requireRole(["BUYER", "VENDOR", "ADMIN"]);
    if (auth.error) return auth.error;

    const body = await req.json();
    const name = typeof body.name === "string" ? body.name.trim().slice(0, 80) : undefined;
    const phone = typeof body.phone === "string" ? body.phone.trim().slice(0, 30) : undefined;

    const updated = await prisma.user.update({
      where: { id: auth.actor.id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(phone !== undefined ? { phone } : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        xp: true,
      },
    });

    return NextResponse.json({ success: true, user: updated });
  } catch (error: any) {
    console.error("PATCH /api/profile error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
