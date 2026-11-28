import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { listPublishedGuides } from "@/lib/seoEngine/guideReader";
import { getPublicSiteSeoConfig } from "@/lib/seoEngine/siteConfigReader";

export const dynamic = "force-dynamic";

function escapeXml(str: string): string {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const [cfg, guides] = await Promise.all([getPublicSiteSeoConfig(), listPublishedGuides()]);
  const base = cfg.siteUrl;

  let designs: Array<{ title: string; slug: string; description: string | null; updatedAt: Date }> = [];
  try {
    designs = await prisma.design.findMany({
      where: { isPublic: true },
      select: { title: true, slug: true, description: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
      take: 25,
    });
  } catch {
    designs = [];
  }

  const guideItems = guides.map((g) => {
    const link = `${base}/guides/${g.slug}`;
    const pubDate = new Date(g.pushedLiveAt || g.reviewedAt || Date.now()).toUTCString();
    return `    <item>
      <title>${escapeXml(g.title)}</title>
      <link>${escapeXml(link)}</link>
      <guid isPermaLink="true">${escapeXml(link)}</guid>
      <pubDate>${pubDate}</pubDate>
      <category>${escapeXml(`${g.targetGeo} / ${g.intent}`)}</category>
      <description>${escapeXml(g.tldrAnswer || g.metaDesc)}</description>
    </item>`;
  });

  const designItems = designs.map((d) => {
    const link = `${base}/design/${d.slug}`;
    return `    <item>
      <title>${escapeXml(`3D Prefab Design: ${d.title}`)}</title>
      <link>${escapeXml(link)}</link>
      <guid isPermaLink="true">${escapeXml(link)}</guid>
      <pubDate>${new Date(d.updatedAt).toUTCString()}</pubDate>
      <category>3D Configurator Layout</category>
      <description>${escapeXml(d.description || "Interactive 3D modular prefab layout")}</description>
    </item>`;
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml("MyPrefabRoom — Prefab Room Guides & 3D Layouts")}</title>
    <link>${escapeXml(base)}</link>
    <description>${escapeXml(cfg.llmsSummaryNote)}</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${escapeXml(`${base}/feed.xml`)}" rel="self" type="application/rss+xml" />
${[...guideItems, ...designItems].join("\n")}
  </channel>
</rss>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
