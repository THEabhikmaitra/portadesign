import React from "react";
import Link from "next/link";
import { getPublicSiteSeoConfig } from "@/lib/seoEngine/siteConfigReader";
import { StudioPortalClient } from "@/components/ui/StudioPortalClient";

export default async function HomeStudioPage() {
  const siteCfg = await getPublicSiteSeoConfig();
  const siteUrl = siteCfg.siteUrl;

  const appSchema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["WebApplication", "SoftwareApplication"],
        "@id": `${siteUrl}/#webapp`,
        name: "MyPrefabRoom 3D Prefab Room Configurator",
        url: siteUrl,
        applicationCategory: "DesignApplication",
        operatingSystem: "Any",
        browserRequirements: "Requires WebGL / HTML5",
        description: siteCfg.llmsSummaryNote,
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
          availability: "https://schema.org/InStock",
        },
        publisher: { "@id": `${siteUrl}#organization` },
      },
      {
        "@type": "Product",
        "@id": `${siteUrl}/#modular-room-catalog`,
        name: "Customizable Modular Prefab Room & Backyard Office Pod",
        description:
          "Configure custom 20ft and 40ft steel-frame backyard studios, garden pods, and rooftop cabins with crane logistics and instant vendor pricing.",
        brand: { "@type": "Brand", name: "MyPrefabRoom" },
        offers: {
          "@type": "AggregateOffer",
          priceCurrency: "INR",
          lowPrice: 320000,
          highPrice: 2450000,
          offerCount: 5,
          availability: "https://schema.org/InStock",
          url: siteUrl,
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "3D Prefab Studio", item: siteUrl },
        ],
      },
    ],
  };

  return (
    <main className="relative w-screen h-[100dvh] overflow-hidden bg-slate-950 font-sans select-none">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(appSchema) }}
      />

      {/* Semantic SSR landmark & crawler/screen-reader links (zero visual clutter on 3D canvas) */}
      <h1 className="sr-only">
        MyPrefabRoom — 3D Prefab Room Configurator, Cost Calculator &amp; Turnkey Manufacturer Quotes
      </h1>
      <nav aria-label="Primary Site Resources" className="sr-only">
        <Link href="/guides">Engineering &amp; Cost Buyer Guides</Link>
        <Link href="/about">About &amp; E-E-A-T Methodology</Link>
        <Link href="/privacy">Privacy Policy &amp; Disclaimers</Link>
      </nav>

      <StudioPortalClient />
    </main>
  );
}
