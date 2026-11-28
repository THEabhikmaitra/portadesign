import { listPublishedGuides } from "./guideReader";

export interface PageAuditResult {
  path: string;
  status: number;
  ttfbMs: number;
  htmlKb: number;
  domNodes: number;
  hasLangAttr: boolean;
  hasViewport: boolean;
  hasCharset: boolean;
  title: string;
  titleLen: number;
  metaDescLen: number;
  canonical: string;
  h1Count: number;
  h1Text: string;
  h2Count: number;
  imgCount: number;
  missingAltCount: number;
  schemaTypes: string[];
  schemaParseErrors: number;
  errors: string[];
  warnings: string[];
  passed: boolean;
}

export interface SiteWideAuditReport {
  auditedBaseUrl: string;
  auditedAt: string;
  score: number;
  endpoints: {
    robotsTxt: { ok: boolean; status: number; aiBotsAllowed: boolean; hasSitemap: boolean };
    sitemapXml: { ok: boolean; status: number; urlCount: number };
    llmsTxt: { ok: boolean; status: number; bytes: number };
    aiTxt: { ok: boolean; status: number; bytes: number };
    feedXml: { ok: boolean; status: number; itemCount: number };
    indexNowKeyTxt: { ok: boolean; status: number };
  };
  pages: PageAuditResult[];
  duplicateTitles: string[];
  duplicateMetaDescs: string[];
  allDetectedSchemaTypes: string[];
}

function collectSchemaTypes(node: any, acc: Set<string>) {
  if (!node || typeof node !== "object") return;
  if (Array.isArray(node)) {
    for (const item of node) collectSchemaTypes(item, acc);
    return;
  }
  if (node["@type"]) {
    const types = Array.isArray(node["@type"]) ? node["@type"] : [node["@type"]];
    types.forEach((t: any) => acc.add(String(t)));
  }
  for (const val of Object.values(node)) {
    if (val && typeof val === "object") collectSchemaTypes(val, acc);
  }
}

