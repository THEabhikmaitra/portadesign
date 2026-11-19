import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    let vendorId = (session?.user as any)?.vendorId;
    if (!vendorId) {
      // Demo fallback: default to first vendor (QuickCabin)
      const firstVendor = await prisma.vendorProfile.findFirst({
        include: { user: true },
      });
      vendorId = firstVendor?.id;
    }

    const profile = await prisma.vendorProfile.findUnique({
      where: { id: vendorId },
      include: {
        rateCards: true,
      },
    });

    const masterElements = await prisma.masterElement.findMany({
      orderBy: { category: "asc" },
    });

    const masterAttributes = await prisma.masterAttribute.findMany({
      orderBy: { category: "asc" },
    });

    return NextResponse.json({ profile, masterElements, masterAttributes });
  } catch (error: any) {
    console.error("GET /api/vendor/rate-cards error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    let vendorId = (session?.user as any)?.vendorId;
    if (!vendorId) {
      const firstVendor = await prisma.vendorProfile.findFirst();
      vendorId = firstVendor?.id;
    }

    if (!vendorId) {
      return NextResponse.json({ error: "Vendor profile not found" }, { status: 404 });
    }

    const body = await req.json();
    const { profileUpdates, rateCardUpdates } = body;

    // Update profile settings (Lead time, warranty, sponsored ad bid)
    if (profileUpdates) {
      await prisma.vendorProfile.update({
        where: { id: vendorId },
        data: {
          leadDays: profileUpdates.leadDays !== undefined ? Number(profileUpdates.leadDays) : undefined,
          warrantyYears: profileUpdates.warrantyYears !== undefined ? Number(profileUpdates.warrantyYears) : undefined,
          isSponsored: profileUpdates.isSponsored !== undefined ? Boolean(profileUpdates.isSponsored) : undefined,
          sponsoredBidAmt: profileUpdates.sponsoredBidAmt !== undefined ? Number(profileUpdates.sponsoredBidAmt) : undefined,
          companyName: profileUpdates.companyName || undefined,
        },
      });
    }

    // Update individual rate cards
    if (rateCardUpdates && Array.isArray(rateCardUpdates)) {
      for (const card of rateCardUpdates) {
        await prisma.vendorRateCard.upsert({
          where: {
            vendorId_elementCode: {
              vendorId,
              elementCode: card.elementCode,
            },
          },
          update: {
            baseUnitPrice: Number(card.baseUnitPrice),
            attributeModifiersJson: typeof card.attributeModifiersJson === "string"
              ? card.attributeModifiersJson
              : JSON.stringify(card.attributeModifiersJson || {}),
            leadTimeDays: card.leadTimeDays ? Number(card.leadTimeDays) : undefined,
            warrantyNotes: card.warrantyNotes,
          },
          create: {
            vendorId,
            elementCode: card.elementCode,
            baseUnitPrice: Number(card.baseUnitPrice),
            attributeModifiersJson: typeof card.attributeModifiersJson === "string"
              ? card.attributeModifiersJson
              : JSON.stringify(card.attributeModifiersJson || {}),
            leadTimeDays: card.leadTimeDays ? Number(card.leadTimeDays) : 14,
            warrantyNotes: card.warrantyNotes || "Standard warranty",
          },
        });
      }
    }

    const updatedProfile = await prisma.vendorProfile.findUnique({
      where: { id: vendorId },
      include: { rateCards: true },
    });

    return NextResponse.json({ success: true, profile: updatedProfile });
  } catch (error: any) {
    console.error("POST /api/vendor/rate-cards error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
