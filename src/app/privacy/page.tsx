import React from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/ui/SiteHeader";
import { SiteFooter } from "@/components/ui/SiteFooter";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://myprefabroom.com";
const PAGE_URL = `${SITE_URL}/privacy`;
const DATE_CREATED = "2024-01-15";
const DATE_MODIFIED = new Date().toISOString().split("T")[0];

export const metadata: Metadata = {
  title: "Privacy Policy & Disclaimers",
  description: "MyPrefabRoom privacy notice, quote contact handling, location permissions, and advertising disclosures.",
  alternates: { canonical: "/privacy" },
  authors: [{ name: "Arjun Mehta", url: `${SITE_URL}/about` }],
  openGraph: {
    title: "Privacy Policy & Disclaimers | MyPrefabRoom",
    description: "MyPrefabRoom privacy notice, quote contact handling, location permissions, and advertising disclosures.",
    type: "website",
    url: "/privacy",
    siteName: "MyPrefabRoom",
  },
};

const privacySchema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "@id": `${SITE_URL}/privacy#page`,
      url: PAGE_URL,
      name: "Privacy Policy & Disclaimers — MyPrefabRoom",
      description: "MyPrefabRoom privacy notice, quote contact handling, location permissions, and advertising disclosures.",
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
          { "@type": "ListItem", position: 2, name: "Privacy Policy", item: PAGE_URL },
        ],
      },
    },
  ],
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(privacySchema) }}
      />
      <SiteHeader />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12 space-y-6">
        <h1 className="text-3xl font-extrabold text-white">Privacy Policy &amp; Disclaimers</h1>
        <div className="flex flex-wrap gap-3 text-[11px] font-mono text-slate-400">
          <span>Published: <time dateTime={DATE_CREATED}>{DATE_CREATED}</time></span>
          <span>·</span>
          <span>Updated: <time dateTime={DATE_MODIFIED}>{DATE_MODIFIED}</time></span>
          <span>·</span>
          <span>Author: <strong className="text-slate-200">Arjun Mehta</strong></span>
        </div>
        <p className="text-xs sm:text-sm leading-7 text-slate-300">
          Contact details, delivery addresses, and optional GPS coordinates submitted through our Quote Request form are shared solely with the manufacturer you explicitly select so they can compute accurate transport and crane pricing.
        </p>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-white">Google AdSense &amp; Third-Party Cookies</h2>
          <p className="text-xs sm:text-sm leading-7 text-slate-300">
            Editorial guide pages may display contextual or personalized advertisements via Google AdSense. Third-party vendors, including Google, use cookies (such as the DART cookie) to serve ads based on a user&apos;s prior visits to this site or other websites. You may opt out of personalized advertising by visiting{" "}
            <a
              href="https://adssettings.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-400 hover:underline"
            >
              Google Ads Settings
            </a>{" "}
            or{" "}
            <a
              href="https://www.aboutads.info/choices/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-400 hover:underline"
            >
              aboutads.info
            </a>
            . We do not display third-party ads inside the interactive 3D studio.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-white">Google Sign-In (OAuth) Data</h2>
          <p className="text-xs sm:text-sm leading-7 text-slate-300">
            When you sign in with Google, we receive only your basic profile name and email address to create and authenticate your MyPrefabRoom account. We do not request access to your Google Drive, Contacts, or Calendar.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-white">Your Privacy Rights (GDPR / CCPA) &amp; Disclaimers</h2>
          <p className="text-xs sm:text-sm leading-7 text-slate-300">
            You may request access to, correction of, or deletion of your account and quote data at any time by emailing{" "}
            <a href="mailto:privacy@myprefabroom.com" className="text-emerald-400 hover:underline">
              privacy@myprefabroom.com
            </a>{" "}
            or visiting our{" "}
            <Link href="/contact" className="text-emerald-400 hover:underline">
              Contact page
            </Link>
            . Cost tables and regional permit summaries are educational benchmarks and do not substitute formal engineering or legal advice.
          </p>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
