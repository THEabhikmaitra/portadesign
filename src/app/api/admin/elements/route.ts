import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, logAdminAction } from "@/lib/authGuard";

export const dynamic = "force-dynamic";

function toJsonString(val: unknown, fallback: string): string {
  if (val === undefined || val === null || val === "") return fallback;
  if (typeof val === "string") {
    JSON.parse(val); // validates JSON syntax
    return val;
  }
  return JSON.stringify(val);
}

export async function GET() {
  try {
    const auth = await requireRole(["ADMIN"]);
    if (auth.error) return auth.error;

    const elements = await prisma.masterElement.findMany({
      orderBy: [{ sortOrder: "asc" }, { category: "asc" }, { name: "asc" }],
    });

    return NextResponse.json({ elements });
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
        return NextResponse.json({ error: "Each element needs code and name" }, { status: 400 });
      }

      const payload = {
        category: String(item.category || "EQUIPMENT").toUpperCase(),
        subCategory: item.subCategory ? String(item.subCategory).toUpperCase() : "INTERIOR",
        name: String(item.name).trim(),
        friendlyName: item.friendlyName ? String(item.friendlyName).trim() : String(item.name).trim(),
        description: item.description || null,
        mountZone: String(item.mountZone || "FLOOR_INTERIOR").toUpperCase(),
        dimensionsJson: toJsonString(
          item.dimensions || item.dimensionsJson,
          JSON.stringify({ width: 1.0, height: 1.0, depth: 1.0 })
        ),
        baseCost: Math.max(0, Number(item.baseCost) || 0),
        optionsJson: toJsonString(item.options || item.optionsJson, "{}"),
        threeConfigJson: toJsonString(
          item.threeConfig || item.threeConfigJson,
          JSON.stringify({ primitives: [] })
        ),
        iconUrl: item.iconUrl || null,
        imageUrl: item.imageUrl || null,
        isActive: item.isActive !== undefined ? Boolean(item.isActive) : true,
        sortOrder: Number(item.sortOrder) || 100,
      };

      const el = await prisma.masterElement.upsert({
        where: { code },
        update: payload,
        create: { code, ...payload },
      });
      saved.push(el);
    }

    await logAdminAction(
      auth.actor.id,
      saved.length > 1 ? "ELEMENT_BULK_SAVE" : "ELEMENT_UPSERT",
      "MasterElement",
      saved[0]?.id,
      { codes: saved.map((s) => s.code) }
    );

    return NextResponse.json({ success: true, count: saved.length, elements: saved });
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
    if (!id) return NextResponse.json({ error: "Element id required" }, { status: 400 });

    const data: Record<string, any> = {};
    if (updates.category !== undefined) data.category = String(updates.category).toUpperCase();
    if (updates.subCategory !== undefined) data.subCategory = updates.subCategory;
    if (updates.code !== undefined) data.code = String(updates.code).trim().toUpperCase();
    if (updates.name !== undefined) data.name = String(updates.name).trim();
    if (updates.friendlyName !== undefined) data.friendlyName = updates.friendlyName;
    if (updates.description !== undefined) data.description = updates.description;
    if (updates.mountZone !== undefined) data.mountZone = String(updates.mountZone).toUpperCase();
    if (updates.dimensions !== undefined || updates.dimensionsJson !== undefined) {
      data.dimensionsJson = toJsonString(updates.dimensions ?? updates.dimensionsJson, "{}");
    }
    if (updates.baseCost !== undefined) data.baseCost = Math.max(0, Number(updates.baseCost) || 0);
    if (updates.options !== undefined || updates.optionsJson !== undefined) {
      data.optionsJson = toJsonString(updates.options ?? updates.optionsJson, "{}");
    }
    if (updates.threeConfig !== undefined || updates.threeConfigJson !== undefined) {
      data.threeConfigJson = toJsonString(updates.threeConfig ?? updates.threeConfigJson, "{}");
    }
    if (updates.iconUrl !== undefined) data.iconUrl = updates.iconUrl || null;
    if (updates.imageUrl !== undefined) data.imageUrl = updates.imageUrl || null;
    if (updates.isActive !== undefined) data.isActive = Boolean(updates.isActive);
    if (updates.sortOrder !== undefined) data.sortOrder = Number(updates.sortOrder) || 0;

    const updated = await prisma.masterElement.update({ where: { id: String(id) }, data });
    await logAdminAction(auth.actor.id, "ELEMENT_UPDATE", "MasterElement", updated.id, { code: updated.code });

    return NextResponse.json({ success: true, element: updated });
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
    if (!id) return NextResponse.json({ error: "Element id required" }, { status: 400 });

    const existing = await prisma.masterElement.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Element not found" }, { status: 404 });

    await prisma.masterElement.delete({ where: { id } });
    await logAdminAction(auth.actor.id, "ELEMENT_DELETE", "MasterElement", id, { code: existing.code });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
