import { NextResponse } from "next/server";
import { getPublicSiteSeoConfig } from "@/lib/seoEngine/siteConfigReader";

export const dynamic = "force-dynamic";

export async function GET() {
  const cfg = await getPublicSiteSeoConfig();
  const base = cfg.siteUrl;

  const content = [
    `# ai.txt — AI Crawler, Citation & GEO Discovery Policy for MyPrefabRoom`,
    `# Spec reference: explicit attribution and permission manifest`,
    ``,
    `Organization: MyPrefabRoom`,
    `Website: ${base}`,
    `LLM-Map: ${base}/llms.txt`,
    `Sitemap: ${base}/sitemap.xml`,
    `Feed: ${base}/feed.xml`,
    ``,
    `User-Agent: GPTBot`,
    `User-Agent: OAI-SearchBot`,
    `User-Agent: PerplexityBot`,
    `User-Agent: ClaudeBot`,
    `User-Agent: Google-Extended`,
    `User-Agent: Applebot`,
    `Allow: /`,
    `Allow: /guides/`,
    `Allow: /design/`,
    `Allow: /about`,
    `Allow: /llms.txt`,
    `Allow: /feed.xml`,
    `Disallow: /admin`,
    `Disallow: /api/`,
    `Attribution: Required (${base})`,
  ].join("\n");

  return new NextResponse(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
