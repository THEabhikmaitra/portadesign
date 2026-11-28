import fs from "fs";
import path from "path";
import { prisma } from "@/lib/prisma";

export interface PublicSiteSeoConfig {
  siteUrl: string;
  headerHtml: string;
  bodyTopHtml: string;
  footerHtml: string;
  customGlobalSchemaJson: string;
  indexNowKey: string;
  llmsSummaryNote: string;
}

const DEFAULT_CONFIG: PublicSiteSeoConfig = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "https://myprefabroom.com",
  headerHtml: "",
  bodyTopHtml: "",
  footerHtml: "",
  customGlobalSchemaJson: "",
  indexNowKey: process.env.INDEXNOW_KEY || "8c4f1d9b3a724e6c9a15d0b4f82e7a31",
  llmsSummaryNote:
    "Interactive 3D modular prefab room configurator, real turnkey pricing engine, crane & flat-pack logistics calculator, and E-E-A-T buyer guides.",
};

const PUBLIC_CONFIG_PATH = path.join(process.cwd(), "src", "content", "site-seo-config.json");

export async function getPublicSiteSeoConfig(): Promise<PublicSiteSeoConfig> {
  // 1. Prefer live SQLite SiteSeoConfig if present
  try {
    const row = await prisma.siteSeoConfig.findUnique({ where: { id: "singleton" } });
    if (row) {
      return {
        siteUrl: (row.siteUrl || DEFAULT_CONFIG.siteUrl).replace(/\/$/, ""),
        headerHtml: row.headerHtml || "",
        bodyTopHtml: row.bodyTopHtml || "",
        footerHtml: row.footerHtml || "",
        customGlobalSchemaJson: row.customGlobalSchemaJson || "",
        indexNowKey: row.indexNowKey || DEFAULT_CONFIG.indexNowKey,
        llmsSummaryNote: row.llmsSummaryNote || DEFAULT_CONFIG.llmsSummaryNote,
      };
    }
  } catch {
    // Graceful skip if static build or DB read fails
  }

  // 2. Fallback to static synced JSON bundle (never stores private keys)
  try {
    if (fs.existsSync(PUBLIC_CONFIG_PATH)) {
      const parsed = JSON.parse(fs.readFileSync(PUBLIC_CONFIG_PATH, "utf8"));
      return {
        ...DEFAULT_CONFIG,
        ...parsed,
        siteUrl: String(parsed.siteUrl || DEFAULT_CONFIG.siteUrl).replace(/\/$/, ""),
      };
    }
  } catch {
    // fallback default
  }

  return {
    ...DEFAULT_CONFIG,
    siteUrl: DEFAULT_CONFIG.siteUrl.replace(/\/$/, ""),
  };
}

export function writePublicSiteSeoBundle(cfg: PublicSiteSeoConfig): string {
  const dir = path.dirname(PUBLIC_CONFIG_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const safeBundle: PublicSiteSeoConfig = {
    siteUrl: cfg.siteUrl.replace(/\/$/, ""),
    headerHtml: cfg.headerHtml,
    bodyTopHtml: cfg.bodyTopHtml,
    footerHtml: cfg.footerHtml,
    customGlobalSchemaJson: cfg.customGlobalSchemaJson,
    indexNowKey: cfg.indexNowKey,
    llmsSummaryNote: cfg.llmsSummaryNote,
  };
  fs.writeFileSync(PUBLIC_CONFIG_PATH, JSON.stringify(safeBundle, null, 2), "utf8");
  return "src/content/site-seo-config.json";
}
