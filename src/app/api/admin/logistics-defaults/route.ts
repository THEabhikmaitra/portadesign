import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, logAdminAction } from "@/lib/authGuard";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const auth = await requireRole(["ADMIN"]);
    if (auth.error) return auth.error;

    const defaults = await prisma.logisticsDefaults.upsert({
      where: { id: "singleton" },
      update: {},
      create: { id: "singleton" },
    });

    return NextResponse.json({ defaults });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = await requireRole(["ADMIN"]);
    if (auth.error) return auth.error;

    const body = await req.json();
    const numericFields = [
      "gstRatePct",
      "transportPerKm20ft",
      "transportPerKm40ft",
      "craneGroundFee",
      "craneTerraceFee",
      "knockDownPerKm",
      "knockDownAssemblyFee",
      "foundationGroundFee",
      "foundationUpperFee",
      "puf50mmCost",
      "flyRoofCanopyPrice",
      "defaultRefurbDiscount",
      "defaultUsedWwtDiscount",
      "minBidAmount",
      "maxBidAmount",
    ];

    const data: Record<string, number> = {};
    for (const f of numericFields) {
      if (body[f] !== undefined && Number.isFinite(Number(body[f]))) {
        data[f] = Math.max(0, Number(body[f]));
      }
    }

    const updated = await prisma.logisticsDefaults.upsert({
      where: { id: "singleton" },
      update: data,
      create: { id: "singleton", ...data },
    });

    await logAdminAction(auth.actor.id, "LOGISTICS_DEFAULTS_UPDATE", "LogisticsDefaults", "singleton", data);
    return NextResponse.json({ success: true, defaults: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
