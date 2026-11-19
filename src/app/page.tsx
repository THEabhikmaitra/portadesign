"use client";

import React, { useState } from "react";
import Link from "next/link";
import { StudioCanvas } from "@/components/canvas/StudioCanvas";
import { StudioToolbar } from "@/components/ui/StudioToolbar";
import { BuildScoreHUD } from "@/components/ui/BuildScoreHUD";
import { FloatingPillCustomizer } from "@/components/ui/FloatingPillCustomizer";
import { EquipmentPickerModal } from "@/components/ui/EquipmentPickerModal";
import { ChallengesDrawer } from "@/components/ui/ChallengesDrawer";
import { LiveBrandQuoteDrawer } from "@/components/ui/LiveBrandQuoteDrawer";
import { BomDrawer } from "@/components/ui/BomDrawer";
import { BuildReplayBar } from "@/components/ui/BuildReplayBar";
import { SaveDesignModal } from "@/components/ui/SaveDesignModal";
import { Building2, Cpu, ExternalLink, HelpCircle } from "lucide-react";

export default function StudioPage() {
  const [isEquipmentPickerOpen, setIsEquipmentPickerOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [showHelpHint, setShowHelpHint] = useState(true);

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans">
      {/* 1. Main 3D WebGL Canvas Layer */}
      <div className="absolute inset-0 z-0">
        <StudioCanvas />
      </div>

      {/* 2. Top Portal Quick Nav Navigation */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 hidden md:flex items-center space-x-2 px-3 py-1.5 bg-slate-900/80 backdrop-blur-md border border-slate-700/60 rounded-2xl text-xs">
        <Link
          href="/vendor"
          className="flex items-center space-x-1 px-2.5 py-1 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition"
        >
          <Building2 className="w-3.5 h-3.5 text-amber-400" />
          <span>Vendor Portal</span>
        </Link>
        <span className="text-slate-600">•</span>
        <Link
          href="/admin"
          className="flex items-center space-x-1 px-2.5 py-1 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition"
        >
          <Cpu className="w-3.5 h-3.5 text-cyan-400" />
          <span>Ollama AI Admin</span>
        </Link>
        <span className="text-slate-600">•</span>
        <Link
          href="/design/solara-desert-studio-20ft"
          className="flex items-center space-x-1 px-2.5 py-1 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition"
        >
          <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
          <span>Public SSR Spec</span>
        </Link>
      </div>

      {/* 3. Interactive Floating Tools & Panels */}
      <StudioToolbar
        onOpenEquipmentPicker={() => setIsEquipmentPickerOpen(true)}
        onOpenSaveModal={() => setIsSaveModalOpen(true)}
      />

      <BuildScoreHUD />

      <FloatingPillCustomizer />

      {/* 4. Slide-Out Drawers */}
      <ChallengesDrawer />
      <LiveBrandQuoteDrawer />
      <BomDrawer />
      <BuildReplayBar />

      {/* 5. Modals */}
      <EquipmentPickerModal
        isOpen={isEquipmentPickerOpen}
        onClose={() => setIsEquipmentPickerOpen(false)}
      />

      <SaveDesignModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
      />

      {/* 6. First-Time User Controls Helper Toast */}
      {showHelpHint && (
        <div className="absolute bottom-20 left-6 z-20 max-w-xs p-3 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-2xl shadow-xl text-xs text-slate-300 flex items-start space-x-2.5">
          <HelpCircle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-semibold text-white">Interactive 3D Studio</div>
            <div className="text-[11px] text-slate-400 mt-0.5 leading-snug">
              • <strong>Click</strong> container, doors, or equipment to customize finish & brands.<br />
              • Use <strong>Stack 2nd Story</strong> or <strong>Equipment Catalog</strong> to furnish.<br />
              • Press <kbd className="px-1 py-0.5 bg-slate-800 rounded font-mono text-emerald-400">R</kbd> to rotate while placing.
            </div>
          </div>
          <button
            onClick={() => setShowHelpHint(false)}
            className="text-slate-500 hover:text-white p-1"
          >
            ×
          </button>
        </div>
      )}
    </main>
  );
}
