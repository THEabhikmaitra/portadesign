import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function safeParse<T>(json: string | null | undefined, fallback: T): T {
  if (!json) return fallback;
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

export async function GET() {
  try {
    const [elementsRaw, attrsRaw, presetsRaw, challengesRaw, logisticsDefaults] = await Promise.all([
      prisma.masterElement.findMany({
        where: { isActive: true },
        orderBy: [{ sortOrder: "asc" }, { category: "asc" }, { name: "asc" }],
      }),
      prisma.masterAttribute.findMany({
        where: { isActive: true },
        orderBy: [{ sortOrder: "asc" }, { category: "asc" }, { name: "asc" }],
      }),
      prisma.roomPreset.findMany({
        where: { isActive: true },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      }),
      prisma.designChallenge.findMany({
        where: { isActive: true },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      }),
      prisma.logisticsDefaults.findUnique({ where: { id: "singleton" } }),
    ]);

    const elements = elementsRaw.map((el) => ({
      id: el.id,
      category: el.category,
      subCategory: el.subCategory,
      code: el.code,
      name: el.name,
      friendlyName: el.friendlyName,
      description: el.description,
      mountZone: el.mountZone || "FLOOR_INTERIOR",
      dimensions: safeParse(el.dimensionsJson, { width: 1, height: 1, depth: 1 }),
      baseCost: el.baseCost,
      options: safeParse(el.optionsJson, {}),
      threeConfig: safeParse(el.threeConfigJson, null),
      iconUrl: el.iconUrl,
      imageUrl: el.imageUrl,
      isActive: el.isActive,
      sortOrder: el.sortOrder,
    }));

    const attributes = attrsRaw.map((attr) => ({
      id: attr.id,
      category: attr.category,
      code: attr.code,
      name: attr.name,
      friendlyName: attr.friendlyName,
      brand: attr.brand,
      specs: safeParse(attr.specsJson, {}),
      shader: safeParse(attr.shaderJson, { color: "#475569", roughness: 0.45, metalness: 0.2 }),
      costModifier: attr.costModifier,
      iconUrl: attr.iconUrl,
      textureUrl: attr.textureUrl,
      isActive: attr.isActive,
      sortOrder: attr.sortOrder,
    }));

    const presets = presetsRaw.map((p) => ({
      id: p.code,
      dbId: p.id,
      code: p.code,
      title: p.title,
      subtitle: p.subtitle,
      sizeLabel: p.sizeLabel,
      approxPriceLabel: p.approxPriceLabel,
      badge: p.badge,
      iconName: p.iconName,
      thumbUrl: p.thumbUrl,
      environment: p.environment,
      targetBudget: p.targetBudget,
      scene: safeParse(p.sceneJson, { cabins: [], equipment: [] }),
      isActive: p.isActive,
      sortOrder: p.sortOrder,
    }));

    const challenges = challengesRaw.map((c) => ({
      id: c.code,
      dbId: c.id,
      code: c.code,
      title: c.title,
      description: c.description,
      badgeName: c.badgeName,
      badgeIcon: c.badgeIcon,
      badgeIconUrl: c.badgeIconUrl,
      rewardXp: c.rewardXp,
      rules: safeParse(c.rulesJson, []),
      isActive: c.isActive,
      sortOrder: c.sortOrder,
    }));

    return NextResponse.json({
      elements,
      attributes,
      presets,
      challenges,
      logisticsDefaults,
    });
  } catch (error: any) {
    console.error("GET /api/catalog error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
