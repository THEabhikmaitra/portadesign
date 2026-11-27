import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/authGuard";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireRole(["BUYER", "VENDOR", "ADMIN"]);
    if (auth.error) return auth.error;

    const { searchParams } = new URL(req.url);
    const paramVendorId = searchParams.get("vendorId");

    const where: Record<string, any> = {};
    if (auth.actor.role === "ADMIN") {
      if (paramVendorId) where.vendorId = paramVendorId;
    } else if (auth.actor.role === "VENDOR") {
      if (!auth.actor.vendorId) {
        return NextResponse.json({ quotes: [] });
      }
      where.vendorId = auth.actor.vendorId;
    } else {
      where.buyerId = auth.actor.id;
    }

    const quotes = await prisma.quoteRequest.findMany({
      where,
      include: {
        design: {
          select: {
            id: true,
            title: true,
            slug: true,
            previewImage: true,
            versions: {
              orderBy: { versionNumber: "desc" },
              take: 1,
              select: { bomJson: true, sceneJson: true },
            },
          },
        },
        buyer: {
          select: { id: true, name: true, email: true },
        },
        vendor: {
          select: { id: true, companyName: true, rating: true, city: true, leadDays: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ quotes });
  } catch (error: any) {
    console.error("GET /api/quotes error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireRole(["BUYER", "VENDOR", "ADMIN"]);
    if (auth.error) return auth.error;

    const userId = auth.actor.id;
    const body = await req.json();
    let {
      designId,
      vendorId,
      negotiatedTotal,
      messageText,
      offerAmount,
      sceneJson,
      bomJson,
      designTitle,
      customerContact,
      logistics,
    } = body;

    if (!vendorId) {
      return NextResponse.json({ error: "Missing vendorId" }, { status: 400 });
    }

    const vendor = await prisma.vendorProfile.findUnique({ where: { id: String(vendorId) } });
    if (!vendor || vendor.approvalStatus !== "APPROVED") {
      return NextResponse.json({ error: "Selected vendor is not approved or unavailable" }, { status: 400 });
    }

    const contactSummary = customerContact?.fullName
      ? `${customerContact.fullName} (${customerContact.phone}) | ${
          logistics?.deliveryMode === "SELF_PICKUP"
            ? "Self-Pickup from Maker Yard"
            : `${customerContact.city || ""} ${customerContact.pincode || ""} • ${
                logistics?.placementLevel || "GROUND"
              }`
        }`
      : "Customer inquiry configuration";

    if (!designId) {
      const cleanTitle = (designTitle || "Customer Room Inquiry").trim();
      const slug = `inquiry-${Math.random().toString(36).substring(2, 8)}`;
      const draft = await prisma.design.create({
        data: {
          userId,
          title: cleanTitle,
          slug,
          description: contactSummary,
          isPublic: true,
          versions: {
            create: [
              {
                versionNumber: 1,
                commitNote: "Quote request snapshot",
                sceneJson: typeof sceneJson === "string" ? sceneJson : JSON.stringify(sceneJson || {}),
                bomJson: typeof bomJson === "string" ? bomJson : JSON.stringify(bomJson || {}),
              },
            ],
          },
        },
      });
      designId = draft.id;
    }

    const initialMessages =
      messageText || customerContact || logistics
        ? [
            {
              id: `msg-${Date.now()}`,
              sender: "BUYER",
              text: messageText || contactSummary,
              timestamp: new Date().toISOString(),
              offerAmount: offerAmount || undefined,
              siteSheet:
                customerContact || logistics
                  ? { customerContact, logistics }
                  : undefined,
            },
          ]
        : [];

    const quote = await prisma.quoteRequest.create({
      data: {
        designId,
        buyerId: userId,
        vendorId,
        negotiatedTotal: Number(negotiatedTotal) || 350000,
        messagesJson: JSON.stringify(initialMessages),
        status: offerAmount ? "NEGOTIATING" : "PENDING",
      },
      include: {
        vendor: true,
        design: true,
      },
    });

    return NextResponse.json({ success: true, quote });
  } catch (error: any) {
    console.error("POST /api/quotes error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = await requireRole(["BUYER", "VENDOR", "ADMIN"]);
    if (auth.error) return auth.error;

    const body = await req.json();
    const { quoteId, sender, messageText, offerAmount, status } = body;

    if (!quoteId) {
      return NextResponse.json({ error: "quoteId required" }, { status: 400 });
    }

    const existing = await prisma.quoteRequest.findUnique({ where: { id: quoteId } });
    if (!existing) {
      return NextResponse.json({ error: "Quote request not found" }, { status: 404 });
    }

    const isAllowed =
      auth.actor.role === "ADMIN" ||
      (auth.actor.vendorId && existing.vendorId === auth.actor.vendorId) ||
      existing.buyerId === auth.actor.id;

    if (!isAllowed) {
      return NextResponse.json({ error: "Not authorized for this quote" }, { status: 403 });
    }

    let messages: any[] = [];
    try {
      messages = JSON.parse(existing.messagesJson || "[]");
    } catch {}

    if (messageText) {
      messages.push({
        id: `msg-${Date.now()}`,
        sender: sender || auth.actor.role,
        text: messageText,
        timestamp: new Date().toISOString(),
        offerAmount: offerAmount ? Number(offerAmount) : undefined,
      });
    }

    const updated = await prisma.quoteRequest.update({
      where: { id: quoteId },
      data: {
        status: status || (offerAmount ? "NEGOTIATING" : existing.status),
        negotiatedTotal: offerAmount ? Number(offerAmount) : existing.negotiatedTotal,
        messagesJson: JSON.stringify(messages),
      },
      include: {
        design: { select: { id: true, title: true, slug: true } },
        buyer: { select: { id: true, name: true, email: true } },
        vendor: { select: { id: true, companyName: true } },
      },
    });

    return NextResponse.json({ success: true, quote: updated });
  } catch (error: any) {
    console.error("PATCH /api/quotes error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
