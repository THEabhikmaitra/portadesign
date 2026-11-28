"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useStudioStore } from "@/store/useStudioStore";
import {
  Home,
  Trees,
  BedDouble,
  Store,
  Loader2,
  Image as ImageIcon,
  X,
  Search,
  Eye,
  Share2,
  GitFork,
  User as UserIcon,
} from "lucide-react";

const PRESET_ICONS: Record<string, any> = {
  "terrace-room": Home,
  "garden-studio": Trees,
  "guest-suite": BedDouble,
  "cafe-shop": Store,
};

interface PublicDesignRow {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  previewImage: string | null;
  viewCount: number;
  shareCount: number;
  remixCount: number;
  user?: { name?: string | null };
  versions?: Array<{ sceneJson: string; bomJson: string }>;
}

function parseApproxTotal(bomJson?: string): string | null {
  try {
    const bom = bomJson ? JSON.parse(bomJson) : null;
    if (!bom?.totalCost) return null;
    return `₹${Number(bom.totalCost).toLocaleString("en-IN")}`;
  } catch {
    return null;
  }
}

export const PurposePickerOverlay: React.FC = () => {
  const showPurposePicker = useStudioStore((state) => state.showPurposePicker);
  const setShowPurposePicker = useStudioStore((state) => state.setShowPurposePicker);
  const applyPreset = useStudioStore((state) => state.applyPreset);
  const loadScene = useStudioStore((state) => state.loadScene);
  const catalogPresets = useStudioStore((state) => state.catalogPresets);
  const catalogLoaded = useStudioStore((state) => state.catalogLoaded);
  const loadCatalog = useStudioStore((state) => state.loadCatalog);

  const [searchQuery, setSearchQuery] = useState("");
  const [publicDesigns, setPublicDesigns] = useState<PublicDesignRow[]>([]);
  const [loadingPublic, setLoadingPublic] = useState(false);

  useEffect(() => {
    if (showPurposePicker && !catalogLoaded) {
      loadCatalog();
    }
    if (showPurposePicker) {
      setLoadingPublic(true);
      fetch("/api/designs?public=true", { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : { designs: [] }))
        .then((d) => setPublicDesigns(d.designs || []))
        .catch(() => {})
        .finally(() => setLoadingPublic(false));
    }
  }, [showPurposePicker, catalogLoaded, loadCatalog]);

  const q = searchQuery.trim().toLowerCase();

  const filteredPresets = useMemo(() => {
    if (!q) return catalogPresets;
    return catalogPresets.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        (p.subtitle || "").toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q)
    );
  }, [catalogPresets, q]);

  const filteredPublic = useMemo(() => {
    if (!q) return publicDesigns;
    return publicDesigns.filter(
      (d) =>
        d.title.toLowerCase().includes(q) ||
        (d.description || "").toLowerCase().includes(q) ||
        (d.user?.name || "").toLowerCase().includes(q)
    );
  }, [publicDesigns, q]);

  if (!showPurposePicker) return null;

  const handleLoadPublicDesign = async (design: PublicDesignRow) => {
    const latest = design.versions?.[0];
    if (latest?.sceneJson) {
      try {
        const parsed = JSON.parse(latest.sceneJson);
        loadScene(parsed);
        setShowPurposePicker(false);
        fetch(`/api/designs/${design.slug}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "increment_view" }),
        }).catch(() => {});
        return;
      } catch {
        // fallback to navigation if sceneJson malformed
      }
    }
    window.location.href = `/design/${design.slug}`;
  };

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center p-3 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-slate-950/95 border border-white/15 rounded-2xl shadow-2xl p-4 sm:p-5 text-white max-h-[88vh] overflow-y-auto space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-bold text-white tracking-tight">Pick a Model</h2>
          <div className="flex items-center space-x-1.5">
            <button
              type="button"
              onClick={() => setShowPurposePicker(false)}
              className="px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/15 text-[11px] font-medium text-slate-300 hover:text-white transition"
            >
              Empty Plot
            </button>
            <button
              type="button"
              onClick={() => setShowPurposePicker(false)}
              aria-label="Close model picker"
              className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search Field */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search starter models, public designs, or creator name..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Section 1: Starter Models (from Admin) */}
        <section className="space-y-2">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Starter Models ({filteredPresets.length})
          </div>
          {!catalogLoaded ? (
            <div className="py-8 flex items-center justify-center text-slate-400">
              <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />
            </div>
          ) : filteredPresets.length === 0 ? (
            <div className="p-4 rounded-xl border border-white/10 bg-white/5 text-center text-xs text-slate-400">
              No starter models match your search.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2.5">
              {filteredPresets.map((preset) => {
                const Icon = PRESET_ICONS[preset.iconName || preset.code] || Home;
                return (
                  <button
                    key={preset.code}
                    type="button"
                    onClick={() => applyPreset(preset.code)}
                    className="group relative aspect-[16/10] w-full rounded-xl overflow-hidden border border-slate-200 hover:border-emerald-500 bg-white text-left shadow-sm hover:shadow-md transition-all active:scale-[0.98]"
                  >
                    {preset.thumbUrl ? (
                      <img
                        src={preset.thumbUrl}
                        alt={preset.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-emerald-50 via-slate-50 to-cyan-50 flex items-center justify-center">
                        <Icon className="w-8 h-8 text-emerald-600/80 group-hover:scale-110 transition" />
                        <ImageIcon className="w-3.5 h-3.5 text-slate-400 absolute top-2 right-2" />
                      </div>
                    )}

                    <div className="absolute inset-x-0 bottom-0 px-2.5 py-2 bg-white/90 backdrop-blur-sm border-t border-slate-200/80 flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-slate-900 truncate group-hover:text-emerald-700 transition">
                        {preset.title}
                      </span>
                      <span className="text-[11px] font-bold font-mono text-emerald-700 shrink-0">
                        {preset.approxPriceLabel}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* Section 2: Public Designs */}
        <section className="space-y-2 pt-2 border-t border-white/10">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Public Community Designs ({filteredPublic.length})
          </div>
          {loadingPublic ? (
            <div className="py-6 flex items-center justify-center text-slate-400">
              <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
            </div>
          ) : filteredPublic.length === 0 ? (
            <div className="p-4 rounded-xl border border-white/10 bg-white/5 text-center text-xs text-slate-400">
              No public designs found. Save a design as Public to share it here.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {filteredPublic.map((design) => {
                const price = parseApproxTotal(design.versions?.[0]?.bomJson);
                return (
                  <button
                    key={design.id}
                    type="button"
                    onClick={() => handleLoadPublicDesign(design)}
                    className="group rounded-xl overflow-hidden border border-slate-800 hover:border-emerald-400 bg-slate-900 text-left transition-all flex flex-col"
                  >
                    <div className="relative h-28 w-full bg-slate-950 flex items-center justify-center overflow-hidden">
                      {design.previewImage ? (
                        <img
                          src={design.previewImage}
                          alt={design.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                      ) : (
                        <Home className="w-7 h-7 text-slate-700" />
                      )}
                      {price && (
                        <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-slate-950/85 border border-emerald-500/40 text-[10px] font-mono font-bold text-emerald-300">
                          {price}
                        </span>
                      )}
                    </div>
                    <div className="p-2.5 space-y-1.5">
                      <div className="text-xs font-bold text-white truncate group-hover:text-emerald-300">
                        {design.title}
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span className="inline-flex items-center space-x-1 truncate">
                          <UserIcon className="w-3 h-3 text-slate-500 shrink-0" />
                          <span className="truncate">{design.user?.name || "Creator"}</span>
                        </span>
                        <div className="flex items-center space-x-2 font-mono shrink-0">
                          <span className="inline-flex items-center space-x-0.5" title="Views">
                            <Eye className="w-3 h-3 text-cyan-400" />
                            <span>{design.viewCount}</span>
                          </span>
                          <span className="inline-flex items-center space-x-0.5" title="Shares">
                            <Share2 className="w-3 h-3 text-emerald-400" />
                            <span>{design.shareCount}</span>
                          </span>
                          <span className="inline-flex items-center space-x-0.5" title="Remixes">
                            <GitFork className="w-3 h-3 text-amber-400" />
                            <span>{design.remixCount}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
