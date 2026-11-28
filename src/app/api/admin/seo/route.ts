import fs from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, logAdminAction } from "@/lib/authGuard";
import { detectLlmProviders, generateWithBestLlm, isLocalSeoEngineAllowed } from "@/lib/seoEngine/llmRouter";
import { GLOBAL_PREFAB_TOPICS } from "@/lib/seoEngine/defaultTopics";
import { appendDeepSectionToPost, generateFullSeoArticle } from "@/lib/seoEngine/pipelineOrchestrator";
import { loadGroundedCatalog } from "@/lib/seoEngine/catalogGrounder";
import { countWords, scoreSeoPost, slugifySeo } from "@/lib/seoEngine/complianceScorer";
import { buildSchemaJsonLd, getGuidesStorageDir, mapDbPostToBundle } from "@/lib/seoEngine/guideReader";
import { humanizeSectionsWithAi, humanizeTextPlain } from "@/lib/seoEngine/humanizerPass";
import { auditSeoPostQuality } from "@/lib/seoEngine/qualityAuditor";
import { SeoFaqItem, SeoGeoTarget, SeoIntentType, SeoKeyStat, SeoSectionBlock } from "@/lib/seoEngine/types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const auth = await requireRole(["ADMIN"]);
    if (auth.error) return auth.error;

    const existingQueueCount = await prisma.seoTopicQueue.count();
    if (existingQueueCount === 0) {
      for (const t of GLOBAL_PREFAB_TOPICS) {
        await prisma.seoTopicQueue.upsert({
          where: { slug: t.slug },
          update: {},
          create: {
            keyword: t.keyword,
            slug: t.slug,
            targetGeo: t.targetGeo,
            intent: t.intent,
            clusterRole: t.clusterRole,
            parentPillarSlug: t.parentPillarSlug || null,
            publishTier: t.publishTier,
            priority: t.priority,
            notes: t.linkedPresetCode || "terrace-room",
          },
        });
      }
    }

    const [queue, postRows, providers] = await Promise.all([
      prisma.seoTopicQueue.findMany({
        orderBy: [{ status: "asc" }, { publishTier: "asc" }, { priority: "desc" }, { createdAt: "desc" }],
      }),
      prisma.seoPost.findMany({ orderBy: [{ updatedAt: "desc" }] }),
      detectLlmProviders(),
    ]);

    const posts = postRows.map((row) => {
      const bundle = mapDbPostToBundle(row);
      return {
        id: row.id,
        ...bundle,
        qualityAudit: auditSeoPostQuality(bundle),
        updatedAt: row.updatedAt.toISOString(),
      };
    });

    return NextResponse.json({ queue, posts, providers });
  } catch (error: any) {
    console.error("GET /api/admin/seo error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireRole(["ADMIN"]);
    if (auth.error) return auth.error;

    const body = await req.json();
    const action = String(body.action || "GENERATE").toUpperCase();

    if (action === "ENQUEUE") {
      const keyword = String(body.keyword || "").trim();
      if (!keyword) {
        return NextResponse.json({ error: "Keyword is required" }, { status: 400 });
      }
      const slug = slugifySeo(body.slug || keyword);
      const item = await prisma.seoTopicQueue.upsert({
        where: { slug },
        update: {
          keyword,
          targetGeo: String(body.targetGeo || "GLOBAL").toUpperCase(),
          intent: String(body.intent || "COST").toUpperCase(),
          clusterRole: String(body.clusterRole || "PILLAR").toUpperCase(),
          parentPillarSlug: body.parentPillarSlug ? String(body.parentPillarSlug).trim() : null,
          publishTier: Number(body.publishTier) || 1,
          priority: Number(body.priority) || 80,
          notes: body.linkedPresetCode || "terrace-room",
          status: "QUEUED",
        },
        create: {
          keyword,
          slug,
          targetGeo: String(body.targetGeo || "GLOBAL").toUpperCase(),
          intent: String(body.intent || "COST").toUpperCase(),
          clusterRole: String(body.clusterRole || "PILLAR").toUpperCase(),
          parentPillarSlug: body.parentPillarSlug ? String(body.parentPillarSlug).trim() : null,
          publishTier: Number(body.publishTier) || 1,
          priority: Number(body.priority) || 80,
          notes: body.linkedPresetCode || "terrace-room",
        },
      });
      return NextResponse.json({ success: true, topic: item });
    }

    if (action === "AUDIT_QUALITY") {
      const row = await prisma.seoPost.findUnique({ where: { id: String(body.postId) } });
      if (!row) return NextResponse.json({ error: "Post not found" }, { status: 404 });
      const bundle = mapDbPostToBundle(row);
      const draftSections: SeoSectionBlock[] = Array.isArray(body.sections) ? body.sections : bundle.sections;
      const draftTitle = typeof body.title === "string" ? body.title : bundle.title;
      const draftMetaTitle = typeof body.metaTitle === "string" ? body.metaTitle : bundle.metaTitle;
      const draftMetaDesc = typeof body.metaDesc === "string" ? body.metaDesc : bundle.metaDesc;
      const draftTldr = typeof body.tldrAnswer === "string" ? body.tldrAnswer : bundle.tldrAnswer;
      const draftMarkdown =
        typeof body.contentMarkdown === "string"
          ? body.contentMarkdown
          : [
              `> **Direct Answer (${bundle.targetGeo}):** ${draftTldr}\n\nExplore layouts in [MyPrefabRoom 3D](/) or [Guides Library](/guides).`,
              ...draftSections.map((s) => `## ${s.heading}\n\n${s.markdown}`),
            ].join("\n\n");

      const qualityAudit = auditSeoPostQuality({
        ...bundle,
        title: draftTitle,
        metaTitle: draftMetaTitle,
        metaDesc: draftMetaDesc,
        tldrAnswer: draftTldr,
        sections: draftSections,
        contentMarkdown: draftMarkdown,
      });
      return NextResponse.json({ success: true, qualityAudit });
    }

    if (!isLocalSeoEngineAllowed()) {
      return NextResponse.json(
        { error: "AI Content Engine is restricted to local workstation. Generate locally, review HITL, then Push to Live." },
        { status: 403 }
      );
    }

    if (action === "AI_HUMANIZE_POST") {
      const row = await prisma.seoPost.findUnique({ where: { id: String(body.postId) } });
      if (!row) return NextResponse.json({ error: "Post not found" }, { status: 404 });

      const bundle = mapDbPostToBundle(row);
      const rawSections: SeoSectionBlock[] = Array.isArray(body.sections) ? body.sections : bundle.sections;
      const humanPass = await humanizeSectionsWithAi(rawSections, {
        keyword: bundle.keyword,
        llmConfig: body.llmConfig,
      });
      const cleanSections = humanPass.sections.map((s) => ({
        ...s,
        heading: humanizeTextPlain(s.heading),
      }));
      const cleanTitle = humanizeTextPlain(typeof body.title === "string" ? body.title : bundle.title);
      const cleanMetaTitle = humanizeTextPlain(typeof body.metaTitle === "string" ? body.metaTitle : bundle.metaTitle);
      const cleanMetaDesc = humanizeTextPlain(typeof body.metaDesc === "string" ? body.metaDesc : bundle.metaDesc);
      const cleanTldr = humanizeTextPlain(typeof body.tldrAnswer === "string" ? body.tldrAnswer : bundle.tldrAnswer);
      const cleanFaqs: SeoFaqItem[] = (bundle.faqs || []).map((f) => ({
        ...f,
        question: humanizeTextPlain(f.question),
        answer: humanizeTextPlain(f.answer),
      }));
      const cleanKeyStats: SeoKeyStat[] = (bundle.keyStats || []).map((k) => ({
        ...k,
        label: humanizeTextPlain(k.label),
        value: humanizeTextPlain(k.value),
        context: humanizeTextPlain(k.context),
      }));

      const catalog = await loadGroundedCatalog((row.targetGeo as SeoGeoTarget) || "GLOBAL");
      const compiledMarkdown = [
        humanizeTextPlain(
          `> **Direct Answer (${row.targetGeo}):** ${cleanTldr}\n\nExplore layouts in [MyPrefabRoom 3D](/), browse our [Guides Library](/guides), or read our [editorial methodology](/about).`
        ),
        ...cleanSections.map((s) => `## ${s.heading}\n\n${s.markdown}`),
        humanizeTextPlain(
          `## Methodology & Verified Citations\n\nAll base prices, freight formulas, crane fees, thermal drops, and warranties were benchmarked across ${catalog.vendorCount} active fabricators (${catalog.avgWarrantyYears}-year avg warranty).`
        ),
      ].join("\n\n");

      const score = scoreSeoPost({
        title: cleanTitle,
        slug: row.slug,
        metaTitle: cleanMetaTitle,
        metaDesc: cleanMetaDesc,
        keyword: row.keyword,
        tldrAnswer: cleanTldr,
        contentMarkdown: compiledMarkdown,
        faqs: cleanFaqs,
        keyStats: cleanKeyStats,
        citations: bundle.citations,
        vendors: bundle.vendors,
        ymylDisclaimer: row.ymylDisclaimer,
        sponsorshipDisclosure: row.sponsorshipDisclosure,
        authorName: row.authorName,
        reviewerName: row.reviewerName,
      });

      const updatedRow = await prisma.seoPost.update({
        where: { id: row.id },
        data: {
          title: cleanTitle,
          metaTitle: cleanMetaTitle,
          metaDesc: cleanMetaDesc,
          tldrAnswer: cleanTldr,
          sectionsJson: JSON.stringify(cleanSections),
          faqJson: JSON.stringify(cleanFaqs),
          keyStatsJson: JSON.stringify(cleanKeyStats),
          contentMarkdown: compiledMarkdown,
          wordCount: score.wordCount,
          readingMinutes: Math.max(20, Math.round(score.wordCount / 220)),
          scoreJson: JSON.stringify(score),
        },
      });

      const updatedBundle = mapDbPostToBundle(updatedRow);
      if (updatedRow.status === "PUBLISHED") {
        const guidesDir = getGuidesStorageDir();
        const filePath = path.join(guidesDir, `${updatedRow.slug}.json`);
        const withSchema = {
          ...updatedBundle,
          schemaJsonLd: buildSchemaJsonLd({
            ...updatedBundle,
            sections: cleanSections,
            vendors: updatedBundle.vendors,
          }),
        };
        fs.writeFileSync(filePath, JSON.stringify(withSchema, null, 2), "utf8");
      }

      const qualityAudit = auditSeoPostQuality(updatedBundle);
      await logAdminAction(auth.actor.id, "SEO_AI_HUMANIZE_POST", "SeoPost", row.id, {
        engineUsed: humanPass.engineUsed,
        grade: qualityAudit.grade,
        pct: qualityAudit.pct,
      });

      return NextResponse.json({
        success: true,
        engineUsed: humanPass.engineUsed,
        post: { id: updatedRow.id, ...updatedBundle, qualityAudit },
      });
    }

    if (action === "APPEND_SECTION") {
      const result = await appendDeepSectionToPost(String(body.postId), body.customHeading, body.llmConfig);
      await logAdminAction(auth.actor.id, "SEO_APPEND_SECTION", "SeoPost", String(body.postId), result);
      return NextResponse.json({ success: true, ...result });
    }

    if (action === "REGEN_SECTION") {
      const { postId, sectionId, instruction } = body;
      const row = await prisma.seoPost.findUnique({ where: { id: String(postId) } });
      if (!row) return NextResponse.json({ error: "Post not found" }, { status: 404 });

      const sections: SeoSectionBlock[] = JSON.parse(row.sectionsJson || "[]");
      const target = sections.find((s) => s.id === sectionId);
      if (!target) return NextResponse.json({ error: "Section not found" }, { status: 404 });

      const catalog = await loadGroundedCatalog((row.targetGeo as SeoGeoTarget) || "GLOBAL");
      const res = await generateWithBestLlm(
        `Rewrite and expand this section to 550-750 words with practitioner clarity, concrete tables/bullets, and verified pricing data. Keep Markdown clean.`,
        `Article: "${row.title}" (${row.targetGeo}). Section Heading: "${target.heading}". Existing notes: ${target.markdown.slice(0, 600)}\nInstruction: ${instruction || "Improve E-E-A-T depth & clarity"}\nCatalog 20ft ₹${catalog.cabin20CostInr}, Canopy ₹${catalog.canopy75CostInr}.`,
        body.llmConfig
      );
      if (res.ok && countWords(res.text) >= 180) {
        target.markdown = res.text.replace(/^##\s+.*\n+/, "").trim();
        target.wordCount = countWords(target.markdown);
      } else {
        return NextResponse.json(
          { error: res.error || "Selected LLM unavailable or output too short to replace section." },
          { status: 503 }
        );
      }

      const compiledMarkdown = [
        `> **Quick Direct Answer (${row.targetGeo}):** ${row.tldrAnswer}\n\nExplore layouts interactively in the [MyPrefabRoom 3D Configurator](/) or browse regional planning guides in our [Prefab Guides Library](/guides).`,
        ...sections.map((s) => `## ${s.heading}\n\n${s.markdown}`),
        `## Methodology & Verified Engineering Data Sources\n\nAll base equipment pricing, freight formulas, crane mobilization tiers, insulation thermal deltas, and warranty benchmarks in this guide are audited against MyPrefabRoom's live partner rate database (${catalog.vendorCount} active fabricators, ${catalog.avgWarrantyYears}-year avg warranty).`,
      ].join("\n\n");

      const score = scoreSeoPost({
        title: row.title,
        slug: row.slug,
        metaTitle: row.metaTitle,
        metaDesc: row.metaDesc,
        keyword: row.keyword,
        tldrAnswer: row.tldrAnswer,
        contentMarkdown: compiledMarkdown,
        faqs: JSON.parse(row.faqJson || "[]"),
        keyStats: JSON.parse(row.keyStatsJson || "[]"),
        citations: JSON.parse(row.citationsJson || "[]"),
        ymylDisclaimer: row.ymylDisclaimer,
        authorName: row.authorName,
        reviewerName: row.reviewerName,
      });

      await prisma.seoPost.update({
        where: { id: row.id },
        data: {
          sectionsJson: JSON.stringify(sections),
          contentMarkdown: compiledMarkdown,
          wordCount: score.wordCount,
          readingMinutes: Math.max(20, Math.round(score.wordCount / 220)),
          scoreJson: JSON.stringify(score),
        },
      });
      return NextResponse.json({ success: true, wordCount: score.wordCount, scoreTotal: score.total });
    }

    // GENERATE or RUN_NEXT_QUEUED
    let topicRow: any = null;
    if (action === "RUN_NEXT_QUEUED") {
      topicRow = await prisma.seoTopicQueue.findFirst({
        where: { status: "QUEUED" },
        orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
      });
      if (!topicRow) {
        return NextResponse.json({ error: "No QUEUED topics left in Topic Queue." }, { status: 404 });
      }
    } else if (body.topicId) {
      topicRow = await prisma.seoTopicQueue.findUnique({ where: { id: String(body.topicId) } });
    }

    const keyword = String(topicRow?.keyword || body.keyword || "").trim();
    if (!keyword) {
      return NextResponse.json({ error: "Provide a keyword or select a queued topic." }, { status: 400 });
    }

    if (topicRow) {
      await prisma.seoTopicQueue.update({
        where: { id: topicRow.id },
        data: { status: "GENERATING", errorMsg: null },
      });
    }

    try {
      const result = await generateFullSeoArticle({
        keyword,
        slug: topicRow?.slug || body.slug,
        targetGeo: (topicRow?.targetGeo || body.targetGeo || "GLOBAL") as SeoGeoTarget,
        intent: (topicRow?.intent || body.intent || "COST") as SeoIntentType,
        clusterRole: (topicRow?.clusterRole || body.clusterRole || "PILLAR") as any,
        parentPillarSlug: topicRow?.parentPillarSlug || body.parentPillarSlug || null,
        linkedPresetCode: topicRow?.notes || body.linkedPresetCode || "terrace-room",
        minWords: Number(body.minWords) || 8500,
        authorName: body.authorName,
        authorRole: body.authorRole,
        llmConfig: body.llmConfig,
      });

      if (topicRow) {
        await prisma.seoTopicQueue.update({
          where: { id: topicRow.id },
          data: { status: "DONE", postId: result.postId, errorMsg: null },
        });
      }

      await logAdminAction(auth.actor.id, "SEO_GENERATE_5K", "SeoPost", result.postId, result);
      return NextResponse.json({ success: true, ...result });
    } catch (genErr: any) {
      if (topicRow) {
        await prisma.seoTopicQueue.update({
          where: { id: topicRow.id },
          data: { status: "FAILED", errorMsg: String(genErr?.message || genErr).slice(0, 240) },
        });
      }
      throw genErr;
    }
  } catch (error: any) {
    console.error("POST /api/admin/seo error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = await requireRole(["ADMIN"]);
    if (auth.error) return auth.error;

    const body = await req.json();
    const { id, ...updates } = body;
    if (!id) return NextResponse.json({ error: "Post id required" }, { status: 400 });

    const existing = await prisma.seoPost.findUnique({ where: { id: String(id) } });
    if (!existing) return NextResponse.json({ error: "Post not found" }, { status: 404 });

    const sections: SeoSectionBlock[] = updates.sections
      ? updates.sections
      : updates.sectionsJson
      ? JSON.parse(updates.sectionsJson)
      : JSON.parse(existing.sectionsJson || "[]");

    const updatedSections = sections.map((s) => ({
      ...s,
      wordCount: countWords(s.markdown),
    }));

    const tldrAnswer = updates.tldrAnswer !== undefined ? String(updates.tldrAnswer) : existing.tldrAnswer;
    const title = updates.title !== undefined ? String(updates.title) : existing.title;
    const metaTitle = updates.metaTitle !== undefined ? String(updates.metaTitle) : existing.metaTitle;
    const metaDesc = updates.metaDesc !== undefined ? String(updates.metaDesc) : existing.metaDesc;
    const ymylDisclaimer =
      updates.ymylDisclaimer !== undefined ? String(updates.ymylDisclaimer) : existing.ymylDisclaimer;
    const authorName = updates.authorName !== undefined ? String(updates.authorName) : existing.authorName;
    const authorRole = updates.authorRole !== undefined ? String(updates.authorRole) : existing.authorRole;
    const reviewerName =
      updates.reviewerName !== undefined ? String(updates.reviewerName).trim() || null : existing.reviewerName;
    const reviewerCreds =
      updates.reviewerCreds !== undefined ? String(updates.reviewerCreds).trim() || null : existing.reviewerCreds;
    const faqs = updates.faqs ? updates.faqs : JSON.parse(existing.faqJson || "[]");
    const keyStats = updates.keyStats ? updates.keyStats : JSON.parse(existing.keyStatsJson || "[]");
    const citations = updates.citations ? updates.citations : JSON.parse(existing.citationsJson || "[]");
    const vendors = updates.vendors ? updates.vendors : JSON.parse(existing.vendorSnapshotJson || "[]");
    const guideImages = updates.guideImages ? updates.guideImages : JSON.parse(existing.guideImagesJson || "[]");
    const sponsorshipDisclosure =
      updates.sponsorshipDisclosure !== undefined
        ? String(updates.sponsorshipDisclosure)
        : existing.sponsorshipDisclosure;
    const clusterRole = updates.clusterRole !== undefined ? String(updates.clusterRole) : existing.clusterRole;
    const parentPillarSlug =
      updates.parentPillarSlug !== undefined ? String(updates.parentPillarSlug).trim() || null : existing.parentPillarSlug;

    const compiledMarkdown = [
      `> **Direct Answer (${existing.targetGeo}):** ${tldrAnswer}\n\nExplore layouts interactively in the [MyPrefabRoom 3D Configurator](/) or browse regional planning guides in our [Prefab Guides Library](/guides).`,
      ...updatedSections.map((s) => `## ${s.heading}\n\n${s.markdown}`),
      `## Methodology & Verified Citations\n\nAll base equipment pricing, freight formulas, crane mobilization tiers, insulation thermal deltas, and warranty benchmarks in this guide are audited against MyPrefabRoom's live partner rate database.`,
    ].join("\n\n");

    const score = scoreSeoPost({
      title,
      slug: existing.slug,
      metaTitle,
      metaDesc,
      keyword: existing.keyword,
      tldrAnswer,
      contentMarkdown: compiledMarkdown,
      faqs,
      keyStats,
      citations,
      vendors,
      ymylDisclaimer,
      sponsorshipDisclosure,
      authorName,
      reviewerName,
    });

    const nextStatus = updates.status
      ? String(updates.status)
      : reviewerName && score.wordFloorOk
      ? "APPROVED"
      : existing.status;

    const updated = await prisma.seoPost.update({
      where: { id: existing.id },
      data: {
        title,
        metaTitle,
        metaDesc,
        clusterRole,
        parentPillarSlug,
        tldrAnswer,
        sectionsJson: JSON.stringify(updatedSections),
        contentMarkdown: compiledMarkdown,
        wordCount: score.wordCount,
        readingMinutes: Math.max(20, Math.round(score.wordCount / 220)),
        faqJson: JSON.stringify(faqs),
        guideImagesJson: JSON.stringify(guideImages),
        ymylDisclaimer,
        sponsorshipDisclosure,
        authorName,
        authorRole,
        reviewerName,
        reviewerCreds,
        reviewedAt: reviewerName ? existing.reviewedAt || new Date() : null,
        scoreJson: JSON.stringify(score),
        status: nextStatus,
      },
    });

    await logAdminAction(auth.actor.id, "SEO_HITL_UPDATE", "SeoPost", updated.id, {
      wordCount: score.wordCount,
      scoreTotal: score.total,
      status: nextStatus,
    });

    return NextResponse.json({ success: true, post: mapDbPostToBundle(updated), id: updated.id });
  } catch (error: any) {
    console.error("PATCH /api/admin/seo error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await requireRole(["ADMIN"]);
    if (auth.error) return auth.error;

    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    const type = url.searchParams.get("type") || "post";
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    if (type === "topic") {
      await prisma.seoTopicQueue.delete({ where: { id } });
      return NextResponse.json({ success: true });
    }

    await prisma.seoPost.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
