import fs from "fs";
import path from "path";
import { prisma } from "@/lib/prisma";
import {
  GeneratedSeoBundle,
  SeoCitation,
  SeoFaqItem,
  SeoGuideImage,
  SeoKeyStat,
  SeoScoreBreakdown,
  SeoSectionBlock,
  SeoVendorSnapshot,
} from "./types";

const GUIDES_DIR = path.join(process.cwd(), "src", "content", "guides");

function safeParse<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function getGuidesStorageDir(): string {
  if (!fs.existsSync(GUIDES_DIR)) {
    fs.mkdirSync(GUIDES_DIR, { recursive: true });
  }
  return GUIDES_DIR;
}

export function buildSchemaJsonLd(bundle: {
  slug: string;
  title: string;
  metaDesc: string;
  keyword: string;
  authorName: string;
  authorRole: string;
  reviewerName: string | null;
  reviewerCreds: string | null;
  reviewedAt: string | null;
  faqs: SeoFaqItem[];
  vendors?: SeoVendorSnapshot[];
  guideImages?: SeoGuideImage[];
  wordCount: number;
  updatedAt?: string;
}): Record<string, any> {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://myprefabroom.com").replace(/\/$/, "");
  const pageUrl = `${siteUrl}/guides/${bundle.slug}`;
  const dateIso = bundle.updatedAt || new Date().toISOString();

  const articleNode: Record<string, any> = {
    "@type": "Article",
    "@id": `${pageUrl}#article`,
    mainEntityOfPage: pageUrl,
    headline: bundle.title,
    description: bundle.metaDesc,
    keywords: bundle.keyword,
    wordCount: bundle.wordCount,
    datePublished: dateIso,
    dateModified: dateIso,
    author: {
      "@type": "Person",
      name: bundle.authorName,
      jobTitle: bundle.authorRole,
    },
    publisher: {
      "@type": "Organization",
      "@id": `${siteUrl}#organization`,
      name: "MyPrefabRoom",
      url: siteUrl,
    },
  };

  if (bundle.reviewerName) {
    articleNode.reviewedBy = {
      "@type": "Person",
      name: bundle.reviewerName,
      description: bundle.reviewerCreds || "Structural & Modular Building Reviewer",
    };
  }

  if (bundle.guideImages && bundle.guideImages.length > 0) {
    articleNode.image = bundle.guideImages.map((img) => ({
      "@type": "ImageObject",
      url: img.url.startsWith("http") ? img.url : `${siteUrl}${img.url}`,
      caption: img.caption || img.alt,
    }));
  }

  const graph: any[] = [
    articleNode,
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
        { "@type": "ListItem", position: 2, name: "Guides", item: `${siteUrl}/guides` },
        { "@type": "ListItem", position: 3, name: bundle.title, item: pageUrl },
      ],
    },
  ];

  // Emit ItemList -> LocalBusiness ONLY from verified SQLite vendor fields (zero fabricated ratings/awards)
  if (bundle.vendors && bundle.vendors.length > 0) {
    graph.push({
      "@type": "ItemList",
      "@id": `${pageUrl}#providers`,
      name: `Verified Prefabricated Room Manufacturers Referenced in ${bundle.title}`,
      itemListElement: bundle.vendors.map((v, idx) => ({
        "@type": "ListItem",
        position: idx + 1,
        item: {
          "@type": "LocalBusiness",
          name: v.companyName,
          address: {
            "@type": "PostalAddress",
            addressLocality: v.city,
          },
          ...(v.phone ? { telephone: v.phone } : {}),
          knowsAbout: v.bestSuitedFor,
        },
      })),
    });
  }

  if (bundle.faqs.length > 0) {
    graph.push({
      "@type": "FAQPage",
      "@id": `${pageUrl}#faq`,
      mainEntity: bundle.faqs.map((f) => ({
        "@type": "Question",
        name: f.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: f.answer,
        },
      })),
    });
  }

  return {
    "@context": "https://schema.org",
    "@graph": graph,
  };
}

