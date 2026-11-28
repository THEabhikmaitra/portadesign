import React from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/ui/SiteHeader";
import { SiteFooter } from "@/components/ui/SiteFooter";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://myprefabroom.com";
const PAGE_URL = `${SITE_URL}/contact`;
const DATE_CREATED = "2024-01-15";
const DATE_MODIFIED = new Date().toISOString().split("T")[0];

export const metadata: Metadata = {
  title: "Contact & Support",
  description:
    "Contact MyPrefabRoom for 3D configurator support, editorial corrections, verified manufacturer onboarding, or privacy and data deletion requests.",
  alternates: { canonical: "/contact" },
  authors: [{ name: "Arjun Mehta", url: `${SITE_URL}/about` }],
  openGraph: {
    title: "Contact & Support | MyPrefabRoom",
    description:
      "Contact MyPrefabRoom for 3D configurator support, editorial corrections, verified manufacturer onboarding, or privacy and data deletion requests.",
    type: "website",
    url: "/contact",
    siteName: "MyPrefabRoom",
  },
};

const contactSchema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "ContactPage",
      "@id": `${SITE_URL}/contact#page`,
      url: PAGE_URL,
      name: "Contact & Support — MyPrefabRoom",
      description:
        "Contact MyPrefabRoom for 3D configurator support, editorial corrections, verified manufacturer onboarding, or privacy and data deletion requests.",
      dateCreated: DATE_CREATED,
      dateModified: DATE_MODIFIED,
      datePublished: DATE_CREATED,
      author: {
        "@type": "Person",
        "@id": `${SITE_URL}#author-arjun-mehta`,
        name: "Arjun Mehta",
      },
      publisher: {
        "@type": "Organization",
        "@id": `${SITE_URL}#organization`,
        name: "MyPrefabRoom",
        url: SITE_URL,
      },
      inLanguage: "en",
      breadcrumb: {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
          { "@type": "ListItem", position: 2, name: "Contact", item: PAGE_URL },
        ],
      },
    },
  ],
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(contactSchema) }}
      />
      <SiteHeader />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12 space-y-6">
        <h1 className="text-3xl font-extrabold text-white">Contact &amp; Support</h1>
        <p className="text-sm leading-7 text-slate-300">
          Reach the MyPrefabRoom team for technical support, pricing or code corrections in our guides, verified fabricator onboarding, or privacy requests.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <section className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1.5">
            <h2 className="text-sm font-bold text-white">General &amp; 3D Studio Support</h2>
            <p className="text-xs text-slate-400">Account help, saved 3D layouts, and quote tracking.</p>
            <a href="mailto:support@myprefabroom.com" className="text-xs font-mono text-emerald-400 hover:underline block pt-1">
              support@myprefabroom.com
            </a>
          </section>

          <section className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1.5">
            <h2 className="text-sm font-bold text-white">Editorial &amp; Fact-Check Desk</h2>
            <p className="text-xs text-slate-400">Report municipal bylaw updates or BIS/code corrections.</p>
            <a href="mailto:editorial@myprefabroom.com" className="text-xs font-mono text-emerald-400 hover:underline block pt-1">
              editorial@myprefabroom.com
            </a>
          </section>

          <section className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1.5">
            <h2 className="text-sm font-bold text-white">Privacy &amp; Data Deletion (GDPR/CCPA)</h2>
            <p className="text-xs text-slate-400">Export or delete your account and Google OAuth profile data.</p>
            <a href="mailto:privacy@myprefabroom.com" className="text-xs font-mono text-emerald-400 hover:underline block pt-1">
              privacy@myprefabroom.com
            </a>
          </section>

          <section className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1.5">
            <h2 className="text-sm font-bold text-white">Verified Maker Onboarding</h2>
            <p className="text-xs text-slate-400">Apply as a prefab manufacturer or update factory rate cards.</p>
            <Link href="/auth/signin?tab=vendor" className="text-xs font-mono text-cyan-400 hover:underline block pt-1">
              Open Maker Registration →
            </Link>
          </section>
        </div>

        <section className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 space-y-1.5">
          <div className="font-semibold text-slate-200">Response SLA &amp; Editorial Independence</div>
          <p>
            Support and privacy inquiries are answered within 2 business days. Editorial corrections verified against primary municipal or BIS sources are updated with a revised timestamp.
          </p>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
