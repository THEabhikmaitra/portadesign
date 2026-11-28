import { SeoCitation, SeoFaqItem, SeoKeyStat, SeoScoreBreakdown, SeoVendorSnapshot } from "./types";

export function countWords(text: string): number {
  const cleaned = String(text || "")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/[#>*`|_\[\]()]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned) return 0;
  return cleaned.split(" ").filter(Boolean).length;
}

export function slugifySeo(input: string): string {
  return String(input || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export interface ScoreInput {
  title: string;
  slug: string;
  metaTitle: string;
  metaDesc: string;
  keyword: string;
  tldrAnswer: string;
  contentMarkdown: string;
  faqs: SeoFaqItem[];
  keyStats: SeoKeyStat[];
  citations: SeoCitation[];
  vendors?: SeoVendorSnapshot[];
  ymylDisclaimer: string;
  sponsorshipDisclosure?: string;
  authorName: string;
  reviewerName: string | null;
}

export function scoreSeoPost(input: ScoreInput): SeoScoreBreakdown {
  const flags: string[] = [];
  const fullBody = [
    input.tldrAnswer,
    input.contentMarkdown,
    ...input.faqs.map((f) => `${f.question} ${f.answer}`),
  ].join("\n\n");

  const wordCount = countWords(fullBody);
  const wordFloorOk = wordCount >= 5000;
  if (!wordFloorOk) {
    flags.push(`Word count ${wordCount} is below 5,000-word floor — run Append Deep Section before pushing live.`);
  }

  // 1. E-E-A-T (/25)
  let eeat = 0;
  if (input.authorName.trim().length > 2) eeat += 4;
  else flags.push("E-E-A-T: Missing named Author.");

  const reviewerSignedOff = Boolean(input.reviewerName && input.reviewerName.trim().length > 2);
  if (reviewerSignedOff) eeat += 7;
  else flags.push("HITL E-E-A-T Required: Assign technical reviewer sign-off before Push to Live.");

  if (input.citations.length >= 4) eeat += 5;
  else if (input.citations.length >= 2) eeat += 3;
  else flags.push("E-E-A-T: Add at least 4 authoritative code/government citations.");

  if ((input.sponsorshipDisclosure || "").trim().length >= 30) eeat += 4;
  else flags.push("E-E-A-T: Missing transparent Sponsorship & Ranking Disclosure.");

  if ((input.vendors?.length || 0) >= 2) eeat += 5;
  else eeat += 2;

  // 2. YMYL (/20)
  let ymyl = 0;
  if (input.ymylDisclaimer.trim().length >= 80) ymyl += 8;
  else flags.push("YMYL: Structural / zoning / financing disclaimer too short.");

  if (/permit|zoning|municipal|planning|code/i.test(input.contentMarkdown)) ymyl += 4;
  else flags.push("YMYL: Missing regional permit/zoning verification guidance.");

  if (/load|engineer|wind|structural|foundation|slab/i.test(input.contentMarkdown)) ymyl += 4;
  if (/loan|tax|financing|gst|budget|insurance/i.test(input.contentMarkdown)) ymyl += 4;

  // 3. AEO (/20)
  let aeo = 0;
  const tldrWords = countWords(input.tldrAnswer);
  if (tldrWords >= 35 && tldrWords <= 95) aeo += 6;
  else {
    aeo += 3;
    flags.push(`AEO: TL;DR direct answer is ${tldrWords}w (target 40-80w for featured snippets).`);
  }
  if (input.faqs.length >= 40) aeo += 10;
  else if (input.faqs.length >= 12) aeo += 7;
  else {
    aeo += Math.min(5, input.faqs.length);
    flags.push(`AEO: Only ${input.faqs.length} FAQs (authority target >= 40 clustered AEO queries).`);
  }
  const h2Questions = (input.contentMarkdown.match(/^##\s+.*\?/gm) || []).length;
  if (h2Questions >= 3) aeo += 4;

  // 4. GEO (/20)
  let geo = 0;
  if (input.keyStats.length >= 6) geo += 6;
  else {
    geo += Math.min(4, input.keyStats.length);
    flags.push("GEO: Needs >= 6 verifiable key statistics for AI citation.");
  }
  const tableCount = (input.contentMarkdown.match(/^\|[^\n]+\|\s*\n\|[\s:-]+\|/gm) || []).length;
  if (tableCount >= 6) geo += 8;
  else if (tableCount >= 3) geo += 6;
  else {
    geo += tableCount * 2;
    flags.push("GEO: Include >= 4 structured Markdown comparison tables.");
  }
  if (wordCount >= 8500) geo += 6;
  else if (wordCount >= 5000) geo += 4;

  // 5. On-Page SEO (/15)
  let seo = 0;
  const kw = input.keyword.toLowerCase().trim();
  if (kw && (input.title.toLowerCase().includes(kw) || input.metaTitle.toLowerCase().includes(kw))) seo += 4;
  else if (kw.split(" ").some((w) => w.length > 3 && input.title.toLowerCase().includes(w))) seo += 3;
  else flags.push("SEO: Exact keyword missing from Title / Meta Title.");

  if (input.metaDesc.length >= 110 && input.metaDesc.length <= 165) seo += 3;
  else seo += 1;

  const h2Count = (input.contentMarkdown.match(/^##\s+/gm) || []).length;
  if (h2Count >= 18) seo += 4;
  else if (h2Count >= 12) seo += 3;
  else {
    seo += 1;
    flags.push(`SEO: Found ${h2Count} H2 chapters (target 18–20 for pillar authority).`);
  }

  const has3dLink = /\[.*\]\(\/.*\)/.test(input.contentMarkdown);
  if (has3dLink) seo += 4;
  else flags.push("SEO: Missing internal links to / (3D Designer) and /guides.");

  const total = Math.min(100, eeat + ymyl + aeo + geo + seo);
  const readyToPublish = wordFloorOk && reviewerSignedOff && total >= 80;

  return {
    total,
    wordCount,
    wordFloorOk,
    eeat,
    ymyl,
    aeo,
    geo,
    seo,
    sectionCount: h2Count,
    faqCount: input.faqs.length,
    reviewerSignedOff,
    readyToPublish,
    flags,
  };
}
