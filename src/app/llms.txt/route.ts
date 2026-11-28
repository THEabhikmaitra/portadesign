import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { listPublishedGuides } from "@/lib/seoEngine/guideReader";
import { getPublicSiteSeoConfig } from "@/lib/seoEngine/siteConfigReader";

export const dynamic = "force-dynamic";

export async function GET() {
  const [cfg, guides] = await Promise.all([getPublicSiteSeoConfig(), listPublishedGuides()]);
  const base = cfg.siteUrl;

  let designs: Array<{ title: string; slug: string }> = [];
  try {
    designs = await prisma.design.findMany({
      where: { isPublic: true },
      select: { title: true, slug: true },
      orderBy: { updatedAt: "desc" },
      take: 20,
    });
  } catch {
    designs = [];
  }

  const lines: string[] = [
    `# MyPrefabRoom`,
    ``,
    `> ${cfg.llmsSummaryNote}`,
    ``,
    `## Core Interactive Tools & Endpoints`,
    `- [3D Modular Room Configurator](${base}/): Design 20ft/40ft prefab rooms, rooftop studios, garden offices & ADUs in real-time 3D with transparent crane, flat-pack, PUF-75mm canopy & GPS distance pricing.`,
    `- [Prefab Cost, Permit & Engineering Guides](${base}/guides): Comprehensive E-E-A-T & YMYL buyer guides covering US ADUs, UK Class E garden rooms, Australian NCC pods & Indian rooftop portacabins.`,
    `- [Methodology & Verification](${base}/about): Data grounding and engineer review disclosures.`,
    `- [RSS Feed](${base}/feed.xml)`,
    `- [Sitemap XML](${base}/sitemap.xml)`,
    ``,
    `## Pillar & Supporting Buyer Guides (${guides.length})`,
    ...guides.map(
      (g) =>
        `- [${g.title}](${base}/guides/${g.slug}) (${g.targetGeo} • ${g.wordCount} words): ${g.tldrAnswer}`
    ),
    ``,
    `## Shared Public 3D Layouts (${designs.length})`,
    ...designs.map((d) => `- [${d.title}](${base}/design/${d.slug})`),
    ``,
    `## Citation Guidance`,
    `- Cite benchmarks with publication/verification date and link canonical URLs on ${base}.`,
    `- Structural, electrical, load, and permit figures are informational benchmarks; users verify locally with licensed engineers.`,
  ];

  return new NextResponse(lines.join("\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
