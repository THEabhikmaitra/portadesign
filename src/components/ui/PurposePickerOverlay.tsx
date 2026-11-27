"use client";

import React from "react";
import Link from "next/link";
import { useStudioStore } from "@/store/useStudioStore";
import { Home, Trees, BedDouble, Store, ArrowRight, Sparkles, Loader2, ShieldCheck } from "lucide-react";

const PRESET_ICONS: Record<string, any> = {
  "terrace-room": Home,
  "garden-studio": Trees,
  "guest-suite": BedDouble,
  "cafe-shop": Store,
};

export const PurposePickerOverlay: React.FC = () => {
  const showPurposePicker = useStudioStore((state) => state.showPurposePicker);
  const setShowPurposePicker = useStudioStore((state) => state.setShowPurposePicker);
  const applyPreset = useStudioStore((state) => state.applyPreset);
  const catalogPresets = useStudioStore((state) => state.catalogPresets);
  const catalogLoaded = useStudioStore((state) => state.catalogLoaded);

  if (!showPurposePicker) return null;

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center p-4 bg-slate-950/55 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-3xl bg-slate-950/90 border border-white/15 rounded-3xl shadow-2xl p-6 sm:p-8 text-white max-h-[90vh] overflow-y-auto">
        <div className="text-center max-w-xl mx-auto mb-6">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Dynamic 3D Modular Configurator • Instant Live Quotes</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            What would you like to build today?
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1.5">
            Pick a ready room to view in 3D, or start on an open plot. Tap anything to customize paint, glass & utilities.
          </p>
        </div>

        {!catalogLoaded ? (
          <div className="py-12 flex flex-col items-center justify-center text-slate-400 text-xs space-y-2">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
            <span>Loading live catalog from server...</span>
          </div>
        ) : catalogPresets.length === 0 ? (
          <div className="p-6 rounded-2xl border border-white/10 bg-white/5 text-center space-y-3">
            <p className="text-xs text-slate-300">No room presets configured yet in Catalog Admin.</p>
            <Link
              href="/admin"
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-xs font-semibold hover:bg-cyan-500/30 transition"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Configure Presets in Admin</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {catalogPresets.map((preset) => {
              const Icon = PRESET_ICONS[preset.iconName || preset.code] || Home;
              return (
                <button
                  key={preset.code}
                  onClick={() => applyPreset(preset.code)}
                  className="group text-left p-4 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-emerald-400/60 transition-all duration-200 flex flex-col justify-between shadow-lg active:scale-[0.99]"
                >
                  <div>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        {preset.thumbUrl ? (
                          <img
                            src={preset.thumbUrl}
                            alt={preset.title}
                            className="w-11 h-11 rounded-xl object-cover border border-white/15 shrink-0"
                          />
                        ) : (
                          <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 group-hover:bg-emerald-500/25 transition shrink-0">
                            <Icon className="w-5 h-5" />
                          </div>
                        )}
                        <div>
                          <h3 className="text-sm font-bold text-white group-hover:text-emerald-300 transition">
                            {preset.title}
                          </h3>
                          <span className="text-[11px] text-slate-400">{preset.sizeLabel}</span>
                        </div>
                      </div>
                      {preset.badge && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300">
                          {preset.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">{preset.subtitle}</p>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between">
                    <span className="text-sm font-bold font-mono text-emerald-400">
                      {preset.approxPriceLabel}
                    </span>
                    <span className="text-xs font-semibold text-emerald-300 flex items-center space-x-1 group-hover:translate-x-1 transition">
                      <span>Open in 3D</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        <div className="mt-5 text-center">
          <button
            onClick={() => setShowPurposePicker(false)}
            className="text-xs text-slate-400 hover:text-white underline underline-offset-4 transition"
          >
            Or start from an empty lawn plot
          </button>
        </div>
      </div>
    </div>
  );
};