export async function runSiteWideTechSeoAudit(baseOrigin: string): Promise<SiteWideAuditReport> {
  const cleanOrigin = baseOrigin.replace(/\/$/, "");
  const guides = await listPublishedGuides();

  const targetPaths = [
    "/",
    "/guides",
    ...guides.slice(0, 6).map((g) => `/guides/${g.slug}`),
    "/about",
    "/privacy",
    "/vendor",
  ];

  // 1. Check critical machine-readable SEO / AI / GEO / Feed endpoints
  const checkTextEndpoint = async (p: string) => {
    try {
      const r = await fetch(`${cleanOrigin}${p}`, { cache: "no-store" });
      const text = await r.text();
      return { ok: r.ok, status: r.status, text };
    } catch {
      return { ok: false, status: 0, text: "" };
    }
  };

  const [robots, sitemap, llms, ai, feed, idxKey] = await Promise.all([
    checkTextEndpoint("/robots.txt"),
    checkTextEndpoint("/sitemap.xml"),
    checkTextEndpoint("/llms.txt"),
    checkTextEndpoint("/ai.txt"),
    checkTextEndpoint("/feed.xml"),
    checkTextEndpoint("/indexnow-key.txt"),
  ]);

  const robotsLower = robots.text.toLowerCase();
  const endpoints = {
    robotsTxt: {
      ok: robots.ok,
      status: robots.status,
      aiBotsAllowed: robotsLower.includes("gptbot") && robotsLower.includes("perplexitybot"),
      hasSitemap: robotsLower.includes("sitemap:"),
    },
    sitemapXml: {
      ok: sitemap.ok && sitemap.text.includes("<urlset"),
      status: sitemap.status,
      urlCount: (sitemap.text.match(/<loc>/g) || []).length,
    },
    llmsTxt: { ok: llms.ok && llms.text.includes("# "), status: llms.status, bytes: llms.text.length },
    aiTxt: { ok: ai.ok && ai.text.includes("GPTBot"), status: ai.status, bytes: ai.text.length },
    feedXml: {
      ok: feed.ok && feed.text.includes("<rss"),
      status: feed.status,
      itemCount: (feed.text.match(/<item>/g) || []).length,
    },
    indexNowKeyTxt: { ok: idxKey.ok && idxKey.text.trim().length >= 8, status: idxKey.status },
  };

  // 2. Crawl each HTML page & audit ZELMUx checklists (On-page + Core Web Vitals DOM + Schema)
  const pages: PageAuditResult[] = [];
  const allSchemaSet = new Set<string>();
  const titleMap = new Map<string, string[]>();
  const descMap = new Map<string, string[]>();

  for (const p of targetPaths) {
    const start = Date.now();
    let status = 0;
    let html = "";
    try {
      const r = await fetch(`${cleanOrigin}${p}`, { cache: "no-store" });
      status = r.status;
      html = await r.text();
    } catch {
      status = 0;
    }
    const ttfbMs = Date.now() - start;
    const htmlKb = Math.round((Buffer.byteLength(html, "utf8") / 1024) * 10) / 10;
    const domNodes = (html.match(/<[a-zA-Z][a-zA-Z0-9]*\b/g) || []).length;

    const hasLangAttr = /<html[^>]+lang\s*=/i.test(html);
    const hasViewport = /<meta[^>]+name=["']viewport["']/i.test(html);
    const hasCharset = /charset/i.test(html);

    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1].replace(/\s+/g, " ").trim() : "";
    const titleLen = title.length;

    const descMatch = html.match(/<meta[^>]+name=["']description["'][^>]*content=["']([^"']*)["']/i) ||
      html.match(/<meta[^>]+content=["']([^"']*)["'][^>]*name=["']description["']/i);
    const desc = descMatch ? descMatch[1].trim() : "";
    const metaDescLen = desc.length;

    const canonMatch = html.match(/<link[^>]+rel=["']canonical["'][^>]*href=["']([^"']*)["']/i);
    const canonical = canonMatch ? canonMatch[1].trim() : "";

    const h1Matches = Array.from(html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi));
    const h1Count = h1Matches.length;
    const h1Text = h1Matches[0] ? h1Matches[0][1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() : "";
    const h2Count = (html.match(/<h2\b/gi) || []).length;

    const imgs = Array.from(html.matchAll(/<img\b[^>]*>/gi));
    let missingAltCount = 0;
    for (const im of imgs) {
      const tag = im[0];
      if (!/alt\s*=\s*["'][^"']+["']/i.test(tag)) missingAltCount++;
    }

    const schemaMatches = Array.from(html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi));
    const pageSchemas = new Set<string>();
    let schemaParseErrors = 0;
    for (const sm of schemaMatches) {
      try {
        const parsed = JSON.parse(sm[1]);
        collectSchemaTypes(parsed, pageSchemas);
      } catch {
        schemaParseErrors++;
      }
    }
    pageSchemas.forEach((s) => allSchemaSet.add(s));

    const errors: string[] = [];
    const warnings: string[] = [];

    if (status !== 200) errors.push(`HTTP ${status} (expected 200)`);
    if (!hasLangAttr) errors.push("Missing <html lang>");
    if (!hasViewport) errors.push("Missing viewport meta");
    if (!title) errors.push("Missing <title>");
    if (h1Count === 0) warnings.push("Missing <h1>");
    if (h1Count > 1) errors.push(`Multiple <h1> tags (${h1Count})`);
    if (schemaParseErrors > 0) errors.push(`Invalid JSON-LD (${schemaParseErrors})`);
    if (missingAltCount > 0) warnings.push(`${missingAltCount} <img> missing descriptive alt`);
    if (titleLen > 0 && (titleLen < 25 || titleLen > 70)) warnings.push(`Title length ${titleLen}c (ideal 30-65)`);
    if (metaDescLen > 0 && (metaDescLen < 70 || metaDescLen > 165)) warnings.push(`Meta desc length ${metaDescLen}c`);
    if (metaDescLen === 0) warnings.push("Missing meta description");
    if (domNodes > 1400) warnings.push(`High DOM count (${domNodes} > 1400)`);

    if (title) titleMap.set(title, [...(titleMap.get(title) || []), p]);
    if (desc) descMap.set(desc, [...(descMap.get(desc) || []), p]);

    pages.push({
      path: p,
      status,
      ttfbMs,
      htmlKb,
      domNodes,
      hasLangAttr,
      hasViewport,
      hasCharset,
      title,
      titleLen,
      metaDescLen,
      canonical,
      h1Count,
      h1Text,
      h2Count,
      imgCount: imgs.length,
      missingAltCount,
      schemaTypes: Array.from(pageSchemas),
      schemaParseErrors,
      errors,
      warnings,
      passed: errors.length === 0,
    });
  }

  const duplicateTitles = Array.from(titleMap.entries())
    .filter(([, paths]) => paths.length > 1)
    .map(([t, paths]) => `${t} (${paths.join(", ")})`);
  const duplicateMetaDescs = Array.from(descMap.entries())
    .filter(([, paths]) => paths.length > 1)
    .map(([d, paths]) => `${d.slice(0, 45)}... (${paths.join(", ")})`);

  const epChecks = [
    endpoints.robotsTxt.ok,
    endpoints.robotsTxt.aiBotsAllowed,
    endpoints.sitemapXml.ok,
    endpoints.llmsTxt.ok,
    endpoints.aiTxt.ok,
    endpoints.feedXml.ok,
    endpoints.indexNowKeyTxt.ok,
  ];
  const epRatio = epChecks.filter(Boolean).length / epChecks.length;
  const pagePassRatio = pages.length ? pages.filter((x) => x.passed).length / pages.length : 1;
  const score = Math.round(epRatio * 40 + pagePassRatio * 60 - duplicateTitles.length * 5);

  return {
    auditedBaseUrl: cleanOrigin,
    auditedAt: new Date().toISOString(),
    score: Math.max(0, Math.min(100, score)),
    endpoints,
    pages,
    duplicateTitles,
    duplicateMetaDescs,
    allDetectedSchemaTypes: Array.from(allSchemaSet),
  };
}

export async function runLighthousePageSpeedCheck(
  targetUrl: string,
  strategy: "mobile" | "desktop" = "mobile"
) {
  if (!targetUrl.startsWith("http")) {
    throw new Error("Target URL must start with http:// or https://");
  }
  const hostname = new URL(targetUrl).hostname.toLowerCase();
  if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1") {
    return {
      ok: false,
      localOnlySkip: true,
      message: "Google PageSpeed Insights API requires a public live URL (cannot reach localhost). Use Local Site Audit for local verification.",
    };
  }

  const key = process.env.GOOGLE_PAGESPEED_API_KEY || process.env.PSI_API_KEY || "";
  const apiUrl = new URL("https://www.googleapis.com/pagespeedonline/v5/runPagespeed");
  apiUrl.searchParams.set("url", targetUrl);
  apiUrl.searchParams.set("strategy", strategy);
  for (const cat of ["performance", "accessibility", "best-practices", "seo"]) {
    apiUrl.searchParams.append("category", cat);
  }
  if (key) apiUrl.searchParams.set("key", key);

  const res = await fetch(apiUrl.toString(), { cache: "no-store" });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.message || `PageSpeed API HTTP ${res.status}`);
  }

  const cats = data?.lighthouseResult?.categories || {};
  const audits = data?.lighthouseResult?.audits || {};
  return {
    ok: true,
    strategy,
    targetUrl,
    scores: {
      performance: Math.round((cats.performance?.score || 0) * 100),
      accessibility: Math.round((cats.accessibility?.score || 0) * 100),
      bestPractices: Math.round((cats["best-practices"]?.score || 0) * 100),
      seo: Math.round((cats.seo?.score || 0) * 100),
    },
    metrics: {
      fcp: audits["first-contentful-paint"]?.displayValue || "",
      lcp: audits["largest-contentful-paint"]?.displayValue || "",
      cls: audits["cumulative-layout-shift"]?.displayValue || "",
      tbt: audits["total-blocking-time"]?.displayValue || "",
    },
  };
}
