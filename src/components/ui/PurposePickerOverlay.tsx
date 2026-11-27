"use client";

import React from "react";
import Link from "next/link";
import { useStudioStore } from "@/store/useStudioStore";
import {
  Home,
  Trees,
  BedDouble,
  Store,
  Loader2,
  ShieldCheck,
  Image as ImageIcon,
  X,
} from "lucide-react";

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
    <div className="fixed inset-0 z-30 flex items-center justify-center p-3 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-slate-950/92 border border-white/15 rounded-2xl shadow-2xl p-4 text-white max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between gap-2 mb-3">
          <h1 className="text-sm font-bold text-white tracking-tight">Pick a Model</h1>
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

        {!catalogLoaded ? (
          <div className="py-10 flex items-center justify-center text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />
          </div>
        ) : catalogPresets.length === 0 ? (
          <div className="p-5 rounded-xl border border-white/10 bg-white/5 text-center space-y-2.5">
            <div className="text-xs text-slate-400">No models uploaded yet</div>
            <Link
              href="/admin"
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-xs font-semibold hover:bg-cyan-500/30 transition"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Admin Upload</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2.5">
            {catalogPresets.map((preset) => {
              const Icon = PRESET_ICONS[preset.iconName || preset.code] || Home;
              return (
                <button
                  key={preset.code}
                  type="button"
                  onClick={() => applyPreset(preset.code)}
                  className="group relative aspect-[16/10] w-full rounded-xl overflow-hidden border border-white/15 hover:border-emerald-400 bg-slate-900 text-left shadow-lg transition-all active:scale-[0.98]"
                >
                  {preset.thumbUrl ? (
                    <img
                      src={preset.thumbUrl}
                      alt={preset.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 flex items-center justify-center">
                      <Icon className="w-8 h-8 text-emerald-400/70 group-hover:scale-110 transition" />
                      <ImageIcon className="w-3.5 h-3.5 text-slate-600 absolute top-2 right-2" />
                    </div>
                  )}

                  <div className="absolute inset-x-0 bottom-0 px-2.5 py-2 bg-gradient-to-t from-slate-950 via-slate-950/85 to-transparent flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-white truncate group-hover:text-emerald-300 transition">
                      {preset.title}
                    </span>
                    <span className="text-[11px] font-bold font-mono text-emerald-400 shrink-0">
                      {preset.approxPriceLabel}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
