import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/authGuard";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const auth = await requireRole(["ADMIN"]);
    if (auth.error) return auth.error;

    const [
      usersCount,
      buyersCount,
      vendorsPending,
      vendorsApproved,
      vendorsSuspended,
      vendorsSponsored,
      elementsActive,
      elementsTotal,
      attributesActive,
      attributesTotal,
      presetsCount,
      challengesCount,
      designsCount,
      quotes,
      vendorAdStats,
      recentAuditLogs,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: "BUYER" } }),
      prisma.vendorProfile.count({ where: { approvalStatus: "PENDING" } }),
      prisma.vendorProfile.count({ where: { approvalStatus: "APPROVED" } }),
      prisma.vendorProfile.count({ where: { approvalStatus: "SUSPENDED" } }),
      prisma.vendorProfile.count({ where: { isSponsored: true, adStatus: "ACTIVE" } }),
      prisma.masterElement.count({ where: { isActive: true } }),
      prisma.masterElement.count(),
      prisma.masterAttribute.count({ where: { isActive: true } }),
      prisma.masterAttribute.count(),
      prisma.roomPreset.count(),
      prisma.designChallenge.count(),
      prisma.design.count(),
      prisma.quoteRequest.findMany({
        include: {
          buyer: { select: { id: true, name: true, email: true } },
          vendor: { select: { id: true, companyName: true, city: true } },
          design: { select: { id: true, title: true, slug: true } },
        },
        orderBy: { updatedAt: "desc" },
        take: 25,
      }),
      prisma.vendorProfile.aggregate({
        _sum: {
          adImpressions: true,
          adClicks: true,
          adSpentMonth: true,
        },
      }),
      prisma.adminAuditLog.findMany({
        include: { actor: { select: { email: true, name: true } } },
        orderBy: { createdAt: "desc" },
        take: 25,
      }),
    ]);

    const OLLAMA_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
    const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "qwen2.5";
    let ollamaOnline = false;
    let ollamaModels: string[] = [];

    try {
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), 1500);
      const res = await fetch(`${OLLAMA_URL}/api/tags`, { signal: controller.signal });
      clearTimeout(t);
      if (res.ok) {
        const json = await res.json();
        ollamaOnline = true;
        ollamaModels = Array.isArray(json.models) ? json.models.map((m: any) => m.name) : [];
      }
    } catch {}

    const quotesGmv = quotes.reduce((sum, q) => sum + (q.negotiatedTotal || 0), 0);
    const totalImpressions = vendorAdStats._sum.adImpressions || 0;
    const totalClicks = vendorAdStats._sum.adClicks || 0;

    return NextResponse.json({
      stats: {
        usersCount,
        buyersCount,
        vendorsPending,
        vendorsApproved,
        vendorsSuspended,
        vendorsSponsored,
        elementsActive,
        elementsTotal,
        attributesActive,
        attributesTotal,
        presetsCount,
        challengesCount,
        designsCount,
        quotesCount: quotes.length,
        quotesGmv,
        totalImpressions,
        totalClicks,
        adCtrPct: totalImpressions > 0 ? Number(((totalClicks / totalImpressions) * 100).toFixed(2)) : 0,
        adSpentMonth: vendorAdStats._sum.adSpentMonth || 0,
      },
      ollama: {
        online: ollamaOnline,
        baseUrl: OLLAMA_URL,
        configuredModel: OLLAMA_MODEL,
        availableModels: ollamaModels,
      },
      recentQuotes: quotes,
      recentAuditLogs,
    });
  } catch (error: any) {
    console.error("GET /api/admin/overview error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
