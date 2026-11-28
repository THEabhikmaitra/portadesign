import React from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/ui/SiteHeader";
import { SiteFooter } from "@/components/ui/SiteFooter";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://myprefabroom.com";
const PAGE_URL = `${SITE_URL}/terms`;
const DATE_CREATED = "2024-01-15";
const DATE_MODIFIED = new Date().toISOString().split("T")[0];

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description:
    "MyPrefabRoom Terms of Service covering the 3D configurator, vendor quotes, Google Sign-In, YMYL cost benchmarks, and intellectual property.",
  alternates: { canonical: "/terms" },
  authors: [{ name: "Arjun Mehta", url: `${SITE_URL}/about` }],
  openGraph: {
    title: "Terms & Conditions | MyPrefabRoom",
    description:
      "MyPrefabRoom Terms of Service covering the 3D configurator, vendor quotes, Google Sign-In, YMYL cost benchmarks, and intellectual property.",
    type: "website",
    url: "/terms",
    siteName: "MyPrefabRoom",
  },
};

const termsSchema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "@id": `${SITE_URL}/terms#page`,
      url: PAGE_URL,
      name: "Terms & Conditions — MyPrefabRoom",
      description:
        "MyPrefabRoom Terms of Service covering the 3D configurator, vendor quotes, Google Sign-In, YMYL cost benchmarks, and intellectual property.",
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
          { "@type": "ListItem", position: 2, name: "Terms & Conditions", item: PAGE_URL },
        ],
      },
    },
  ],
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(termsSchema) }}
      />
      <SiteHeader />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12 space-y-6">
        <h1 className="text-3xl font-extrabold text-white">Terms &amp; Conditions</h1>
        <div className="flex flex-wrap gap-3 text-[11px] font-mono text-slate-400">
          <span>
            Effective: <time dateTime={DATE_CREATED}>{DATE_CREATED}</time>
          </span>
          <span>·</span>
          <span>
            Updated: <time dateTime={DATE_MODIFIED}>{DATE_MODIFIED}</time>
          </span>
          <span>·</span>
          <span>
            Author: <strong className="text-slate-200">Arjun Mehta</strong>
          </span>
        </div>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-white">1. Acceptance of Terms</h2>
          <p className="text-xs sm:text-sm leading-7 text-slate-300">
            By accessing MyPrefabRoom ({SITE_URL}), using the interactive 3D prefab configurator, signing in with Google or email credentials, or reading our buyer guides, you agree to these Terms &amp; Conditions and our{" "}
            <Link href="/privacy" className="text-emerald-400 hover:underline">
              Privacy Policy
            </Link>
            .
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-white">2. Platform Role &amp; Vendor Quotes</h2>
          <p className="text-xs sm:text-sm leading-7 text-slate-300">
            MyPrefabRoom is an independent 3D planning tool and quote-comparison directory. We do not manufacture, ship, or install prefabricated structures directly unless explicitly stated in a separate written contract. Any fabrication agreement, warranty, GST invoice, or payment schedule is solely between you and the verified manufacturer you choose.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-white">3. Planning, Zoning &amp; Cost Estimates</h2>
          <p className="text-xs sm:text-sm leading-7 text-slate-300">
            All cost estimates, crane access notes, municipal permit summaries, load tables, and tax or loan examples are provided strictly for planning reference. Always verify site-specific structural safety, wind/seismic compliance, electrical earthing, and local municipal bylaws with licensed engineers and legal/tax professionals before construction.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-white">4. User Accounts &amp; Google Sign-In</h2>
          <p className="text-xs sm:text-sm leading-7 text-slate-300">
            You are responsible for maintaining the security of your account. When signing in via Google OAuth, we request only basic profile identity (name and email) to authenticate your saved 3D layouts and quote history. We reserve the right to suspend accounts that submit spam quotes, falsified vendor credentials, or automated abuse.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-white">5. Intellectual Property &amp; Public Designs</h2>
          <p className="text-xs sm:text-sm leading-7 text-slate-300">
            Platform software, 3D rendering tools, and buyer guides remain the intellectual property of MyPrefabRoom. Designs you explicitly mark as public may be viewed and remixed by other users under a non-exclusive platform license.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-white">6. Advertising &amp; Third-Party Links</h2>
          <p className="text-xs sm:text-sm leading-7 text-slate-300">
            Editorial guide pages may display third-party advertisements (such as Google AdSense) and external reference links to building standards or manufacturer sites. Sponsored vendor listings are clearly labeled and do not alter safety disclosures or editorial ratings.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-white">7. Limitation of Liability &amp; Contact</h2>
          <p className="text-xs sm:text-sm leading-7 text-slate-300">
            To the fullest extent permitted by law, MyPrefabRoom is provided &ldquo;as is&rdquo; without warranties of merchantability or fitness for a particular site. Questions regarding these Terms can be sent via our{" "}
            <Link href="/contact" className="text-emerald-400 hover:underline">
              Contact page
            </Link>
            .
          </p>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
