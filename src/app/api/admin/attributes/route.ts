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

    const attributes = await prisma.masterAttribute.findMany({
      orderBy: [{ sortOrder: "asc" }, { category: "asc" }, { name: "asc" }],
    });

    return NextResponse.json({ attributes });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireRole(["ADMIN"]);
    if (auth.error) return auth.error;

    const body = await req.json();
    const items = Array.isArray(body.items) ? body.items : [body];

    const saved = [];
    for (const item of items) {
      const code = String(item.code || "")
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9_]/g, "_");
      if (!code || !item.name) {
        return NextResponse.json({ error: "Attribute code and name required" }, { status: 400 });
      }

      const payload = {
        category: String(item.category || "WALL_FINISH").toUpperCase(),
        name: String(item.name).trim(),
        friendlyName: item.friendlyName ? String(item.friendlyName).trim() : String(item.name).trim(),
        brand: item.brand || null,
        specsJson: toJsonString(item.specs || item.specsJson, "{}"),
        shaderJson: toJsonString(
          item.shader || item.shaderJson,
          JSON.stringify({ color: "#475569", roughness: 0.45, metalness: 0.2 })
        ),
        costModifier: Number(item.costModifier) || 0,
        iconUrl: item.iconUrl || null,
        textureUrl: item.textureUrl || null,
        isActive: item.isActive !== undefined ? Boolean(item.isActive) : true,
        sortOrder: Number(item.sortOrder) || 100,
      };

      const attr = await prisma.masterAttribute.upsert({
        where: { code },
        update: payload,
        create: { code, ...payload },
      });
      saved.push(attr);
    }

    await logAdminAction(
      auth.actor.id,
      saved.length > 1 ? "ATTR_BULK_SAVE" : "ATTR_UPSERT",
      "MasterAttribute",
      saved[0]?.id,
      { codes: saved.map((s) => s.code) }
    );

    return NextResponse.json({ success: true, count: saved.length, attributes: saved });
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
    if (!id) return NextResponse.json({ error: "Attribute id required" }, { status: 400 });

    const data: Record<string, any> = {};
    if (updates.category !== undefined) data.category = String(updates.category).toUpperCase();
    if (updates.code !== undefined) data.code = String(updates.code).trim().toUpperCase();
    if (updates.name !== undefined) data.name = String(updates.name).trim();
    if (updates.friendlyName !== undefined) data.friendlyName = updates.friendlyName;
    if (updates.brand !== undefined) data.brand = updates.brand || null;
    if (updates.specs !== undefined || updates.specsJson !== undefined) {
      data.specsJson = toJsonString(updates.specs ?? updates.specsJson, "{}");
    }
    if (updates.shader !== undefined || updates.shaderJson !== undefined) {
      data.shaderJson = toJsonString(updates.shader ?? updates.shaderJson, "{}");
    }
    if (updates.costModifier !== undefined) data.costModifier = Number(updates.costModifier) || 0;
    if (updates.iconUrl !== undefined) data.iconUrl = updates.iconUrl || null;
    if (updates.textureUrl !== undefined) data.textureUrl = updates.textureUrl || null;
    if (updates.isActive !== undefined) data.isActive = Boolean(updates.isActive);
    if (updates.sortOrder !== undefined) data.sortOrder = Number(updates.sortOrder) || 0;

    const updated = await prisma.masterAttribute.update({ where: { id: String(id) }, data });
    await logAdminAction(auth.actor.id, "ATTR_UPDATE", "MasterAttribute", updated.id, { code: updated.code });

    return NextResponse.json({ success: true, attribute: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await requireRole(["ADMIN"]);
    if (auth.error) return auth.error;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Attribute id required" }, { status: 400 });

    const existing = await prisma.masterAttribute.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Attribute not found" }, { status: 404 });

    await prisma.masterAttribute.delete({ where: { id } });
    await logAdminAction(auth.actor.id, "ATTR_DELETE", "MasterAttribute", id, { code: existing.code });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
