import React from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/ui/SiteHeader";
import { SiteFooter } from "@/components/ui/SiteFooter";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://myprefabroom.com";
const PAGE_URL = `${SITE_URL}/about`;
const DATE_CREATED = "2024-01-15";
const DATE_MODIFIED = new Date().toISOString().split("T")[0];

export const metadata: Metadata = {
  title: "About MyPrefabRoom & Editorial Standards",
  description: "How MyPrefabRoom builds 3D cost estimates, delivery & crane guidance, insulation comparisons, and engineer-reviewed buyer guides.",
  alternates: { canonical: "/about" },
  authors: [{ name: "Arjun Mehta", url: PAGE_URL }],
  openGraph: {
    title: "About & E-E-A-T Verification Methodology | MyPrefabRoom",
    description: "How MyPrefabRoom grounds 3D cost estimates, crane logistics, insulation physics, and human engineer reviews.",
    type: "article",
    url: "/about",
    publishedTime: DATE_CREATED,
    modifiedTime: DATE_MODIFIED,
    authors: [`${SITE_URL}/about`],
    siteName: "MyPrefabRoom",
  },
};

const aboutSchema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "AboutPage",
      "@id": `${SITE_URL}/about#page`,
      url: PAGE_URL,
      name: "About MyPrefabRoom & E-E-A-T Verification Methodology",
      description: "How MyPrefabRoom grounds 3D cost estimates, crane logistics, insulation physics, and human engineer reviews.",
      dateCreated: DATE_CREATED,
      dateModified: DATE_MODIFIED,
      datePublished: DATE_CREATED,
      author: {
        "@type": "Person",
        "@id": `${SITE_URL}#author-arjun-mehta`,
        name: "Arjun Mehta",
        jobTitle: "Modular Construction Specialist & 3D Design Lead",
        url: PAGE_URL,
      },
      reviewedBy: {
        "@type": "Person",
        "@id": `${SITE_URL}#reviewer-dr-priya-nair`,
        name: "Dr. Priya Nair",
        jobTitle: "Licensed Structural & Modular Building Reviewer (PE)",
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
          { "@type": "ListItem", position: 2, name: "About", item: PAGE_URL },
        ],
      },
    },
  ],
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutSchema) }}
      />
      <SiteHeader />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12 space-y-6">
        <h1 className="text-3xl font-extrabold text-white">About MyPrefabRoom</h1>
        <div className="flex flex-wrap gap-3 text-[11px] font-mono text-slate-400">
          <span>Author: <strong className="text-slate-200">Arjun Mehta</strong></span>
          <span>·</span>
          <span>Reviewed by: <strong className="text-emerald-300">Dr. Priya Nair, PE</strong></span>
          <span>·</span>
          <time dateTime={DATE_MODIFIED}>Updated {DATE_MODIFIED}</time>
        </div>
        <p className="text-sm leading-7 text-slate-300">
          MyPrefabRoom helps homeowners, remote professionals, and small business owners plan prefabricated studios, ADUs, garden rooms, and rooftop cabins interactively in 3D before speaking with manufacturers.
        </p>
        <section className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <h2 className="text-base font-bold text-white">How We Verify Our Guides</h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Every cost, zoning, and structural guide we publish is checked against real manufacturer pricing and reviewed by a licensed structural engineer before going live. Always consult local licensed civil engineers and municipal authorities before construction.
          </p>
        </section>
        <section className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <h2 className="text-base font-bold text-white">Our Team</h2>
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <img
                src="/authors/arjun-mehta.svg"
                alt="Arjun Mehta"
                width={40}
                height={40}
                className="w-10 h-10 rounded-full border border-emerald-500/40 object-cover shrink-0"
              />
              <div>
                <div className="font-semibold text-white text-sm">Arjun Mehta</div>
                <div className="text-[11px] text-slate-400">Modular Construction Specialist &amp; 3D Design Lead • Content Author</div>
                <div className="text-[11px] text-slate-400 mt-0.5">8 years designing prefab ADUs, rooftop portacabins, and steel-frame backyard studios across India, UK &amp; UAE markets.</div>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <img
                src="/authors/priya-nair.svg"
                alt="Dr. Priya Nair, PE"
                width={40}
                height={40}
                className="w-10 h-10 rounded-full border border-cyan-500/40 object-cover shrink-0"
              />
              <div>
                <div className="font-semibold text-white text-sm">Dr. Priya Nair, PE</div>
                <div className="text-[11px] text-slate-400">Licensed Structural &amp; Modular Building Reviewer • Technical Editor</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Structural engineering consultant with 14 years of review practice across IS 800, Eurocode 3, and AISC prefabricated steel systems.</div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
