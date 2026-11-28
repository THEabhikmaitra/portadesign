import fs from "fs";
import path from "path";
import crypto from "crypto";
import { execFile } from "child_process";
import { promisify } from "util";
import { prisma } from "@/lib/prisma";
import { getGuidesStorageDir, mapDbPostToBundle } from "./guideReader";
import { scoreSeoPost } from "./complianceScorer";

const execFileAsync = promisify(execFile);

export interface PushLiveOptions {
  postId: string;
  webhookUrl?: string;
  gitPush?: boolean;
  commitMessage?: string;
}

export async function pushApprovedPostToLive(opts: PushLiveOptions): Promise<{
  success: boolean;
  slug: string;
  filePath: string;
  webhookSynced: boolean;
  gitPushed: boolean;
  message: string;
}> {
  const row = await prisma.seoPost.findUnique({ where: { id: opts.postId } });
  if (!row) throw new Error("SEO post not found");

  const bundle = mapDbPostToBundle(row);
  const latestScore = scoreSeoPost({
    title: bundle.title,
    slug: bundle.slug,
    metaTitle: bundle.metaTitle,
    metaDesc: bundle.metaDesc,
    keyword: bundle.keyword,
    tldrAnswer: bundle.tldrAnswer,
    contentMarkdown: bundle.contentMarkdown,
    faqs: bundle.faqs,
    keyStats: bundle.keyStats,
    citations: bundle.citations,
    ymylDisclaimer: bundle.ymylDisclaimer,
    authorName: bundle.authorName,
    reviewerName: bundle.reviewerName,
  });

  if (!latestScore.wordFloorOk) {
    throw new Error(
      `HITL Gate Blocked: Post has ${latestScore.wordCount} words. Minimum 5,000 words required before Push to Live.`
    );
  }
  if (!latestScore.reviewerSignedOff) {
    throw new Error(
      "HITL Gate Blocked: Reviewer Name & E-E-A-T sign-off required before pushing live."
    );
  }

  const nowIso = new Date().toISOString();
  const updatedRow = await prisma.seoPost.update({
    where: { id: row.id },
    data: {
      status: "PUBLISHED",
      wordCount: latestScore.wordCount,
      scoreJson: JSON.stringify({ ...latestScore, readyToPublish: true }),
      pushedLiveAt: new Date(),
      reviewedAt: row.reviewedAt || new Date(),
      pushTarget: opts.webhookUrl ? "STATIC+WEBHOOK" : opts.gitPush ? "STATIC+GIT" : "LOCAL_STATIC_BUNDLE",
    },
  });

  const publishedBundle = mapDbPostToBundle(updatedRow);
  publishedBundle.status = "PUBLISHED";
  publishedBundle.pushedLiveAt = nowIso;

  // Write portable SSR JSON bundle to src/content/guides/<slug>.json
  const dir = getGuidesStorageDir();
  const filePath = path.join(dir, `${publishedBundle.slug}.json`);
  fs.writeFileSync(filePath, JSON.stringify(publishedBundle, null, 2), "utf8");

  let webhookSynced = false;
  const targetUrl = (opts.webhookUrl || process.env.LIVE_SYNC_URL || "").trim();
  const syncSecret = (process.env.SEO_SYNC_SECRET || process.env.NEXTAUTH_SECRET || "").trim();

  if (targetUrl && syncSecret) {
    const payload = JSON.stringify(publishedBundle);
    const sig = crypto.createHmac("sha256", syncSecret).update(payload).digest("hex");
    const syncRes = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-seo-signature": sig,
      },
      body: payload,
    });
    if (!syncRes.ok) {
      const errTxt = await syncRes.text().catch(() => "");
      throw new Error(`Remote live webhook failed (${syncRes.status}): ${errTxt.slice(0, 180)}`);
    }
    webhookSynced = true;
  }

  let gitPushed = false;
  if (opts.gitPush) {
    const safeMsg = (opts.commitMessage || `content(guides): publish ${publishedBundle.slug}`).replace(
      /["\r\n]/g,
      " "
    );
    await execFileAsync("git", ["add", `src/content/guides/${publishedBundle.slug}.json`], {
      cwd: process.cwd(),
    });
    await execFileAsync("git", ["commit", "-m", safeMsg], { cwd: process.cwd() });
    await execFileAsync("git", ["push", "origin", "main"], { cwd: process.cwd() });
    gitPushed = true;
  }

  return {
    success: true,
    slug: publishedBundle.slug,
    filePath: `src/content/guides/${publishedBundle.slug}.json`,
    webhookSynced,
    gitPushed,
    message: gitPushed
      ? `Published & git-pushed src/content/guides/${publishedBundle.slug}.json to origin/main.`
      : webhookSynced
      ? `Published locally & synced live via signed webhook to ${targetUrl}.`
      : `Published bundle src/content/guides/${publishedBundle.slug}.json — ready for /guides/${publishedBundle.slug} or git push.`,
  };
}
