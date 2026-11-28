import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { getPublicSiteSeoConfig } from "./siteConfigReader";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_INDEXING_URL = "https://indexing.googleapis.com/v3/urlNotifications:publish";
const INDEXNOW_ENDPOINTS = ["https://api.indexnow.org/indexnow", "https://www.bing.com/indexnow"];

async function getGoogleServiceAccountCredentials(): Promise<{ client_email: string; private_key: string } | null> {
  if (process.env.GOOGLE_INDEXING_KEY_JSON) {
    try {
      return JSON.parse(process.env.GOOGLE_INDEXING_KEY_JSON);
    } catch {
      try {
        return JSON.parse(Buffer.from(process.env.GOOGLE_INDEXING_KEY_JSON, "base64").toString("utf8"));
      } catch {
        // invalid env format
      }
    }
  }
  try {
    const row = await prisma.siteSeoConfig.findUnique({ where: { id: "singleton" } });
    if (row?.googleServiceAcctJson?.trim()) {
      return JSON.parse(row.googleServiceAcctJson.trim());
    }
  } catch {
    // ignore parse error
  }
  return null;
}

async function getGoogleIndexingToken(creds: { client_email: string; private_key: string }): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const b64url = (obj: object) =>
    Buffer.from(JSON.stringify(obj), "utf8").toString("base64url");

  const header = b64url({ alg: "RS256", typ: "JWT" });
  const payload = b64url({
    iss: creds.client_email,
    scope: "https://www.googleapis.com/auth/indexing",
    aud: GOOGLE_TOKEN_URL,
    iat: now,
    exp: now + 3600,
  });

  const signingInput = `${header}.${payload}`;
  const signer = crypto.createSign("RSA-SHA256");
  signer.update(signingInput);
  const signature = signer.sign(creds.private_key, "base64url");
  const jwt = `${signingInput}.${signature}`;

  const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  const tokenData = await tokenRes.json();
  if (!tokenRes.ok || !tokenData.access_token) {
    throw new Error(tokenData.error_description || tokenData.error || `OAuth2 HTTP ${tokenRes.status}`);
  }
  return String(tokenData.access_token);
}

export async function submitToIndexNow(urls: string[]): Promise<{
  success: boolean;
  count: number;
  statuses: Record<string, number | string>;
}> {
  const cfg = await getPublicSiteSeoConfig();
  const parsedBase = new URL(cfg.siteUrl);
  const host = parsedBase.hostname;

  const cleanUrls = urls.filter((u) => u.startsWith("http")).slice(0, 1000);
  if (cleanUrls.length === 0) {
    return { success: false, count: 0, statuses: { error: "No valid http(s) URLs" } };
  }

  const payload = {
    host,
    key: cfg.indexNowKey,
    keyLocation: `${cfg.siteUrl}/indexnow-key.txt`,
    urlList: cleanUrls,
  };

  const statuses: Record<string, number | string> = {};
  for (const endpoint of INDEXNOW_ENDPOINTS) {
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify(payload),
      });
      statuses[endpoint] = res.status;
    } catch (err: any) {
      statuses[endpoint] = err?.message || "Network error";
    }
  }

  const ok = Object.values(statuses).some((s) => s === 200 || s === 202);
  for (const url of cleanUrls.slice(0, 10)) {
    await prisma.seoIndexingLog.create({
      data: {
        url,
        service: "INDEXNOW",
        actionType: "URL_UPDATED",
        status: ok ? "SUCCESS" : "FAILED",
        httpCode: typeof statuses[INDEXNOW_ENDPOINTS[0]] === "number" ? (statuses[INDEXNOW_ENDPOINTS[0]] as number) : null,
        response: JSON.stringify(statuses),
      },
    });
  }

  return { success: ok, count: cleanUrls.length, statuses };
}

export async function submitToGoogleIndexing(
  url: string,
  actionType: "URL_UPDATED" | "URL_DELETED" = "URL_UPDATED"
): Promise<{ status: "SUCCESS" | "FAILED" | "SKIPPED"; httpCode?: number; detail: string }> {
  const creds = await getGoogleServiceAccountCredentials();
  if (!creds?.client_email || !creds?.private_key) {
    const detail = "Google Service Account JSON not configured (IndexNow & Sitemap ping still work free).";
    await prisma.seoIndexingLog.create({
      data: { url, service: "GOOGLE_INDEXING", actionType, status: "SKIPPED", response: detail },
    });
    return { status: "SKIPPED", detail };
  }

  try {
    const token = await getGoogleIndexingToken(creds);
    const res = await fetch(GOOGLE_INDEXING_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ url, type: actionType }),
    });
    const text = await res.text();
    const ok = res.ok;
    await prisma.seoIndexingLog.create({
      data: {
        url,
        service: "GOOGLE_INDEXING",
        actionType,
        status: ok ? "SUCCESS" : "FAILED",
        httpCode: res.status,
        response: text.slice(0, 500),
      },
    });
    return { status: ok ? "SUCCESS" : "FAILED", httpCode: res.status, detail: text.slice(0, 200) };
  } catch (err: any) {
    const detail = err?.message || "Google Indexing error";
    await prisma.seoIndexingLog.create({
      data: { url, service: "GOOGLE_INDEXING", actionType, status: "FAILED", response: detail },
    });
    return { status: "FAILED", detail };
  }
}

export async function broadcastUrlsToIndexers(
  urls: string[],
  actionType: "URL_UPDATED" | "URL_DELETED" = "URL_UPDATED",
  includeGoogle = true
) {
  const indexNow = await submitToIndexNow(urls);
  const googleResults: Array<{ url: string; status: string; httpCode?: number; detail: string }> = [];

  if (includeGoogle) {
    for (const u of urls.slice(0, 5)) {
      const r = await submitToGoogleIndexing(u, actionType);
      googleResults.push({ url: u, ...r });
    }
  }

  return { indexNow, google: googleResults };
}
