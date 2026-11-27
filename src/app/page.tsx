"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { StudioToolbar } from "@/components/ui/StudioToolbar";

const StudioCanvas = dynamic(
  () => import("@/components/canvas/StudioCanvas").then((m) => m.StudioCanvas),
  { ssr: false }
);
import { BuildScoreHUD } from "@/components/ui/BuildScoreHUD";
import { FloatingPillCustomizer } from "@/components/ui/FloatingPillCustomizer";
import { EquipmentPickerModal } from "@/components/ui/EquipmentPickerModal";
import { PurposePickerOverlay } from "@/components/ui/PurposePickerOverlay";
import { ChallengesDrawer } from "@/components/ui/ChallengesDrawer";
import { LiveBrandQuoteDrawer } from "@/components/ui/LiveBrandQuoteDrawer";
import { BomDrawer } from "@/components/ui/BomDrawer";
import { SiteLogisticsDrawer } from "@/components/ui/SiteLogisticsDrawer";
import { BuildReplayBar } from "@/components/ui/BuildReplayBar";
import { SaveDesignModal } from "@/components/ui/SaveDesignModal";
import { useStudioStore } from "@/store/useStudioStore";

export default function StudioPage() {
  const [isEquipmentPickerOpen, setIsEquipmentPickerOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);

  const loadScene = useStudioStore((state) => state.loadScene);
  const loadCatalog = useStudioStore((state) => state.loadCatalog);
  const cameraMode = useStudioStore((state) => state.cameraMode);
  const setCameraMode = useStudioStore((state) => state.setCameraMode);

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  // Load shared or remixed design when ?load= or ?remix= query param is present
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const slug = params.get("load") || params.get("remix");
    if (slug) {
      fetch(`/api/designs/${slug}`)
        .then((r) => r.json())
        .then((data) => {
          const latest = data?.design?.versions?.[0];
          if (latest?.sceneJson) {
            loadScene(JSON.parse(latest.sceneJson));
          }
        })
        .catch(() => {});
    }
  }, [loadScene]);

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans select-none">
      {/* 1. Main 3D WebGL Canvas Layer */}
      <div className="absolute inset-0 z-0">
        <StudioCanvas />
      </div>

      {/* Subtle Vignette Depth Overlay */}
      <div className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(circle_at_center,transparent_50%,rgba(2,6,23,0.45)_100%)]" />

      {/* 2. Unified Non-Overlapping Top Navigation & Bottom Dock */}
      <StudioToolbar
        onOpenEquipmentPicker={() => setIsEquipmentPickerOpen(true)}
        onOpenSaveModal={() => setIsSaveModalOpen(true)}
      />

      {/* 3. Friendly Budget & Comfort Summary HUD */}
      <BuildScoreHUD />

      {/* 4. Contextual Room / Item Customizer Pill */}
      <FloatingPillCustomizer />

      {/* 5. First-Time Empty Plot Purpose Picker */}
      <PurposePickerOverlay />

      {/* 6. Helpful Walk-Inside Exit Pill (only visible in Look Inside mode) */}
      {cameraMode === "firstperson" && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-30 flex items-center space-x-3 px-4 py-2 bg-slate-950/90 backdrop-blur-xl border border-cyan-500/40 rounded-full shadow-2xl text-xs text-white">
          <span>Use Arrow Keys or W/A/S/D to walk inside</span>
          <button
            onClick={() => setCameraMode("orbit")}
            className="px-2.5 py-1 rounded-full bg-cyan-500 text-slate-950 font-bold hover:bg-cyan-400 transition"
          >
            Exit Room
          </button>
        </div>
      )}

      {/* 7. Slide-Out Drawers */}
      <ChallengesDrawer />
      <LiveBrandQuoteDrawer />
      <BomDrawer />
      <SiteLogisticsDrawer />
      <BuildReplayBar />

      {/* 8. Modals */}
      <EquipmentPickerModal
        isOpen={isEquipmentPickerOpen}
        onClose={() => setIsEquipmentPickerOpen(false)}
      />

      <SaveDesignModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
      />
    </main>
  );
}
