import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, logAdminAction } from "@/lib/authGuard";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const auth = await requireRole(["ADMIN"]);
    if (auth.error) return auth.error;

    const quotes = await prisma.quoteRequest.findMany({
      include: {
        buyer: { select: { id: true, name: true, email: true, phone: true } },
        vendor: { select: { id: true, companyName: true, city: true, phone: true } },
        design: { select: { id: true, title: true, slug: true } },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ quotes });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = await requireRole(["ADMIN"]);
    if (auth.error) return auth.error;

    const body = await req.json();
    const { id, status, adminNote } = body;
    if (!id) return NextResponse.json({ error: "Quote id required" }, { status: 400 });

    const existing = await prisma.quoteRequest.findUnique({ where: { id: String(id) } });
    if (!existing) return NextResponse.json({ error: "Quote not found" }, { status: 404 });

    let messages = [];
    try {
      messages = JSON.parse(existing.messagesJson || "[]");
    } catch {}

    if (adminNote?.trim()) {
      messages.push({
        id: `m-${Date.now()}`,
        sender: "ADMIN",
        text: `[Platform Mediation] ${adminNote.trim()}`,
        timestamp: new Date().toISOString(),
      });
    }

    const updated = await prisma.quoteRequest.update({
      where: { id: existing.id },
      data: {
        status: status || existing.status,
        messagesJson: JSON.stringify(messages),
      },
    });

    await logAdminAction(auth.actor.id, "QUOTE_MODERATE", "QuoteRequest", updated.id, {
      status: updated.status,
    });

    return NextResponse.json({ success: true, quote: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
