"use client";

import React, { useState } from "react";
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

export default function StudioPage() {
  const [isEquipmentPickerOpen, setIsEquipmentPickerOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans select-none">
      {/* 1. Main 3D WebGL Canvas Layer */}
      <div className="absolute inset-0 z-0">
        <StudioCanvas />
      </div>

      {/* Subtle Vignette & Cinema Depth Overlay */}
      <div className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(circle_at_center,transparent_45%,rgba(2,6,23,0.6)_100%)]" />

      {/* 2. Unified Non-Overlapping Top Navigation Bar */}
      <StudioToolbar
        onOpenEquipmentPicker={() => setIsEquipmentPickerOpen(true)}
        onOpenSaveModal={() => setIsSaveModalOpen(true)}
      />

      {/* 3. Engineering & Budget Score HUD (Positioned cleanly below top bar) */}
      <BuildScoreHUD />

      {/* 4. Entity Inspector (Positioned cleanly above bottom dock) */}
      <FloatingPillCustomizer />

      {/* 5. Slide-Out Drawers */}
      <ChallengesDrawer />
      <LiveBrandQuoteDrawer />
      <BomDrawer />
      <BuildReplayBar />

      {/* 6. Modals */}
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
