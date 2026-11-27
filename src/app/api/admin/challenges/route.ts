import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, logAdminAction } from "@/lib/authGuard";

export const dynamic = "force-dynamic";

function toJsonString(val: unknown, fallback: string): string {
  if (val === undefined || val === null || val === "") return fallback;
  if (typeof val === "string") {
    JSON.parse(val);
    return val;
  }
  return JSON.stringify(val);
}

export async function GET() {
  try {
    const auth = await requireRole(["ADMIN"]);
    if (auth.error) return auth.error;

    const challenges = await prisma.designChallenge.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    });
    return NextResponse.json({ challenges });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireRole(["ADMIN"]);
    if (auth.error) return auth.error;

    const body = await req.json();
    const code = String(body.code || body.title || "")
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9_]+/g, "_");

    if (!code || !body.title) {
      return NextResponse.json({ error: "Challenge code and title required" }, { status: 400 });
    }

    const payload = {
      title: String(body.title).trim(),
      description: String(body.description || "").trim(),
      badgeName: String(body.badgeName || body.title).trim(),
      badgeIcon: String(body.badgeIcon || "🏆"),
      badgeIconUrl: body.badgeIconUrl || null,
      rewardXp: Math.max(0, Number(body.rewardXp) || 250),
      rulesJson: toJsonString(body.rules || body.rulesJson, "[]"),
      isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
      sortOrder: Number(body.sortOrder) || 10,
    };

    const challenge = await prisma.designChallenge.upsert({
      where: { code },
      update: payload,
      create: { code, ...payload },
    });

    await logAdminAction(auth.actor.id, "CHALLENGE_UPSERT", "DesignChallenge", challenge.id, { code });
    return NextResponse.json({ success: true, challenge });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = await requireRole(["ADMIN"]);
    if (auth.error) return auth.error;

    const body = await req.json();
    const { id, ...updates } = body;
    if (!id) return NextResponse.json({ error: "Challenge id required" }, { status: 400 });

    const data: Record<string, any> = {};
    if (updates.title !== undefined) data.title = String(updates.title);
    if (updates.description !== undefined) data.description = String(updates.description);
    if (updates.badgeName !== undefined) data.badgeName = String(updates.badgeName);
    if (updates.badgeIcon !== undefined) data.badgeIcon = String(updates.badgeIcon);
    if (updates.badgeIconUrl !== undefined) data.badgeIconUrl = updates.badgeIconUrl || null;
    if (updates.rewardXp !== undefined) data.rewardXp = Math.max(0, Number(updates.rewardXp) || 0);
    if (updates.rules !== undefined || updates.rulesJson !== undefined) {
      data.rulesJson = toJsonString(updates.rules ?? updates.rulesJson, "[]");
    }
    if (updates.isActive !== undefined) data.isActive = Boolean(updates.isActive);
    if (updates.sortOrder !== undefined) data.sortOrder = Number(updates.sortOrder) || 0;

    const updated = await prisma.designChallenge.update({ where: { id: String(id) }, data });
    await logAdminAction(auth.actor.id, "CHALLENGE_UPDATE", "DesignChallenge", updated.id, { code: updated.code });
    return NextResponse.json({ success: true, challenge: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await requireRole(["ADMIN"]);
    if (auth.error) return auth.error;

    const id = new URL(req.url).searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Challenge id required" }, { status: 400 });

    await prisma.designChallenge.delete({ where: { id } });
    await logAdminAction(auth.actor.id, "CHALLENGE_DELETE", "DesignChallenge", id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