export function mapDbPostToBundle(row: any): GeneratedSeoBundle {
  const sections = safeParse<SeoSectionBlock[]>(row.sectionsJson, []);
  const faqs = safeParse<SeoFaqItem[]>(row.faqJson, []);
  const keyStats = safeParse<SeoKeyStat[]>(row.keyStatsJson, []);
  const citations = safeParse<SeoCitation[]>(row.citationsJson, []);
  const vendors = safeParse<SeoVendorSnapshot[]>(row.vendorSnapshotJson, []);
  const guideImages = safeParse<SeoGuideImage[]>(row.guideImagesJson, []);
  const score = safeParse<SeoScoreBreakdown>(row.scoreJson, {
    total: 0,
    wordCount: row.wordCount || 0,
    wordFloorOk: (row.wordCount || 0) >= 5000,
    eeat: 0,
    ymyl: 0,
    aeo: 0,
    geo: 0,
    seo: 0,
    reviewerSignedOff: Boolean(row.reviewerName),
    readyToPublish: false,
    flags: [],
  });

  const reviewedIso = row.reviewedAt ? new Date(row.reviewedAt).toISOString() : null;
  const pushedIso = row.pushedLiveAt ? new Date(row.pushedLiveAt).toISOString() : null;

  return {
    slug: row.slug,
    title: row.title,
    metaTitle: row.metaTitle,
    metaDesc: row.metaDesc,
    targetGeo: row.targetGeo,
    keyword: row.keyword,
    intent: row.intent,
    clusterRole: row.clusterRole || "PILLAR",
    parentPillarSlug: row.parentPillarSlug || null,
    status: row.status,
    tldrAnswer: row.tldrAnswer,
    sections,
    contentMarkdown: row.contentMarkdown,
    wordCount: row.wordCount,
    readingMinutes: row.readingMinutes,
    faqs,
    keyStats,
    citations,
    vendors,
    guideImages,
    ymylDisclaimer: row.ymylDisclaimer,
    sponsorshipDisclosure:
      row.sponsorshipDisclosure ||
      "Evaluation methodology scores verified fabricators on specs, delivery options, and warranty. Sponsored listings are labeled separately.",
    priceVerifiedDate: row.priceVerifiedDate || null,
    authorName: row.authorName,
    authorRole: row.authorRole,
    reviewerName: row.reviewerName || null,
    reviewerCreds: row.reviewerCreds || null,
    reviewedAt: reviewedIso,
    linkedPresetCode: row.linkedPresetCode || null,
    score,
    pushedLiveAt: pushedIso,
    schemaJsonLd: buildSchemaJsonLd({
      slug: row.slug,
      title: row.title,
      metaDesc: row.metaDesc,
      keyword: row.keyword,
      authorName: row.authorName,
      authorRole: row.authorRole,
      reviewerName: row.reviewerName || null,
      reviewerCreds: row.reviewerCreds || null,
      reviewedAt: reviewedIso,
      faqs,
      vendors,
      guideImages,
      wordCount: row.wordCount,
      updatedAt: row.updatedAt ? new Date(row.updatedAt).toISOString() : undefined,
    }),
  };
}

export async function listPublishedGuides(geoFilter?: string): Promise<GeneratedSeoBundle[]> {
  const map = new Map<string, GeneratedSeoBundle>();

  try {
    const dir = getGuidesStorageDir();
    const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json"));
    for (const file of files) {
      const raw = fs.readFileSync(path.join(dir, file), "utf8");
      const parsed = safeParse<GeneratedSeoBundle | null>(raw, null);
      if (parsed && parsed.slug && parsed.status === "PUBLISHED") {
        map.set(parsed.slug, parsed);
      }
    }
  } catch {
    // Graceful skip if directory unavailable
  }

  try {
    const dbRows = await prisma.seoPost.findMany({
      where: { status: "PUBLISHED" },
      orderBy: [{ pushedLiveAt: "desc" }, { updatedAt: "desc" }],
    });
    for (const row of dbRows) {
      if (!map.has(row.slug)) {
        map.set(row.slug, mapDbPostToBundle(row));
      }
    }
  } catch {
    // Graceful skip on static/edge read
  }

  let items = Array.from(map.values());
  if (geoFilter && geoFilter !== "ALL") {
    items = items.filter((g) => g.targetGeo === geoFilter.toUpperCase());
  }

  items.sort((a, b) => {
    const da = new Date(a.pushedLiveAt || a.reviewedAt || 0).getTime();
    const db = new Date(b.pushedLiveAt || b.reviewedAt || 0).getTime();
    return db - da;
  });

  return items;
}

export async function getPublishedGuideBySlug(slug: string): Promise<GeneratedSeoBundle | null> {
  const cleanSlug = slug.replace(/[^a-z0-9-]/gi, "").toLowerCase();
  const filePath = path.join(getGuidesStorageDir(), `${cleanSlug}.json`);

  if (fs.existsSync(filePath)) {
    const parsed = safeParse<GeneratedSeoBundle | null>(fs.readFileSync(filePath, "utf8"), null);
    if (parsed && parsed.status === "PUBLISHED") return parsed;
  }

  try {
    const row = await prisma.seoPost.findUnique({ where: { slug: cleanSlug } });
    if (row && row.status === "PUBLISHED") {
      return mapDbPostToBundle(row);
    }
  } catch {
    return null;
  }

  return null;
}

export async function getRelatedClusterGuides(
  current: GeneratedSeoBundle,
  limit = 4
): Promise<GeneratedSeoBundle[]> {
  const all = await listPublishedGuides();
  const others = all.filter((g) => g.slug !== current.slug);
  const prioritized = others.sort((a, b) => {
    const scoreA =
      (a.slug === current.parentPillarSlug ? 10 : 0) +
      (a.parentPillarSlug === current.slug ? 8 : 0) +
      (a.parentPillarSlug && a.parentPillarSlug === current.parentPillarSlug ? 5 : 0) +
      (a.targetGeo === current.targetGeo ? 3 : 0);
    const scoreB =
      (b.slug === current.parentPillarSlug ? 10 : 0) +
      (b.parentPillarSlug === current.slug ? 8 : 0) +
      (b.parentPillarSlug && b.parentPillarSlug === current.parentPillarSlug ? 5 : 0) +
      (b.targetGeo === current.targetGeo ? 3 : 0);
    return scoreB - scoreA;
  });
  return prioritized.slice(0, limit);
}
