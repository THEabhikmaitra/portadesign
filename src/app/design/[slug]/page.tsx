import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { RemixButton } from "./RemixButton";
import { DesignViewer3D } from "./DesignViewer3D";
import {
  Building2,
  Calendar,
  Layers,
  Share2,
  GitFork,
  Eye,
  ShieldCheck,
  CheckCircle,
  FileSpreadsheet,
  ArrowLeft,
} from "lucide-react";

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const design = await prisma.design.findUnique({
    where: { slug: params.slug },
  });

  if (!design) {
    return { title: "Design Not Found - PORTADESIGN 3D" };
  }

  return {
    title: `${design.title} - 3D Modular Portacabin Spec`,
    description:
      design.description ||
      "Interactive 3D container architecture layout, bill of materials, and verified manufacturer quotes.",
    openGraph: {
      title: design.title,
      description: design.description || "Interactive 3D Prefab Container Blueprint",
      images: design.previewImage ? [design.previewImage] : [],
    },
  };
}

export default async function PublicDesignPage({ params }: Props) {
  const design = await prisma.design.findUnique({
    where: { slug: params.slug },
    include: {
      versions: {
        orderBy: { versionNumber: "desc" },
      },
      user: {
        select: { id: true, name: true, role: true, xp: true },
      },
    },
  });

  if (!design) {
    notFound();
  }

  // Increment view count asynchronously
  await prisma.design.update({
    where: { id: design.id },
    data: { viewCount: { increment: 1 } },
  });

  const latestVersion = design.versions[0];
  let bomData: any = { items: [], totalCost: 0, subtotal: 0, tax: 0 };
  let sceneData: any = { cabins: [], equipment: [] };

  try {
    if (latestVersion?.bomJson) {
      bomData = JSON.parse(latestVersion.bomJson);
    }
    if (latestVersion?.sceneJson) {
      sceneData = JSON.parse(latestVersion.sceneJson);
    }
  } catch (e) {
    console.error("JSON parse error:", e);
  }

  // JSON-LD Structured Schema for Search Engines (Product / Architecture Model)
  const jsonLd = {
    "@context": "https://schema.org/",
    "@type": "Product",
    name: design.title,
    description: design.description,
    image: design.previewImage || "https://porta.local/preview.png",
    sku: `PORTA-${design.slug.toUpperCase()}`,
    offers: {
      "@type": "Offer",
      priceCurrency: "INR",
      price: bomData.totalCost || 350000,
      itemCondition: "https://schema.org/NewCondition",
      availability: "https://schema.org/InStock",
      seller: {
        "@type": "Organization",
        name: "QuickCabin Modular & Certified Indian Fabricators",
      },
    },
    category: "Modular Portacabin / Prefab Architecture",
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-16">
      {/* JSON-LD Script Tag for Crawlers */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Top Navbar */}
      <header className="border-b border-slate-800 bg-slate-900/70 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center space-x-2 text-xs font-semibold text-slate-300 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4 text-emerald-400" />
            <span>Back to 3D Studio</span>
          </Link>

          <div className="flex items-center space-x-3">
            <span className="hidden sm:inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Public Verified Specification</span>
            </span>

            <RemixButton originalSlug={design.slug} originalTitle={design.title} />
          </div>
        </div>
      </header>

      {/* Hero & Interactive 3D Canvas Box */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main 3D Interactive Viewport */}
          <div className="lg:col-span-2 space-y-4">
            <div className="relative w-full h-[480px] bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl">
              <DesignViewer3D scene={sceneData} />

              <div className="absolute top-4 left-4 z-10 px-3 py-1.5 rounded-xl bg-slate-900/80 backdrop-blur-md border border-slate-700/80 text-xs text-white flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Live Interactive WebGL Preview</span>
              </div>
            </div>

            {/* Title & Metadata Strip */}
            <div className="p-6 rounded-3xl bg-slate-900/50 border border-slate-800 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h1 className="text-2xl font-bold text-white tracking-tight">{design.title}</h1>
                <div className="text-2xl font-mono font-bold text-emerald-400">
                  ₹{bomData.totalCost?.toLocaleString("en-IN")}
                </div>
              </div>

              <p className="text-sm text-slate-300 leading-relaxed">{design.description}</p>

              {/* Creator & Live Counter Pills */}
              <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-800/80 text-xs text-slate-400">
                <div className="flex items-center space-x-1.5">
                  <span className="text-slate-500">Architect:</span>
                  <span className="text-slate-200 font-medium">{design.user.name || "Anonymous Creator"}</span>
                </div>
                <span>•</span>
                <div className="flex items-center space-x-1">
                  <Eye className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{design.viewCount} views</span>
                </div>
                <span>•</span>
                <div className="flex items-center space-x-1">
                  <GitFork className="w-3.5 h-3.5 text-amber-400" />
                  <span>{design.remixCount} forks / remixes</span>
                </div>
                <span>•</span>
                <div className="flex items-center space-x-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>{new Date(design.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar: Quick Actions & Version History */}
          <div className="space-y-6">
            {/* Action Box */}
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider text-slate-400">
                Architectural Actions
              </h2>

              <RemixButton originalSlug={design.slug} originalTitle={design.title} isFullWidth />

              <Link
                href={`/?load=${design.slug}`}
                className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs transition border border-slate-700"
              >
                <span>Open in 3D Configurator Studio</span>
              </Link>
            </div>

            {/* Version History List */}
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
              <div className="flex items-center space-x-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">Version Commit Timeline</h3>
              </div>

              <div className="space-y-2 pt-2">
                {design.versions.map((ver) => (
                  <div
                    key={ver.id}
                    className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/60 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-emerald-400 font-mono">v{ver.versionNumber}</span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(ver.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <div className="text-slate-300">{ver.commitNote}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Crawlable Technical Specification & BOM Table (SEO Master) */}
        <div className="mt-8 p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                <span>Crawlable Bill of Materials & Technical Spec Sheet</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Full manufacturing schedule with itemized quantities and verified unit pricing
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-2">Line Item Code</th>
                  <th className="py-3 px-2">Description / Component</th>
                  <th className="py-3 px-2">Classification</th>
                  <th className="py-3 px-2">Brand / Origin</th>
                  <th className="py-3 px-2 text-center">Qty</th>
                  <th className="py-3 px-2 text-right">Unit Rate (INR)</th>
                  <th className="py-3 px-2 text-right">Extended Total (INR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {bomData.items?.map((item: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-800/30">
                    <td className="py-3 px-2 font-mono text-cyan-400">{item.code}</td>
                    <td className="py-3 px-2 font-medium text-white">{item.name}</td>
                    <td className="py-3 px-2 text-slate-400">{item.category}</td>
                    <td className="py-3 px-2 text-slate-300">{item.brand || "Standard Modular"}</td>
                    <td className="py-3 px-2 text-center font-mono">{item.count}</td>
                    <td className="py-3 px-2 text-right font-mono">₹{item.unitPrice?.toLocaleString("en-IN")}</td>
                    <td className="py-3 px-2 text-right font-mono font-bold text-emerald-400">
                      ₹{item.total?.toLocaleString("en-IN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pricing Totals Card */}
          <div className="max-w-sm ml-auto p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Fabrication Subtotal</span>
              <span className="font-mono text-slate-200">₹{bomData.subtotal?.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>GST Prefab Levy (18%)</span>
              <span className="font-mono text-slate-200">₹{bomData.tax?.toLocaleString("en-IN")}</span>
            </div>
            <div className="pt-2 border-t border-slate-800 flex justify-between text-sm font-bold">
              <span className="text-white">Total Negotiated Base</span>
              <span className="font-mono text-emerald-400">₹{bomData.totalCost?.toLocaleString("en-IN")}</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
