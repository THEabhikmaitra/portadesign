import {
  SeoCitation,
  SeoFaqItem,
  SeoKeyStat,
  SeoSectionBlock,
  SeoVendorSnapshot,
} from "./types";

export interface QualityAuditCheck {
  category: string;
  check: string;
  status: "PASS" | "WARN" | "FAIL";
  detail: string;
  score: number;
  maxScore: number;
}

export interface QualityAuditCategorySummary {
  category: string;
  score: number;
  maxScore: number;
  pct: number;
}

export interface ContentQualityAuditReport {
  totalScore: number;
  maxScore: number;
  pct: number;
  grade: "A" | "B" | "C" | "D" | "F";
  categories: QualityAuditCategorySummary[];
  checks: QualityAuditCheck[];
  topFixes: QualityAuditCheck[];
}

export interface QualityAuditInput {
  title: string;
  metaTitle: string;
  metaDesc: string;
  keyword: string;
  tldrAnswer: string;
  contentMarkdown: string;
  sections: SeoSectionBlock[];
  faqs: SeoFaqItem[];
  keyStats: SeoKeyStat[];
  citations: SeoCitation[];
  vendors: SeoVendorSnapshot[];
  ymylDisclaimer: string;
  sponsorshipDisclosure: string;
  priceVerifiedDate: string | null;
  authorName: string;
  reviewerName: string | null;
  reviewerCreds: string | null;
  reviewedAt: string | null;
}

