import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { listPublishedGuides } from "@/lib/seoEngine/guideReader";
import { getPublicSiteSeoConfig } from "@/lib/seoEngine/siteConfigReader";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const cfg = await getPublicSiteSeoConfig();
  const baseUrl = cfg.siteUrl;
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/`, lastModified: now, changeFrequency: "weekly", priority: 1.0 },
    { url: `${baseUrl}/guides`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/vendor`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${baseUrl}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${baseUrl}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${baseUrl}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${baseUrl}/llms.txt`, lastModified: now, changeFrequency: "daily", priority: 0.5 },
    { url: `${baseUrl}/feed.xml`, lastModified: now, changeFrequency: "daily", priority: 0.5 },
  ];

  const guides = await listPublishedGuides();
  const guideRoutes: MetadataRoute.Sitemap = guides.map((g) => ({
    url: `${baseUrl}/guides/${g.slug}`,
    lastModified: new Date(g.pushedLiveAt || g.reviewedAt || now),
    changeFrequency: "weekly",
    priority: 0.85,
  }));

  let designRoutes: MetadataRoute.Sitemap = [];
  try {
    const publicDesigns = await prisma.design.findMany({
      where: { isPublic: true },
      select: { slug: true, updatedAt: true },
      take: 200,
    });
    designRoutes = publicDesigns.map((d) => ({
      url: `${baseUrl}/design/${d.slug}`,
      lastModified: d.updatedAt,
      changeFrequency: "monthly",
      priority: 0.6,
    }));
  } catch {
    designRoutes = [];
  }

  return [...staticRoutes, ...guideRoutes, ...designRoutes];
}
