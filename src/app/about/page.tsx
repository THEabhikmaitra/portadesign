import React from "react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About & E-E-A-T Verification Methodology",
  description: "How MyPrefabRoom grounds 3D cost estimates, crane logistics, insulation physics, and human engineer reviews.",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans">
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12 space-y-6">
        <Link href="/guides" className="text-xs text-emerald-400 hover:underline">← Back to Guides</Link>
        <h1 className="text-3xl font-extrabold text-white">About MyPrefabRoom &amp; E-E-A-T Standards</h1>
        <p className="text-sm leading-7 text-slate-300">
          MyPrefabRoom helps homeowners, remote professionals, and small business owners plan prefabricated studios, ADUs, garden rooms, and rooftop portacabins interactively in 3D before speaking with manufacturers.
        </p>
        <section className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <h2 className="text-base font-bold text-white">Editorial &amp; Human-in-the-Loop Verification</h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Every long-form cost, zoning, and structural guide published under /guides undergoes automated grounding against live partner factory rate cards and requires human technical review sign-off before publication. Always consult local licensed civil engineers and municipal authorities before structural installation.
          </p>
        </section>
      </main>
    </div>
  );
}
