import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole, logAdminAction } from "@/lib/authGuard";
import {
  getPublicSiteSeoConfig,
  writePublicSiteSeoBundle,
} from "@/lib/seoEngine/siteConfigReader";

function inspectServiceAccountMeta(raw: string | null | undefined) {
  if (!raw?.trim()) {
    return { configured: false, clientEmail: null as string | null };
  }
  try {
    const parsed = JSON.parse(raw.trim());
    return {
      configured: Boolean(parsed?.client_email && parsed?.private_key),
      clientEmail: typeof parsed?.client_email === "string" ? parsed.client_email : null,
    };
  } catch {
    return { configured: false, clientEmail: null };
  }
}

export async function GET() {
  const auth = await requireRole(["ADMIN"]);
  if (auth.error) return auth.error;

  const publicCfg = await getPublicSiteSeoConfig();
  let row: any = null;
  try {
    row = await prisma.siteSeoConfig.findUnique({ where: { id: "singleton" } });
  } catch {
    row = null;
  }

  const acctMeta = inspectServiceAccountMeta(
    row?.googleServiceAcctJson || process.env.GOOGLE_INDEXING_KEY_JSON
  );

  return NextResponse.json({
    localAdminOnly: true,
    config: publicCfg,
    hasGoogleServiceAccount: acctMeta.configured,
    googleServiceAccountEmail: acctMeta.clientEmail,
  });
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireRole(["ADMIN"]);
    if (auth.error) return auth.error;

    const body = await req.json();
    const existing = await prisma.siteSeoConfig
      .findUnique({ where: { id: "singleton" } })
      .catch(() => null);

    const nextSiteUrl = String(body.siteUrl || existing?.siteUrl || "https://myprefabroom.com")
      .trim()
      .replace(/\/$/, "");
    const nextHeaderHtml = typeof body.headerHtml === "string" ? body.headerHtml : existing?.headerHtml || "";
    const nextBodyTopHtml = typeof body.bodyTopHtml === "string" ? body.bodyTopHtml : existing?.bodyTopHtml || "";
    const nextFooterHtml = typeof body.footerHtml === "string" ? body.footerHtml : existing?.footerHtml || "";
    const nextCustomSchema =
      typeof body.customGlobalSchemaJson === "string"
        ? body.customGlobalSchemaJson.trim()
        : existing?.customGlobalSchemaJson || "";
    const nextIndexNowKey =
      typeof body.indexNowKey === "string" && body.indexNowKey.trim().length >= 8
        ? body.indexNowKey.trim()
        : existing?.indexNowKey || process.env.INDEXNOW_KEY || "8c4f1d9b3a724e6c9a15d0b4f82e7a31";
    const nextLlmsNote =
      typeof body.llmsSummaryNote === "string"
        ? body.llmsSummaryNote.trim()
        : existing?.llmsSummaryNote || "";

    if (nextCustomSchema) {
      JSON.parse(nextCustomSchema); // throws if malformed JSON
    }

    let nextGoogleJson: string = existing?.googleServiceAcctJson || "";
    if (body.clearGoogleServiceAccount === true) {
      nextGoogleJson = "";
    } else if (typeof body.googleServiceAcctJson === "string" && body.googleServiceAcctJson.trim()) {
      const parsed = JSON.parse(body.googleServiceAcctJson.trim());
      if (!parsed?.client_email || !parsed?.private_key) {
        return NextResponse.json(
          { error: "Google Service Account JSON must contain client_email and private_key." },
          { status: 400 }
        );
      }
      nextGoogleJson = JSON.stringify(parsed);
    }

    await prisma.siteSeoConfig.upsert({
      where: { id: "singleton" },
      create: {
        id: "singleton",
        siteUrl: nextSiteUrl,
        headerHtml: nextHeaderHtml,
        bodyTopHtml: nextBodyTopHtml,
        footerHtml: nextFooterHtml,
        customGlobalSchemaJson: nextCustomSchema,
        indexNowKey: nextIndexNowKey,
        googleServiceAcctJson: nextGoogleJson,
        llmsSummaryNote: nextLlmsNote,
      },
      update: {
        siteUrl: nextSiteUrl,
        headerHtml: nextHeaderHtml,
        bodyTopHtml: nextBodyTopHtml,
        footerHtml: nextFooterHtml,
        customGlobalSchemaJson: nextCustomSchema,
        indexNowKey: nextIndexNowKey,
        googleServiceAcctJson: nextGoogleJson,
        llmsSummaryNote: nextLlmsNote,
      },
    });

    // Write public non-secret bundle to git-tracked JSON (never writes googleServiceAcctJson)
    const bundlePath = writePublicSiteSeoBundle({
      siteUrl: nextSiteUrl,
      headerHtml: nextHeaderHtml,
      bodyTopHtml: nextBodyTopHtml,
      footerHtml: nextFooterHtml,
      customGlobalSchemaJson: nextCustomSchema,
      indexNowKey: nextIndexNowKey,
      llmsSummaryNote: nextLlmsNote,
    });

    revalidatePath("/", "layout");
    revalidatePath("/llms.txt");
    revalidatePath("/ai.txt");
    revalidatePath("/feed.xml");
    revalidatePath("/indexnow-key.txt");
    revalidatePath("/robots.txt");
    revalidatePath("/sitemap.xml");

    await logAdminAction(auth.actor.id, "UPDATE_SITE_SEO_CONFIG", "SiteSeoConfig", "singleton", {
      siteUrl: nextSiteUrl,
      bundlePath,
      updatedGoogleKey: Boolean(body.googleServiceAcctJson || body.clearGoogleServiceAccount),
    });

    const publicCfg = await getPublicSiteSeoConfig();
    const acctMeta = inspectServiceAccountMeta(nextGoogleJson || process.env.GOOGLE_INDEXING_KEY_JSON);

    return NextResponse.json({
      success: true,
      bundlePath,
      config: publicCfg,
      hasGoogleServiceAccount: acctMeta.configured,
      googleServiceAccountEmail: acctMeta.clientEmail,
    });
  } catch (err: any) {
    console.error("POST /api/admin/seo/site-config error:", err);
    return NextResponse.json({ error: err.message || "Invalid request" }, { status: 400 });
  }
}
