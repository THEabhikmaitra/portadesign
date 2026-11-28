import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  ArrowLeft,
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
import { GuideMarkdownView } from "@/components/seo/GuideMarkdownView";
import { AdSenseSlot } from "@/components/seo/AdSenseSlot";
import { InteractiveDecisionWizard } from "@/components/seo/InteractiveDecisionWizard";
import { SeoFaqItem } from "@/lib/seoEngine/types";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const guide = await getPublishedGuideBySlug(params.slug);
  if (!guide) return { title: "Guide Not Found" };

  return {
    title: guide.metaTitle || guide.title,
    description: guide.metaDesc,
    keywords: [guide.keyword, "prefab room", "modular cabin", "cost guide", guide.targetGeo],
    alternates: { canonical: `/guides/${guide.slug}` },
    openGraph: {
      title: guide.metaTitle || guide.title,
      description: guide.metaDesc,
      type: "article",
      url: `/guides/${guide.slug}`,
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Unified JSON-LD Graph: Article + Organization + Person (Author/Reviewer) + ItemList (Verified Providers) + ImageObject + Breadcrumb + FAQPage */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(guide.schemaJsonLd) }}
      />

      <header className="border-b border-slate-800 bg-slate-900/85 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <Link
              href="/guides"
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              title="All Guides"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <Link href="/" className="font-extrabold text-sm text-white">
              MyPrefab<span className="text-emerald-400">Room</span>
            </Link>
          </div>
          <Link
            href="/"
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-bold text-xs inline-flex items-center space-x-1.5"
          >
            <Box className="w-3.5 h-3.5" />
            <span>Try Free 3D Configurator</span>
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
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
              {guide.targetGeo} • {guide.clusterRole} • {guide.intent}
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

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="space-y-0.5">
              <div className="text-slate-300">
                By <strong className="text-white">{guide.authorName}</strong>{" "}
                <span className="text-slate-400">({guide.authorRole})</span>
              </div>
              {guide.reviewerName && (
                <div className="text-emerald-300 flex items-center space-x-1.5">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span>
                    Technical Review by <strong>{guide.reviewerName}</strong> ({guide.reviewerCreds})
                  </span>
                </div>
              )}
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
        </div>

        {/* AEO Direct-Answer Featured Snippet Box */}
        <section className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-emerald-950/50 to-slate-900 border border-emerald-500/40 space-y-2">
          <div className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center space-x-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Direct Answer &amp; Turnkey Benchmark Summary</span>
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
                <div key={idx} className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
                  <div className="text-[11px] text-slate-400">{st.label}</div>
                  <div className="text-sm font-black font-mono text-emerald-400">{st.value}</div>
                  <div className="text-[10px] text-slate-500">{st.context}</div>
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

        {/* Clickable Table of Contents */}
        {sections.length > 0 && (
          <nav className="p-5 rounded-3xl bg-slate-900/70 border border-slate-800 space-y-2.5">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
              <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
              <span>Table of Contents ({sections.length} Chapters)</span>
            </div>
            <ol className="grid grid-cols-1 md:grid-cols-2 gap-1.5 text-xs text-slate-300 list-decimal list-inside">
              {sections.map((sec) => (
                <li key={sec.id}>
                  <a href={`#${sec.id}`} className="hover:text-emerald-400 transition">
                    {sec.heading}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        )}

        <AdSenseSlot slotId="guide-top" label="Advertisement" />

        {/* 20-Section Multi-Intent Pillar Chapters + AdSense Spacing */}
        <article className="space-y-10">
          {sections.map((sec, idx) => (
            <React.Fragment key={sec.id}>
              <section id={sec.id} className="scroll-mt-24 space-y-3 border-b border-slate-900 pb-8">
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
                Frequently Asked Questions ({guide.faqs.length} Direct AEO Answers by Topic Cluster)
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Organized cleanly across buying, structural safety, permits, insulation, delivery &amp; financing clusters.
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
                      {rg.targetGeo} • {rg.clusterRole}
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
            <span>Engineering, Zoning &amp; Financial Verification Notice (YMYL)</span>
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
      </main>

      <footer className="border-t border-slate-800 bg-slate-900/50 py-8 mt-10 text-xs text-slate-400">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-wrap items-center justify-between gap-4">
          <span>© {new Date().getFullYear()} MyPrefabRoom.</span>
          <div className="flex items-center space-x-4">
            <Link href="/" className="hover:text-white">3D Configurator</Link>
            <Link href="/guides" className="hover:text-white">All Guides</Link>
            <Link href="/about" className="hover:text-white">Methodology</Link>
            <Link href="/privacy" className="hover:text-white">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
