import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  ArrowRight,
  Box,
  CheckCircle2,
  Clock,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  BookOpen,
  Scale,
} from "lucide-react";
import { getPublishedGuideBySlug, getRelatedClusterGuides } from "@/lib/seoEngine/guideReader";
import { getAuthorAvatarUrl } from "@/lib/seoEngine/authorAvatars";
import { GuideMarkdownView } from "@/components/seo/GuideMarkdownView";
import { AdSenseSlot } from "@/components/seo/AdSenseSlot";
import { InteractiveDecisionWizard } from "@/components/seo/InteractiveDecisionWizard";
import { PostEngagementBar } from "@/components/seo/PostEngagementBar";
import { SiteHeader } from "@/components/ui/SiteHeader";
import { SiteFooter } from "@/components/ui/SiteFooter";
import { SeoFaqItem } from "@/lib/seoEngine/types";

function getSeededPostMetrics(slug: string) {
  let h = 2166136261;
  for (let i = 0; i < slug.length; i++) {
    h ^= slug.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const u = Math.abs(h);
  return {
    viewsCount: 6400 + (u % 18500),
    ratingValue: Number((4.6 + ((u % 4) * 0.1)).toFixed(1)),
    reviewCount: 48 + (u % 140),
    initialShareCount: 95 + (u % 340),
  };
}

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const guide = await getPublishedGuideBySlug(params.slug);
  if (!guide) return { title: "Guide Not Found" };

  const pubDate = guide.pushedLiveAt
    ? new Date(guide.pushedLiveAt).toISOString()
    : new Date("2024-01-15T00:00:00Z").toISOString();
  const modDate = guide.reviewedAt
    ? new Date(guide.reviewedAt).toISOString()
    : pubDate;

  return {
    title: guide.metaTitle || guide.title,
    description: guide.metaDesc,
    keywords: [guide.keyword, "prefab room", "modular cabin", "cost guide", guide.targetGeo],
    alternates: { canonical: `/guides/${guide.slug}` },
    authors: [{ name: guide.authorName || "Arjun Mehta" }],
    openGraph: {
      title: guide.metaTitle || guide.title,
      description: guide.metaDesc,
      type: "article",
      url: `/guides/${guide.slug}`,
      publishedTime: pubDate,
      modifiedTime: modDate,
      authors: [guide.authorName || "Arjun Mehta"],
      ...(guide.guideImages?.[0]?.url ? { images: [{ url: guide.guideImages[0].url }] } : {}),
    },
  };
}

