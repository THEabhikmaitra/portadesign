import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    const vendorId = (session?.user as any)?.vendorId;

    const where: any = {};
    if (vendorId) {
      where.vendorId = vendorId;
    } else if (userId) {
      where.buyerId = userId;
    }

    const quotes = await prisma.quoteRequest.findMany({
      where,
      include: {
        design: {
          select: { id: true, title: true, slug: true, previewImage: true },
        },
        buyer: {
          select: { id: true, name: true, email: true },
        },
        vendor: {
          select: { id: true, companyName: true, rating: true, city: true },
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
    const session = await getServerSession(authOptions);
    let userId = (session?.user as any)?.id;
    if (!userId) {
      const defaultBuyer = await prisma.user.findFirst({ where: { role: "BUYER" } });
      userId = defaultBuyer?.id;
    }

    if (!userId) {
      return NextResponse.json({ error: "Buyer account required" }, { status: 401 });
    }

    const body = await req.json();
    const { designId, vendorId, negotiatedTotal, messageText, offerAmount } = body;

    if (!designId || !vendorId) {
      return NextResponse.json({ error: "Missing designId or vendorId" }, { status: 400 });
    }

    const initialMessages = messageText
      ? [
          {
            id: `msg-${Date.now()}`,
            sender: "BUYER",
            text: messageText,
            timestamp: new Date().toISOString(),
            offerAmount: offerAmount || negotiatedTotal,
          },
        ]
      : [];

    const quote = await prisma.quoteRequest.create({
      data: {
        designId,
        buyerId: userId,
        vendorId,
        negotiatedTotal: negotiatedTotal || 400000,
        messagesJson: JSON.stringify(initialMessages),
        status: "PENDING",
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
