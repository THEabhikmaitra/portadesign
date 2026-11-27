import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/authGuard";
import { defaultsToVendorLogistics } from "@/lib/logisticsEngine";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireRole(["VENDOR", "ADMIN"]);
    if (auth.error) return auth.error;

    const { searchParams } = new URL(req.url);
    const requestedVendorId = searchParams.get("vendorId");

    let vendorId =
      auth.actor.role === "ADMIN" && requestedVendorId
        ? requestedVendorId
        : auth.actor.vendorId;

    if (!vendorId && auth.actor.role === "ADMIN") {
      const firstVendor = await prisma.vendorProfile.findFirst({
        orderBy: [{ isSponsored: "desc" }, { sponsoredBidAmt: "desc" }],
      });
      vendorId = firstVendor?.id;
    }

    if (!vendorId) {
      const [allElements, allAttrs] = await Promise.all([
        prisma.masterElement.findMany({ where: { isActive: true }, orderBy: [{ sortOrder: "asc" }, { category: "asc" }] }),
        prisma.masterAttribute.findMany({ where: { isActive: true }, orderBy: [{ sortOrder: "asc" }, { category: "asc" }] }),
      ]);
      return NextResponse.json({
        profile: null,
        logisticsSettings: defaultsToVendorLogistics(null),
        allVendors: [],
        masterElements: allElements,
        masterAttributes: allAttrs,
      });
    }

    const [profile, allVendors, masterElements, masterAttributes, platformDefaults] = await Promise.all([
      prisma.vendorProfile.findUnique({
        where: { id: vendorId },
        include: { rateCards: true },
      }),
      auth.actor.role === "ADMIN"
        ? prisma.vendorProfile.findMany({
            select: {
              id: true,
              companyName: true,
              city: true,
              approvalStatus: true,
              isSponsored: true,
              sponsoredBidAmt: true,
              adStatus: true,
              leadDays: true,
              warrantyYears: true,
              rating: true,
            },
            orderBy: [{ isSponsored: "desc" }, { sponsoredBidAmt: "desc" }],
          })
        : prisma.vendorProfile.findMany({
            where: { approvalStatus: "APPROVED" },
            select: {
              id: true,
              companyName: true,
              city: true,
              approvalStatus: true,
              isSponsored: true,
              sponsoredBidAmt: true,
              adStatus: true,
              leadDays: true,
              warrantyYears: true,
              rating: true,
            },
            orderBy: [{ isSponsored: "desc" }, { sponsoredBidAmt: "desc" }],
          }),
      prisma.masterElement.findMany({
        where: { isActive: true },
        orderBy: [{ sortOrder: "asc" }, { category: "asc" }],
      }),
      prisma.masterAttribute.findMany({
        where: { isActive: true },
        orderBy: [{ sortOrder: "asc" }, { category: "asc" }],
      }),
      prisma.logisticsDefaults.findUnique({ where: { id: "singleton" } }),
    ]);

    let logisticsSettings = defaultsToVendorLogistics(platformDefaults);
    const logCard = profile?.rateCards.find((rc) => rc.elementCode === "__VENDOR_LOGISTICS__");
    if (logCard?.attributeModifiersJson) {
      try {
        logisticsSettings = { ...logisticsSettings, ...JSON.parse(logCard.attributeModifiersJson) };
      } catch {}
    }

    return NextResponse.json({
      profile,
      logisticsSettings,
      allVendors,
      masterElements,
      masterAttributes,
    });
  } catch (error: any) {
    console.error("GET /api/vendor/rate-cards error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireRole(["VENDOR", "ADMIN"]);
    if (auth.error) return auth.error;

    const body = await req.json();
    const { vendorId: bodyVendorId, profileUpdates, rateCardUpdates, logisticsSettings } = body;

    const vendorId =
      auth.actor.role === "ADMIN" && bodyVendorId ? bodyVendorId : auth.actor.vendorId;

    if (!vendorId) {
      return NextResponse.json({ error: "Vendor profile not found" }, { status: 404 });
    }

    const platformDefaults = await prisma.logisticsDefaults.findUnique({ where: { id: "singleton" } });
    const minBid = platformDefaults?.minBidAmount ?? 10;
    const maxBid = platformDefaults?.maxBidAmount ?? 500;

    if (profileUpdates) {
      const bidRaw =
        profileUpdates.sponsoredBidAmt !== undefined ? Number(profileUpdates.sponsoredBidAmt) : undefined;
      const clampedBid = bidRaw !== undefined ? Math.min(maxBid, Math.max(0, bidRaw)) : undefined;

      await prisma.vendorProfile.update({
        where: { id: vendorId },
        data: {
          leadDays: profileUpdates.leadDays !== undefined ? Number(profileUpdates.leadDays) : undefined,
          warrantyYears:
            profileUpdates.warrantyYears !== undefined ? Number(profileUpdates.warrantyYears) : undefined,
          isSponsored:
            profileUpdates.isSponsored !== undefined ? Boolean(profileUpdates.isSponsored) : undefined,
          adStatus:
            profileUpdates.isSponsored !== undefined
              ? profileUpdates.isSponsored
                ? "ACTIVE"
                : "PAUSED"
              : undefined,
          sponsoredBidAmt:
            clampedBid !== undefined && clampedBid > 0 ? Math.max(minBid, clampedBid) : clampedBid,
          companyName: profileUpdates.companyName || undefined,
          city: profileUpdates.city || undefined,
          phone: profileUpdates.phone !== undefined ? profileUpdates.phone : undefined,
          contactEmail: profileUpdates.contactEmail || undefined,
        },
      });
    }

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
            attributeModifiersJson:
              typeof card.attributeModifiersJson === "string"
                ? card.attributeModifiersJson
                : JSON.stringify(card.attributeModifiersJson || {}),
            leadTimeDays: card.leadTimeDays ? Number(card.leadTimeDays) : undefined,
            warrantyNotes: card.warrantyNotes,
          },
          create: {
            vendorId,
            elementCode: card.elementCode,
            baseUnitPrice: Number(card.baseUnitPrice),
            attributeModifiersJson:
              typeof card.attributeModifiersJson === "string"
                ? card.attributeModifiersJson
                : JSON.stringify(card.attributeModifiersJson || {}),
            leadTimeDays: card.leadTimeDays ? Number(card.leadTimeDays) : 14,
            warrantyNotes: card.warrantyNotes || "Standard warranty",
          },
        });
      }
    }

    if (logisticsSettings) {
      await prisma.vendorRateCard.upsert({
        where: {
          vendorId_elementCode: {
            vendorId,
            elementCode: "__VENDOR_LOGISTICS__",
          },
        },
        update: {
          baseUnitPrice: Number(logisticsSettings.transportPerKm20ft || 85),
          attributeModifiersJson: JSON.stringify(logisticsSettings),
        },
        create: {
          vendorId,
          elementCode: "__VENDOR_LOGISTICS__",
          baseUnitPrice: Number(logisticsSettings.transportPerKm20ft || 85),
          attributeModifiersJson: JSON.stringify(logisticsSettings),
          leadTimeDays: 10,
          warrantyNotes: "Logistics & 2nd-hand config",
        },
      });
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
