import type { MetadataRoute } from "next";
import { getPublicSiteSeoConfig } from "@/lib/seoEngine/siteConfigReader";

export const dynamic = "force-dynamic";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const cfg = await getPublicSiteSeoConfig();
  const baseUrl = cfg.siteUrl;

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/guides/", "/design/", "/about", "/privacy", "/llms.txt", "/ai.txt", "/feed.xml"],
        disallow: ["/admin", "/api/"],
      },
      {
        userAgent: ["OAI-SearchBot", "GPTBot", "PerplexityBot", "ClaudeBot", "Google-Extended", "Applebot"],
        allow: ["/", "/guides/", "/design/", "/llms.txt", "/ai.txt", "/feed.xml"],
        disallow: ["/admin", "/api/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
