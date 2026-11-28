import React from "react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy & Disclaimers",
  description: "MyPrefabRoom privacy notice, quote contact handling, location permissions, and advertising disclosures.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans">
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12 space-y-6">
        <Link href="/guides" className="text-xs text-emerald-400 hover:underline">← Back to Guides</Link>
        <h1 className="text-3xl font-extrabold text-white">Privacy Policy &amp; Disclaimers</h1>
        <p className="text-xs sm:text-sm leading-7 text-slate-300">
          Contact details, delivery addresses, and optional GPS coordinates submitted through our Quote Request form are shared solely with the manufacturer you explicitly select so they can compute accurate transport and crane pricing.
        </p>
        <p className="text-xs sm:text-sm leading-7 text-slate-300">
          Editorial guide pages may display contextual advertisements (such as Google AdSense when enabled). We do not display third-party ads inside the interactive 3D studio. Cost tables and regional permit summaries are educational benchmarks and do not substitute formal engineering or legal advice.
        </p>
      </main>
    </div>
  );
}
