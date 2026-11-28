import React from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, BookOpen, ShieldCheck, Globe, Box } from "lucide-react";
import { listPublishedGuides } from "@/lib/seoEngine/guideReader";
import { AdSenseSlot } from "@/components/seo/AdSenseSlot";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Prefab Room Cost, Permits & Backyard Pod Guides",
  description:
    "In-depth, engineer-reviewed guides covering prefab ADUs, backyard office pods, UK garden rooms, rooftop portacabins, crane access, insulation & financing.",
};

export default async function GuidesIndexPage({
  searchParams,
}: {
  searchParams?: { geo?: string };
}) {
  const activeGeo = (searchParams?.geo || "ALL").toUpperCase();
  const guides = await listPublishedGuides(activeGeo);

  const geos = [
    { id: "ALL", label: "All Regions" },
    { id: "GLOBAL", label: "Global" },
    { id: "US", label: "USA & Canada" },
    { id: "UK", label: "UK & Europe" },
    { id: "AU", label: "Australia & NZ" },
    { id: "IN", label: "India" },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-emerald-400 to-cyan-400 flex items-center justify-center text-slate-950 font-black text-sm">
              M
            </div>
            <span className="font-extrabold text-sm sm:text-base text-white">
              MyPrefab<span className="text-emerald-400">Room</span>
            </span>
          </Link>
          <div className="flex items-center space-x-3 text-xs">
            <Link href="/about" className="text-slate-300 hover:text-white hidden sm:inline">
              Methodology &amp; Team
            </Link>
            <Link
              href="/"
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-bold inline-flex items-center space-x-1.5"
            >
              <Box className="w-3.5 h-3.5" />
              <span>Open 3D Designer</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-8">
        <div className="space-y-3 max-w-3xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Engineer-Verified E-E-A-T Guides • Real Turnkey Benchmarks</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            Modular Room Cost, Zoning Permits &amp; Engineering Library
          </h1>
          <p className="text-sm sm:text-base text-slate-300">
            Independent buyer guides grounded in live fabrication costs, structural roof-load physics, crane logistics, and regional planning codes.
          </p>
        </div>

        {/* Regional Filter Pills */}
        <div className="flex flex-wrap gap-2">
          {geos.map((g) => (
            <Link
              key={g.id}
              href={g.id === "ALL" ? "/guides" : `/guides?geo=${g.id}`}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition ${
                activeGeo === g.id
                  ? "bg-emerald-500/20 border-emerald-400 text-emerald-300"
                  : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              {g.label}
            </Link>
          ))}
        </div>

        <AdSenseSlot label="Sponsored Guides Banner" />

        {guides.length === 0 ? (
          <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-3">
            <BookOpen className="w-8 h-8 text-emerald-400 mx-auto" />
            <h2 className="text-lg font-bold text-white">Guides Library Preparing</h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
              First batch of 5,000+ word engineer-reviewed guides is currently going through verification. Meanwhile, design your room in 3D for instant manufacturer quotes.
            </p>
            <Link
              href="/"
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs"
            >
              <span>Launch 3D Prefab Designer</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {guides.map((g) => (
              <Link
                key={g.slug}
                href={`/guides/${g.slug}`}
                className="group p-6 rounded-3xl bg-slate-900 border border-slate-800 hover:border-emerald-500/50 transition flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-[11px] font-semibold">
                    <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 inline-flex items-center space-x-1">
                      <Globe className="w-3 h-3" />
                      <span>{g.targetGeo} • {g.intent}</span>
                    </span>
                    <span className="font-mono text-emerald-400">
                      {g.wordCount.toLocaleString()} words • {g.readingMinutes}m read
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-white group-hover:text-emerald-300 transition">
                    {g.title}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-300 line-clamp-3 leading-relaxed">
                    {g.tldrAnswer}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-400">
                    Reviewed by <strong className="text-slate-200">{g.reviewerName || g.authorName}</strong>
                  </span>
                  <span className="text-emerald-400 font-bold inline-flex items-center space-x-1 group-hover:translate-x-1 transition">
                    <span>Read Guide</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      <footer className="border-t border-slate-800 bg-slate-900/50 py-8 mt-12 text-xs text-slate-400">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-wrap items-center justify-between gap-4">
          <span>© {new Date().getFullYear()} MyPrefabRoom. Independent 3D Configurator &amp; Research.</span>
          <div className="flex items-center space-x-4">
            <Link href="/" className="hover:text-white">3D Configurator</Link>
            <Link href="/about" className="hover:text-white">About &amp; E-E-A-T</Link>
            <Link href="/privacy" className="hover:text-white">Privacy &amp; Disclaimers</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
