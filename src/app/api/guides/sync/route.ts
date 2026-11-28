import fs from "fs";
import path from "path";
import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getGuidesStorageDir } from "@/lib/seoEngine/guideReader";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const sig = req.headers.get("x-seo-signature") || "";
    const secret = (process.env.SEO_SYNC_SECRET || process.env.NEXTAUTH_SECRET || "").trim();

    if (!secret || !sig) {
      return NextResponse.json({ error: "Unauthorized sync request" }, { status: 401 });
    }

    const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
    const sigBuf = Buffer.from(sig, "utf8");
    const expBuf = Buffer.from(expected, "utf8");
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return NextResponse.json({ error: "Invalid HMAC signature" }, { status: 403 });
    }

    const bundle = JSON.parse(rawBody);
    if (!bundle.slug || Number(bundle.wordCount) < 5000 || !bundle.reviewerName) {
      return NextResponse.json(
        { error: "Rejected: HITL requires >= 5,000 words & signed reviewerName." },
        { status: 400 }
      );
    }

    const commonData = {
      title: String(bundle.title),
      metaTitle: String(bundle.metaTitle),
      metaDesc: String(bundle.metaDesc),
      targetGeo: String(bundle.targetGeo || "GLOBAL"),
      keyword: String(bundle.keyword || bundle.title),
      intent: String(bundle.intent || "COST"),
      clusterRole: String(bundle.clusterRole || "PILLAR"),
      parentPillarSlug: bundle.parentPillarSlug ? String(bundle.parentPillarSlug) : null,
      status: "PUBLISHED",
      tldrAnswer: String(bundle.tldrAnswer),
      sectionsJson: JSON.stringify(bundle.sections || []),
      contentMarkdown: String(bundle.contentMarkdown),
      wordCount: Number(bundle.wordCount),
      readingMinutes: Number(bundle.readingMinutes || 25),
      faqJson: JSON.stringify(bundle.faqs || []),
      keyStatsJson: JSON.stringify(bundle.keyStats || []),
      citationsJson: JSON.stringify(bundle.citations || []),
      vendorSnapshotJson: JSON.stringify(bundle.vendors || []),
      guideImagesJson: JSON.stringify(bundle.guideImages || []),
      ymylDisclaimer: String(bundle.ymylDisclaimer),
      sponsorshipDisclosure: String(bundle.sponsorshipDisclosure || ""),
      priceVerifiedDate: bundle.priceVerifiedDate ? String(bundle.priceVerifiedDate) : null,
      authorName: String(bundle.authorName),
      authorRole: String(bundle.authorRole),
      reviewerName: String(bundle.reviewerName),
      reviewerCreds: bundle.reviewerCreds ? String(bundle.reviewerCreds) : null,
      reviewedAt: bundle.reviewedAt ? new Date(bundle.reviewedAt) : new Date(),
      scoreJson: JSON.stringify(bundle.score || {}),
      linkedPresetCode: bundle.linkedPresetCode || null,
      pushedLiveAt: new Date(),
      pushTarget: "REMOTE_WEBHOOK_SYNC",
    };

    await prisma.seoPost.upsert({
      where: { slug: String(bundle.slug) },
      update: commonData,
      create: { slug: String(bundle.slug), ...commonData },
    });

    try {
      const dir = getGuidesStorageDir();
      fs.writeFileSync(path.join(dir, `${bundle.slug}.json`), JSON.stringify(bundle, null, 2), "utf8");
    } catch {
      // Read-only filesystem safe ignore
    }

    revalidatePath("/guides");
    revalidatePath(`/guides/${bundle.slug}`);
    revalidatePath("/sitemap.xml");

    return NextResponse.json({ success: true, slug: bundle.slug, status: "PUBLISHED" });
  } catch (error: any) {
    console.error("POST /api/guides/sync error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
