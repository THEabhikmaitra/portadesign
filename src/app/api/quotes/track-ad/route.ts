import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { vendorId } = body;
    if (!vendorId) {
      return NextResponse.json({ error: "vendorId required" }, { status: 400 });
    }

    const vendor = await prisma.vendorProfile.findUnique({ where: { id: String(vendorId) } });
    if (!vendor || !vendor.isSponsored || vendor.adStatus !== "ACTIVE") {
      return NextResponse.json({ tracked: false });
    }

    const nextSpend = vendor.adSpentMonth + Math.max(0, vendor.sponsoredBidAmt || 0);
    const hitCap = vendor.adDailyCap > 0 && nextSpend >= vendor.adDailyCap * 30;

    await prisma.vendorProfile.update({
      where: { id: vendor.id },
      data: {
        adClicks: { increment: 1 },
        adSpentMonth: nextSpend,
        adStatus: hitCap ? "CAPPED" : "ACTIVE",
      },
    });

    return NextResponse.json({ tracked: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
