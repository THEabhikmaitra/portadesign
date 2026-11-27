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

    const presets = await prisma.roomPreset.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    });
    return NextResponse.json({ presets });
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
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/^-|-$/g, "");

    if (!code || !body.title) {
      return NextResponse.json({ error: "Preset code and title required" }, { status: 400 });
    }

    const payload = {
      title: String(body.title).trim(),
      subtitle: String(body.subtitle || "Custom modular room configuration").trim(),
      sizeLabel: String(body.sizeLabel || "160 sq.ft (20x8 ft)").trim(),
      approxPriceLabel: String(body.approxPriceLabel || "~₹3.5L").trim(),
      badge: body.badge || null,
      iconName: body.iconName || "Home",
      thumbUrl: body.thumbUrl || null,
      environment: String(body.environment || "forest"),
      targetBudget: Number(body.targetBudget) || 380000,
      sceneJson: toJsonString(
        body.scene || body.sceneJson,
        JSON.stringify({ cabins: [], equipment: [] })
      ),
      isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
      sortOrder: Number(body.sortOrder) || 10,
    };

    const preset = await prisma.roomPreset.upsert({
      where: { code },
      update: payload,
      create: { code, ...payload },
    });

    await logAdminAction(auth.actor.id, "PRESET_UPSERT", "RoomPreset", preset.id, { code });
    return NextResponse.json({ success: true, preset });
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
    if (!id) return NextResponse.json({ error: "Preset id required" }, { status: 400 });

    const data: Record<string, any> = {};
    if (updates.title !== undefined) data.title = String(updates.title);
    if (updates.subtitle !== undefined) data.subtitle = String(updates.subtitle);
    if (updates.sizeLabel !== undefined) data.sizeLabel = String(updates.sizeLabel);
    if (updates.approxPriceLabel !== undefined) data.approxPriceLabel = String(updates.approxPriceLabel);
    if (updates.badge !== undefined) data.badge = updates.badge || null;
    if (updates.iconName !== undefined) data.iconName = updates.iconName || null;
    if (updates.thumbUrl !== undefined) data.thumbUrl = updates.thumbUrl || null;
    if (updates.environment !== undefined) data.environment = String(updates.environment);
    if (updates.targetBudget !== undefined) data.targetBudget = Number(updates.targetBudget) || 0;
    if (updates.scene !== undefined || updates.sceneJson !== undefined) {
      data.sceneJson = toJsonString(updates.scene ?? updates.sceneJson, JSON.stringify({ cabins: [], equipment: [] }));
    }
    if (updates.isActive !== undefined) data.isActive = Boolean(updates.isActive);
    if (updates.sortOrder !== undefined) data.sortOrder = Number(updates.sortOrder) || 0;

    const updated = await prisma.roomPreset.update({ where: { id: String(id) }, data });
    await logAdminAction(auth.actor.id, "PRESET_UPDATE", "RoomPreset", updated.id, { code: updated.code });
    return NextResponse.json({ success: true, preset: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await requireRole(["ADMIN"]);
    if (auth.error) return auth.error;

    const id = new URL(req.url).searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Preset id required" }, { status: 400 });

    await prisma.roomPreset.delete({ where: { id } });
    await logAdminAction(auth.actor.id, "PRESET_DELETE", "RoomPreset", id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
