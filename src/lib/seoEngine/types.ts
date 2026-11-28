export type SeoGeoTarget = "GLOBAL" | "US" | "UK" | "AU" | "IN";
export type SeoIntentType = "COST" | "PERMIT" | "FINANCE" | "GUIDE" | "COMPARISON";
export type SeoClusterRole = "PILLAR" | "SPOKE_COST" | "SPOKE_VS" | "SPOKE_LOCAL" | "SPOKE_GUIDE";
export type SeoPostStatus = "DRAFT" | "HITL_REVIEW" | "APPROVED" | "PUBLISHED";

export type LlmProviderType =
  | "auto"
  | "ollama"
  | "nvidia_nim"
  | "gemini"
  | "openrouter"
  | "groq"
  | "deterministic";

export interface LlmRuntimeConfig {
  provider?: LlmProviderType;
  model?: string;
  apiKey?: string;
}

export interface SeoSectionBlock {
  id: string;
  heading: string;
  markdown: string;
  wordCount: number;
}

export interface SeoFaqItem {
  cluster?: string;
  question: string;
  answer: string;
}

export interface SeoKeyStat {
  label: string;
  value: string;
  context: string;
}

export interface SeoCitation {
  title: string;
  publisher: string;
  reference: string;
  year: string;
}

export interface SeoVendorSnapshot {
  vendorId: string;
  companyName: string;
  city: string;
  phone?: string | null;
  warrantyYears: number;
  leadDays: number;
  isSponsored: boolean;
  knockDownSupported: boolean;
  sellsRefurbished: boolean;
  refurbStockCount: number;
  cabin20PriceInr: number;
  cabin40PriceInr: number;
  bestSuitedFor: string;
}

export interface SeoGuideImage {
  url: string;
  alt: string;
  caption?: string;
}

export interface SeoScoreBreakdown {
  total: number;
  wordCount: number;
  wordFloorOk: boolean;
  eeat: number; // /25
  ymyl: number; // /20
  aeo: number;  // /20
  geo: number;  // /20
  seo: number;  // /15
  sectionCount?: number;
  faqCount?: number;
  reviewerSignedOff: boolean;
  readyToPublish: boolean;
  flags: string[];
}

export interface GeneratedSeoBundle {
  slug: string;
  title: string;
  metaTitle: string;
  metaDesc: string;
  targetGeo: SeoGeoTarget;
  keyword: string;
  intent: SeoIntentType;
  clusterRole: SeoClusterRole;
  parentPillarSlug: string | null;
  status: SeoPostStatus;
  tldrAnswer: string;
  sections: SeoSectionBlock[];
  contentMarkdown: string;
  wordCount: number;
  readingMinutes: number;
  faqs: SeoFaqItem[];
  keyStats: SeoKeyStat[];
  citations: SeoCitation[];
  vendors: SeoVendorSnapshot[];
  guideImages: SeoGuideImage[];
  ymylDisclaimer: string;
  sponsorshipDisclosure: string;
  priceVerifiedDate: string | null;
  authorName: string;
  authorRole: string;
  reviewerName: string | null;
  reviewerCreds: string | null;
  reviewedAt: string | null;
  linkedPresetCode: string | null;
  score: SeoScoreBreakdown;
  schemaJsonLd: Record<string, any>;
  pushedLiveAt?: string | null;
}
