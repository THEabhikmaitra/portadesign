import type { Metadata, Viewport } from "next";
import "./globals.css";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AuthSessionProvider } from "@/components/providers/AuthSessionProvider";
import { getPublicSiteSeoConfig } from "@/lib/seoEngine/siteConfigReader";
import { CustomBodyHtmlSlot } from "@/components/seo/CustomHtmlInjector";
import { CookieConsentBanner } from "@/components/seo/CookieConsentBanner";
import { parseSafeHeadTags } from "@/lib/seoEngine/headTagParser";
import { TopProgressBar } from "@/components/ui/TopProgressBar";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://myprefabroom.com"),
  title: {
    default: "MyPrefabRoom — 3D Prefab Room Designer & Cost Estimator",
    template: "%s | MyPrefabRoom",
  },
  description:
    "Design prefab rooms, backyard offices & ADUs in 3D. Compare local factory quotes, crane costs, zoning permits & E-E-A-T buyer guides.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    siteName: "MyPrefabRoom",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f8fafc",
};

function parseValidCustomSchema(raw: string): Record<string, any> | null {
  if (!raw?.trim()) return null;
  try {
    const parsed = JSON.parse(raw.trim());
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [siteCfg, session] = await Promise.all([
    getPublicSiteSeoConfig(),
    getServerSession(authOptions),
  ]);
  const siteUrl = siteCfg.siteUrl;
  const headTags = parseSafeHeadTags(siteCfg.headerHtml);
  const customGlobalSchema = parseValidCustomSchema(siteCfg.customGlobalSchemaJson);
  const adsenseClient = (process.env.NEXT_PUBLIC_ADSENSE_CLIENT || "").trim();

  const siteCreatedIso = "2024-01-15T00:00:00Z";
  const siteModifiedIso = new Date().toISOString().split("T")[0] + "T00:00:00Z";

  const rootGraph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${siteUrl}#organization`,
        name: "MyPrefabRoom",
        url: siteUrl,
        description: siteCfg.llmsSummaryNote,
        foundingDate: "2024",
        contactPoint: {
          "@type": "ContactPoint",
          contactType: "customer support",
          url: `${siteUrl}/contact`,
          availableLanguage: ["English"],
        },
        logo: {
          "@type": "ImageObject",
          url: `${siteUrl}/icon.svg`,
          caption: "MyPrefabRoom Logo",
        },
        sameAs: [
          `${siteUrl}`,
        ],
      },
      {
        "@type": "Person",
        "@id": `${siteUrl}#author-arjun-mehta`,
        name: "Arjun Mehta",
        jobTitle: "Modular Construction Specialist & 3D Design Lead",
        image: `${siteUrl}/authors/arjun-mehta.svg`,
        worksFor: { "@id": `${siteUrl}#organization` },
        url: `${siteUrl}/about`,
      },
      {
        "@type": "Person",
        "@id": `${siteUrl}#reviewer-dr-priya-nair`,
        name: "Dr. Priya Nair",
        jobTitle: "Licensed Structural & Modular Building Reviewer (PE)",
        image: `${siteUrl}/authors/priya-nair.svg`,
        worksFor: { "@id": `${siteUrl}#organization` },
        url: `${siteUrl}/about`,
      },
      {
        "@type": "WebSite",
        "@id": `${siteUrl}#website`,
        url: siteUrl,
        name: "MyPrefabRoom",
        dateCreated: siteCreatedIso,
        dateModified: siteModifiedIso,
        publisher: { "@id": `${siteUrl}#organization` },
        author: { "@id": `${siteUrl}#author-arjun-mehta` },
        potentialAction: {
          "@type": "SearchAction",
          target: `${siteUrl}/guides?q={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      },
    ],
  };

  return (
    <html lang="en" className="light">
      <head>
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="alternate" type="application/rss+xml" title="MyPrefabRoom Prefab Room Guides" href="/feed.xml" />
        {adsenseClient && (
          <script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(adsenseClient)}`}
            crossOrigin="anonymous"
          />
        )}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(rootGraph) }}
        />
        {customGlobalSchema && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(customGlobalSchema) }}
          />
        )}
        {headTags.map((tag, idx) => {
          if (tag.tag === "meta") return <meta key={`ch-m-${idx}`} {...tag.attrs} />;
          if (tag.tag === "link") return <link key={`ch-l-${idx}`} {...tag.attrs} />;
          if (tag.tag === "style") {
            return <style key={`ch-st-${idx}`} {...tag.attrs} dangerouslySetInnerHTML={{ __html: tag.inner }} />;
          }
          return (
            <script
              key={`ch-sc-${idx}`}
              {...tag.attrs}
              {...(tag.inner ? { dangerouslySetInnerHTML: { __html: tag.inner } } : {})}
            />
          );
        })}
      </head>
      <body className="bg-slate-50 text-slate-900 antialiased min-h-screen">
        <TopProgressBar />
        <CustomBodyHtmlSlot html={siteCfg.bodyTopHtml} slotName="body-top" />
        <AuthSessionProvider session={session}>{children}</AuthSessionProvider>
        <CookieConsentBanner />
        <CustomBodyHtmlSlot html={siteCfg.footerHtml} slotName="footer" />
      </body>
    </html>
  );
}