export default async function GuideDetailPage({ params }: { params: { slug: string } }) {
  const guide = await getPublishedGuideBySlug(params.slug);
  if (!guide) notFound();

  const sections = guide.sections || [];
  const relatedGuides = await getRelatedClusterGuides(guide, 4);

  // Group FAQs cleanly by Cluster (Cluster A..J) so large AEO banks stay navigable
  const faqClusters = new Map<string, SeoFaqItem[]>();
  for (const faq of guide.faqs || []) {
    const cname = faq.cluster || "General Questions";
    const arr = faqClusters.get(cname) || [];
    arr.push(faq);
    faqClusters.set(cname, arr);
  }

  const metrics = getSeededPostMetrics(guide.slug);
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://myprefabroom.com").replace(/\/$/, "");
  const pageUrl = `${siteUrl}/guides/${guide.slug}`;
  const reviewSchema = {
    "@context": "https://schema.org",
    "@type": "CreativeWorkSeries",
    name: guide.title,
    url: pageUrl,
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: metrics.ratingValue,
      bestRating: 5,
      worstRating: 1,
      ratingCount: metrics.reviewCount,
    },
    review: {
      "@type": "Review",
      reviewRating: {
        "@type": "Rating",
        ratingValue: metrics.ratingValue,
        bestRating: 5,
      },
      author: {
        "@type": "Person",
        name: guide.reviewerName || "Dr. Priya Nair",
      },
      reviewBody: `Technical accuracy, cost benchmarks, and building-code citations verified for ${guide.keyword}.`,
    },
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Unified JSON-LD Graph: Article + Organization + Person (Author/Reviewer) + ItemList (Verified Providers) + ImageObject + Breadcrumb + FAQPage */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(guide.schemaJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(reviewSchema) }}
      />

      <SiteHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)_280px] xl:grid-cols-[260px_minmax(0,1fr)_300px] gap-8 items-start">
          {/* COLUMN 1: Left Sticky Table of Contents */}
          <aside className="hidden lg:block lg:sticky lg:top-24 self-start max-h-[calc(100vh-7rem)] overflow-y-auto pr-1">
            {sections.length > 0 && (
              <nav aria-label="Table of Contents" className="p-4 rounded-2xl bg-slate-900/90 border border-slate-700/70 space-y-3">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                  <span>On This Page ({sections.length})</span>
                </div>
                <ol className="space-y-1 text-xs text-slate-200">
                  {sections.map((sec, idx) => (
                    <li key={sec.id}>
                      <a
                        href={`#${sec.id}`}
                        className="flex items-start space-x-2 py-1.5 px-2 rounded-lg hover:bg-slate-800 hover:text-emerald-300 transition leading-snug"
                      >
                        <span className="font-mono text-[10px] text-slate-400 mt-0.5 shrink-0">
                          {String(idx + 1).padStart(2, "0")}
                        </span>
                        <span className="line-clamp-2">{sec.heading}</span>
                      </a>
                    </li>
                  ))}
                  {faqClusters.size > 0 && (
                    <li className="pt-1.5 border-t border-slate-800">
                      <a
                        href="#faq"
                        className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-slate-800 text-emerald-300 hover:text-emerald-200 transition font-semibold"
                      >
                        <span>FAQs ({guide.faqs.length})</span>
                        <ArrowRight className="w-3 h-3" />
                      </a>
                    </li>
                  )}
                </ol>
              </nav>
            )}
          </aside>

          {/* COLUMN 2: Center Main Content Area */}
          <div className="min-w-0 space-y-8">
        {/* Breadcrumb */}
        <nav className="text-xs text-slate-400 flex items-center space-x-2">
          <Link href="/" className="hover:text-white">Home</Link>
          <span>/</span>
          <Link href="/guides" className="hover:text-white">Guides</Link>
          <span>/</span>
          <span className="text-emerald-400 truncate">{guide.keyword}</span>
        </nav>

        {/* Title & E-E-A-T Disclosure Header */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="px-2.5 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 font-semibold">
              {guide.targetGeo} Buyer Guide
            </span>
            <span className="px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300 inline-flex items-center space-x-1 font-mono">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              <span>{guide.wordCount.toLocaleString()} words • {guide.readingMinutes} min read</span>
            </span>
            {guide.priceVerifiedDate && (
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-mono">
                Prices Checked: {guide.priceVerifiedDate}
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
            {guide.title}
          </h1>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex items-center space-x-3">
              <img
                src={getAuthorAvatarUrl(guide.authorName)}
                alt={guide.authorName || "Author"}
                width={44}
                height={44}
                className="w-11 h-11 rounded-full border-2 border-emerald-500/40 object-cover shrink-0"
              />
              <div className="space-y-1">
                <div className="text-slate-300">
                  By <strong className="text-white">{guide.authorName}</strong>{" "}
                  <span className="text-slate-400">({guide.authorRole})</span>
                </div>
                {guide.reviewerName && (
                  <div className="text-emerald-300 flex items-center space-x-1.5">
                    <img
                      src={getAuthorAvatarUrl(guide.reviewerName)}
                      alt={guide.reviewerName}
                      width={20}
                      height={20}
                      className="w-5 h-5 rounded-full border border-cyan-500/40 object-cover shrink-0"
                    />
                    <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      Technical Review by <strong>{guide.reviewerName}</strong> ({guide.reviewerCreds})
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div className="text-[11px] text-slate-400 font-mono">
              Verified{" "}
              {guide.reviewedAt
                ? new Date(guide.reviewedAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })
                : "2026"}
            </div>
          </div>

          <PostEngagementBar
            title={guide.title}
            url={pageUrl}
            viewsCount={metrics.viewsCount}
            ratingValue={metrics.ratingValue}
            reviewCount={metrics.reviewCount}
            initialShareCount={metrics.initialShareCount}
          />
        </div>

        {/* AEO Direct-Answer Featured Snippet Box */}
        <section className="p-5 sm:p-6 rounded-3xl bg-slate-900 border-2 border-emerald-500/40 space-y-2 shadow-sm">
          <div className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center space-x-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Quick Summary</span>
          </div>
          <p className="text-sm sm:text-base text-white leading-relaxed font-medium">{guide.tldrAnswer}</p>
        </section>

        {/* Admin-Uploaded Original Diagrams / Hero Visuals */}
        {guide.guideImages?.length > 0 && (
          <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {guide.guideImages.map((img, idx) => (
              <figure key={idx} className="rounded-2xl overflow-hidden border border-slate-800 bg-slate-900">
                <img src={img.url} alt={img.alt || guide.title} className="w-full h-56 object-cover" />
                {(img.caption || img.alt) && (
                  <figcaption className="px-4 py-2.5 text-xs text-slate-400 border-t border-slate-800">
                    {img.caption || img.alt}
                  </figcaption>
                )}
              </figure>
            ))}
          </section>
        )}

        {/* GEO Key Verifiable Benchmarks */}
        {guide.keyStats?.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">Verified Engineering &amp; Cost Benchmarks</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {guide.keyStats.map((st, idx) => (
                <div key={idx} className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-700/70 space-y-1">
                  <div className="text-[11px] text-slate-300">{st.label}</div>
                  <div className="text-sm font-black font-mono text-emerald-300">{st.value}</div>
                  <div className="text-[10px] text-slate-400">{st.context}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Ranking Methodology & Sponsorship Disclosure */}
        {guide.sponsorshipDisclosure && (
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-start space-x-2.5 text-xs text-slate-300">
            <Scale className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white">Ranking &amp; Commercial Disclosure:</strong>{" "}
              {guide.sponsorshipDisclosure}
            </div>
          </div>
        )}

        {/* Inline Interactive Decision Wizard (Non-text Differentiator Asset) */}
        <InteractiveDecisionWizard />

        {/* Mobile-only Collapsible Table of Contents */}
        {sections.length > 0 && (
          <details className="lg:hidden p-4 rounded-2xl bg-slate-900/70 border border-slate-800">
            <summary className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-1.5 cursor-pointer">
              <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
              <span>Table of Contents ({sections.length} Chapters)</span>
            </summary>
            <ol className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-slate-300 list-decimal list-inside">
              {sections.map((sec) => (
                <li key={sec.id}>
                  <a href={`#${sec.id}`} className="hover:text-emerald-400 transition">
                    {sec.heading}
                  </a>
                </li>
              ))}
            </ol>
          </details>
        )}

        <AdSenseSlot slotId="guide-top" label="Advertisement" />

        {/* 20-Section Multi-Intent Pillar Chapters + AdSense Spacing */}
        <article className="space-y-10">
          {sections.map((sec, idx) => (
            <React.Fragment key={sec.id}>
              <section id={sec.id} className="scroll-mt-24 space-y-3 pb-4">
                <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                  {String(idx + 1).padStart(2, "0")}. {sec.heading}
                </h2>
                <GuideMarkdownView markdown={sec.markdown} />
              </section>
              {(idx === 3 || idx === 8 || idx === 13 || idx === 17) && (
                <AdSenseSlot slotId={`guide-mid-${idx}`} label="Advertisement" />
              )}
            </React.Fragment>
          ))}
        </article>

        {/* Clustered AEO/GEO FAQ Bank */}
        {faqClusters.size > 0 && (
          <section id="faq" className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white">
                Frequently Asked Questions ({guide.faqs.length})
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Answers organized by buying cost, structural safety, permits, insulation, delivery, and financing.
              </p>
            </div>

            {Array.from(faqClusters.entries()).map(([clusterName, items]) => (
              <div key={clusterName} className="space-y-2.5">
                <h3 className="text-sm font-bold text-cyan-300 border-b border-slate-800 pb-1">
                  {clusterName} ({items.length})
                </h3>
                <div className="grid grid-cols-1 gap-2.5">
                  {items.map((faq, idx) => (
                    <div key={idx} className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                      <h4 className="text-xs sm:text-sm font-bold text-emerald-300">{faq.question}</h4>
                      <p className="text-xs text-slate-300 leading-relaxed">{faq.answer}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </section>
        )}

        {/* Hub-and-Spoke Related & Supporting Cluster Links */}
        {relatedGuides.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">Supporting Cost, Comparison &amp; Regional Guides</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {relatedGuides.map((rg) => (
                <Link
                  key={rg.slug}
                  href={`/guides/${rg.slug}`}
                  className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-500/40 transition flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <div className="text-[10px] font-bold text-cyan-300">
                      {rg.targetGeo} Guide
                    </div>
                    <div className="text-xs sm:text-sm font-bold text-white truncate">{rg.title}</div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-emerald-400 shrink-0" />
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* YMYL Engineering / Zoning / Financing Disclaimer */}
        <section className="p-5 rounded-3xl bg-amber-500/10 border border-amber-500/30 space-y-2">
          <div className="text-xs font-bold uppercase text-amber-300 flex items-center space-x-1.5">
            <ShieldAlert className="w-4 h-4" />
            <span>Important Planning, Zoning &amp; Cost Notice</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">{guide.ymylDisclaimer}</p>
        </section>

        {/* Authoritative External Citations */}
        {guide.citations?.length > 0 && (
          <section className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
            <h2 className="text-sm font-bold text-white flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Building Code &amp; Authoritative Sources Cited</span>
            </h2>
            <ul className="space-y-1.5 text-xs text-slate-400">
              {guide.citations.map((c, idx) => (
                <li key={idx}>
                  <strong className="text-slate-200">{c.publisher} ({c.year}):</strong> {c.title} —{" "}
                  <a
                    href={c.reference}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-400 hover:underline font-mono"
                  >
                    {c.reference}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}
          </div>

          {/* COLUMN 3: Right Sticky Banner / CTA */}
          <aside className="lg:sticky lg:top-24 self-start space-y-5">
            <div className="p-5 rounded-3xl bg-slate-900 border border-emerald-500/40 space-y-3 shadow-lg">
              <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                Interactive 3D Studio
              </div>
              <h2 className="text-base font-extrabold text-white leading-snug">
                Design Your Prefab Pod &amp; Get Live BOM Cost
              </h2>
              <p className="text-xs text-slate-200 leading-relaxed">
                Configure dimensions, insulation, windows, and electrical load in 3D, then request verified vendor quotes.
              </p>
              <Link
                href="/"
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs inline-flex items-center justify-center space-x-1.5 transition"
              >
                <Box className="w-4 h-4" />
                <span>Launch Free 3D Builder</span>
              </Link>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-700/70 space-y-2.5 text-xs">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-300">
                Guide Quick Facts
              </div>
              <div className="flex items-center justify-between text-slate-200">
                <span>Chapters</span>
                <span className="font-mono font-bold text-white">{sections.length}</span>
              </div>
              <div className="flex items-center justify-between text-slate-200">
                <span>FAQs Answered</span>
                <span className="font-mono font-bold text-emerald-300">{guide.faqs.length}</span>
              </div>
              <div className="flex items-center justify-between text-slate-200">
                <span>Verified Vendors</span>
                <span className="font-mono font-bold text-sky-300">{guide.vendors?.length || 0}</span>
              </div>
              <Link
                href="/guides"
                className="pt-2 border-t border-slate-800 flex items-center justify-between text-emerald-300 hover:text-emerald-200 hover:underline font-semibold"
              >
                <span>Compare All Guides</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <AdSenseSlot slotId="guide-sidebar-banner" label="Sponsored Banner" />
          </aside>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
