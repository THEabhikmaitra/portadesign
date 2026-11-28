import { NextResponse } from "next/server";
import { getPublicSiteSeoConfig } from "@/lib/seoEngine/siteConfigReader";

export const dynamic = "force-dynamic";

export async function GET() {
  const cfg = await getPublicSiteSeoConfig();
  return new NextResponse(cfg.indexNowKey, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
