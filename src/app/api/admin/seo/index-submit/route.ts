import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, logAdminAction } from "@/lib/authGuard";
import { getPublicSiteSeoConfig } from "@/lib/seoEngine/siteConfigReader";
import { listPublishedGuides } from "@/lib/seoEngine/guideReader";
import { broadcastUrlsToIndexers } from "@/lib/seoEngine/indexingService";

export async function GET() {
  const auth = await requireRole(["ADMIN"]);
  if (auth.error) return auth.error;

  try {
    const logs = await prisma.seoIndexingLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return NextResponse.json({ logs });
  } catch {
    return NextResponse.json({ logs: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireRole(["ADMIN"]);
    if (auth.error) return auth.error;

    const body = await req.json().catch(() => ({}));
    const cfg = await getPublicSiteSeoConfig();
    const actionType = body.actionType === "URL_DELETED" ? "URL_DELETED" : "URL_UPDATED";
    const includeGoogle = body.includeGoogle !== false;

    let urls: string[] = [];
    if (body.mode === "single" && body.url) {
      const candidate = String(body.url).trim();
      urls = [candidate.startsWith("http") ? candidate : `${cfg.siteUrl}${candidate.startsWith("/") ? "" : "/"}${candidate}`];
    } else {
      const guides = await listPublishedGuides();
      urls = [
        `${cfg.siteUrl}/`,
        `${cfg.siteUrl}/guides`,
        `${cfg.siteUrl}/about`,
        `${cfg.siteUrl}/privacy`,
        ...guides.map((g) => `${cfg.siteUrl}/guides/${g.slug}`),
      ];
    }

    const result = await broadcastUrlsToIndexers(urls, actionType, includeGoogle);
    await logAdminAction(auth.actor.id, "SEO_INDEX_SUBMIT", "SeoIndexingLog", "batch", {
      count: urls.length,
      actionType,
    });

    const logs = await prisma.seoIndexingLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({ success: true, submittedUrls: urls, result, logs });
  } catch (err: any) {
    console.error("POST /api/admin/seo/index-submit error:", err);
    return NextResponse.json({ error: err.message || "Indexing submission failed" }, { status: 400 });
  }
}