function words(s: string): string[] {
  return String(s || "")
    .replace(/[#>*`|_\[\]()]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean);
}

function sentences(s: string): string[] {
  return String(s || "")
    .split(/(?<=[.!?])\s+/)
    .filter((b) => b.trim().length > 10);
}

function count(s: string, re: RegExp): number {
  return (String(s || "").match(re) || []).length;
}

export function auditSeoPostQuality(input: QualityAuditInput): ContentQualityAuditReport {
  const md = input.contentMarkdown || "";
  const tldr = input.tldrAnswer || "";
  const full = `${tldr}\n\n${md}`;
  const faqs = input.faqs || [];
  const sections = input.sections || [];

  const checks: QualityAuditCheck[] = [];
  const add = (
    category: string,
    check: string,
    val: boolean | "warn",
    detail: string,
    score: number,
    maxScore: number
  ) => {
    checks.push({
      category,
      check,
      status: val === true ? "PASS" : val === "warn" ? "WARN" : "FAIL",
      detail,
      score: val === true ? score : val === "warn" ? Math.round(score * 0.6) : 0,
      maxScore,
    });
  };

  // 1. Structure
  const totalWords = words(full).length;
  add("Structure", "Prose word count >=5,000", totalWords >= 5000, `${totalWords.toLocaleString()} words`, 10, 10);
  add("Structure", "Prose word count >=8,500 (pillar)", totalWords >= 8500, `${totalWords.toLocaleString()} words`, 8, 8);
  add("Structure", "Sections >=15", sections.length >= 15, `${sections.length} sections`, 8, 8);
  add("Structure", "Sections >=20 (full blueprint)", sections.length >= 20, `${sections.length} sections`, 5, 5);
  const h2count = count(md, /^## /gm);
  add("Structure", "H2 headings >=15", h2count >= 15, `${h2count} H2 headings`, 6, 6);
  const tableCount = count(md, /^\|[^\n]+\|\s*\n\|[\s:-]+\|/gm);
  add("Structure", "Comparison tables >=6", tableCount >= 6, `${tableCount} tables`, 6, 6);
  const hasIntro = /what is|introduction|overview/i.test(md);
  const hasVerdict = /verdict|bottom line|worth it|choosing/i.test(md);
  add("Structure", "Intro + verdict sections", hasIntro && hasVerdict, `Intro: ${hasIntro}, Verdict: ${hasVerdict}`, 4, 4);
  const internalLinks = count(md, /\[.*?\]\(\/[^)]+\)/g);
  add("Structure", "Internal links >=3", internalLinks >= 3, `${internalLinks} internal links`, 5, 5);

  // 2. Readability
  const sents = sentences(full);
  const totalSents = sents.length;
  const avgSentLen = totalSents
    ? Math.round(sents.map((sen) => words(sen).length).reduce((a, b) => a + b, 0) / totalSents)
    : 0;
  add(
    "Readability",
    "Avg sentence length <=22 words",
    avgSentLen <= 22,
    `Avg: ${avgSentLen} words/sentence`,
    avgSentLen <= 20 ? 10 : avgSentLen <= 22 ? 8 : 0,
    10
  );

  const passiveCount =
    count(full, /\b(is|are|was|were|be|been|being)\s+([\w]+ed)\b/gi) +
    count(full, /\b(it is|it was|there is|there are)\b/gi);
  const passivePct = totalSents ? Math.round((passiveCount / totalSents) * 100) : 0;
  add(
    "Readability",
    "Passive voice <15%",
    passivePct < 15,
    `${passivePct}% passive (${passiveCount}/${totalSents})`,
    passivePct < 10 ? 8 : passivePct < 15 ? 5 : 0,
    8
  );

  const transitionCount = count(
    full,
    /\b(however|therefore|furthermore|additionally|consequently|in contrast|on the other hand|for example|specifically|notably|importantly|meanwhile|ultimately|in summary)\b/gi
  );
  add("Readability", "Transition words >=20", transitionCount >= 20, `${transitionCount} transitions`, 6, 6);

  const shortSents = sents.filter((s) => words(s).length <= 10).length;
  const shortPct = totalSents ? Math.round((shortSents / totalSents) * 100) : 0;
  add(
    "Readability",
    "Short sentences (<=10w) >=10%",
    shortPct >= 10 ? true : shortPct >= 5 ? "warn" : false,
    `${shortPct}% short (${shortSents}/${totalSents})`,
    5,
    5
  );

  // 3. AI Detection Risk & Typography Tells
  const sectionsWithTable = sections.filter((s) => (s.markdown || "").includes("|---")).length;
  const tableUniformPct = sections.length ? Math.round((sectionsWithTable / sections.length) * 100) : 0;
  add(
    "AI Risk",
    "Section layout variety (tables <=50%)",
    tableUniformPct <= 50,
    `${tableUniformPct}% sections have tables`,
    tableUniformPct <= 40 ? 8 : tableUniformPct <= 55 ? 4 : 0,
    8
  );

  const fillerCount =
    count(full, /\bit is (important|worth noting|crucial|essential) to\b/gi) +
    count(full, /\bit is recommended\b/gi) +
    count(full, /\bone should\b/gi) +
    count(full, /\bit should be noted\b/gi) +
    count(full, /\bplease note\b/gi) +
    count(full, /\bdue to the fact that\b/gi) +
    count(full, /\bin order to\b/gi) +
    count(full, /\bthat being said\b/gi);
  add(
    "AI Risk",
    "Zero/low AI filler phrases (<8)",
    fillerCount < 8,
    `${fillerCount} filler phrases`,
    fillerCount < 4 ? 10 : fillerCount < 8 ? 6 : 0,
    10
  );

  const firstPersonCount = count(
    full,
    /\b(we (found|tested|measured|visited|recommend|noticed|audited)|our (team|research|testing|recommendation)|in our (experience|testing))\b/gi
  );
  add(
    "AI Risk",
    "First-person authority voice (>=3)",
    firstPersonCount >= 3 ? true : firstPersonCount >= 1 ? "warn" : false,
    `${firstPersonCount} authority phrases`,
    firstPersonCount >= 5 ? 10 : firstPersonCount >= 3 ? 7 : 6,
    10
  );

  const contractionCount = count(
    full,
    /\b(don't|can't|won't|it's|you'll|you're|we're|isn't|aren't|that's|here's|let's|they're|didn't|doesn't|couldn't|wouldn't|shouldn't)\b/gi
  );
  add(
    "AI Risk",
    "Natural contractions (>=10)",
    contractionCount >= 10 ? true : contractionCount >= 5 ? "warn" : false,
    `${contractionCount} contractions`,
    contractionCount >= 15 ? 8 : contractionCount >= 10 ? 6 : 5,
    8
  );

  const opinionCount = count(
    full,
    /\b(honestly|frankly|in truth|the reality is|our take|bluntly|surprisingly|contrary to|worth noting|the bottom line)\b/gi
  );
  add(
    "AI Risk",
    "Editorial opinions (>=3)",
    opinionCount >= 3 ? true : opinionCount >= 1 ? "warn" : false,
    `${opinionCount} opinionated phrases`,
    opinionCount >= 5 ? 8 : opinionCount >= 3 ? 5 : 4,
    8
  );

  const allTextForTells = [
    input.title,
    input.metaTitle,
    input.metaDesc,
    tldr,
    md,
    ...faqs.map((f) => `${f.question} ${f.answer}`),
  ].join("\n");

  const emDashCount = count(allTextForTells, /\u2014/g);
  const enDashCount = count(allTextForTells, /\u2013/g);
  const arrowCount = count(allTextForTells, /[\u2190-\u2193\u21d0-\u21d3]/g);
  add(
    "AI Risk",
    "Zero big hyphens (—/–) & arrows (→)",
    emDashCount === 0 && enDashCount === 0 && arrowCount === 0,
    `em-dash: ${emDashCount}, en-dash: ${enDashCount}, arrows: ${arrowCount}`,
    8,
    8
  );

  const aiIconCount =
    count(allTextForTells, /[\u2605\u2606\u2705\u2713\u2717\u274c\u26a0]/g) +
    count(allTextForTells, /[\uD83C-\uDBFF][\uDC00-\uDFFF]/g);
  add(
    "AI Risk",
    "Zero AI icons / stars / emojis",
    aiIconCount === 0,
    `${aiIconCount} AI icons/emojis`,
    8,
    8
  );

  const hrLineCount =
    count(md, /^\s*([-*_]){3,}\s*$/gm) + count(md, /<hr\s*\/?>/gi);
  add(
    "AI Risk",
    "Zero HR divider lines (---)",
    hrLineCount === 0,
    `${hrLineCount} HR lines`,
    6,
    6
  );

  // 4. E-E-A-T
  add("E-E-A-T", "Named author", (input.authorName || "").trim().length > 2, `Author: ${input.authorName || "none"}`, 8, 8);
  add("E-E-A-T", "Named technical reviewer", Boolean(input.reviewerName && input.reviewerName.trim().length > 2), `Reviewer: ${input.reviewerName || "pending"}`, 8, 8);
  add("E-E-A-T", "Reviewer credentials & date", Boolean(input.reviewerCreds && input.reviewedAt), input.reviewedAt ? `Reviewed ${input.reviewedAt.slice(0, 10)}` : "Missing review sign-off", 6, 6);
  add("E-E-A-T", "Authoritative citations >=4", (input.citations || []).length >= 4, `${(input.citations || []).length} citations`, 8, 8);
  add("E-E-A-T", "YMYL disclaimer >=80 chars", (input.ymylDisclaimer || "").trim().length >= 80, `${(input.ymylDisclaimer || "").length} chars`, 6, 6);
  add("E-E-A-T", "Sponsorship disclosure", (input.sponsorshipDisclosure || "").trim().length >= 30, `${(input.sponsorshipDisclosure || "").length} chars`, 5, 5);
  add("E-E-A-T", "Price verified date", Boolean(input.priceVerifiedDate), input.priceVerifiedDate || "missing", 4, 4);

  // 5. SEO & AEO
  const kwTokens = (input.keyword || "").toLowerCase().trim().split(/\s+/).slice(0, 3).join(" ");
  add("SEO & AEO", "Keyword in meta title", Boolean(kwTokens && (input.metaTitle || "").toLowerCase().includes(kwTokens)), input.metaTitle || "", 6, 6);
  const mdLen = (input.metaDesc || "").length;
  add("SEO & AEO", "Meta desc 110-165 chars", mdLen >= 110 && mdLen <= 165, `${mdLen} chars`, 5, 5);
  add("SEO & AEO", "FAQs >=50", faqs.length >= 50, `${faqs.length} FAQs`, 8, 8);
  add("SEO & AEO", "FAQs >=100 (authority bank)", faqs.length >= 100, `${faqs.length} FAQs`, 5, 5);
  const tldrLen = words(tldr).length;
  add("SEO & AEO", "TL;DR direct answer 40-80 words", tldrLen >= 40 && tldrLen <= 80, `${tldrLen} words`, 6, 6);
  add("SEO & AEO", "Key stats >=6", (input.keyStats || []).length >= 6, `${(input.keyStats || []).length} stats`, 6, 6);

  // 6. Content Diversity
  add("Diversity", "Bullet lists >=20", count(md, /^- /gm) >= 20, `${count(md, /^- /gm)} bullets`, 4, 4);
  add("Diversity", "Numbered lists >=5", count(md, /^\d+\. /gm) >= 5, `${count(md, /^\d+\. /gm)} numbered`, 3, 3);
  add("Diversity", "Vendor profiles >=3", (input.vendors || []).length >= 3, `${(input.vendors || []).length} vendors`, 5, 5);
  const priceMentions = count(full, /(₹|\$|£|A\$)[\d,.]+\s*(lakh|crore|k|L)?/gi);
  add("Diversity", "Grounded price points >=20", priceMentions >= 20, `${priceMentions} price points`, 7, 7);

  // Aggregate
  const catMap = new Map<string, { score: number; maxScore: number }>();
  for (const c of checks) {
    const cur = catMap.get(c.category) || { score: 0, maxScore: 0 };
    cur.score += c.score;
    cur.maxScore += c.maxScore;
    catMap.set(c.category, cur);
  }
  const categories: QualityAuditCategorySummary[] = Array.from(catMap.entries()).map(([category, v]) => ({
    category,
    score: v.score,
    maxScore: v.maxScore,
    pct: v.maxScore ? Math.round((v.score / v.maxScore) * 100) : 100,
  }));

  const totalScore = checks.reduce((s, c) => s + c.score, 0);
  const maxScore = checks.reduce((s, c) => s + c.maxScore, 0);
  const pct = maxScore ? Math.round((totalScore / maxScore) * 100) : 100;
  const grade: ContentQualityAuditReport["grade"] =
    pct >= 90 ? "A" : pct >= 80 ? "B" : pct >= 70 ? "C" : pct >= 60 ? "D" : "F";

  const topFixes = checks
    .filter((c) => c.status !== "PASS")
    .sort((a, b) => b.maxScore - b.score - (a.maxScore - a.score));

  return { totalScore, maxScore, pct, grade, categories, checks, topFixes };
}
