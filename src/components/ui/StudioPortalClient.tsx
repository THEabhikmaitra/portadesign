"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Wifi, BookOpen, X } from "lucide-react";
import { StudioToolbar } from "@/components/ui/StudioToolbar";
import { FloatingPillCustomizer } from "@/components/ui/FloatingPillCustomizer";
import { PurposePickerOverlay } from "@/components/ui/PurposePickerOverlay";
import { PortalLoadingState } from "@/components/ui/PortalLoadingState";
import { useStudioStore } from "@/store/useStudioStore";

const StudioCanvas = dynamic(
  () => import("@/components/canvas/StudioCanvas").then((m) => m.StudioCanvas),
  { ssr: false, loading: () => <PortalLoadingState /> }
);

const ChallengesDrawer = dynamic(
  () => import("@/components/ui/ChallengesDrawer").then((m) => m.ChallengesDrawer),
  { ssr: false }
);
const LiveBrandQuoteDrawer = dynamic(
  () => import("@/components/ui/LiveBrandQuoteDrawer").then((m) => m.LiveBrandQuoteDrawer),
  { ssr: false }
);
const BomDrawer = dynamic(
  () => import("@/components/ui/BomDrawer").then((m) => m.BomDrawer),
  { ssr: false }
);
const SiteLogisticsDrawer = dynamic(
  () => import("@/components/ui/SiteLogisticsDrawer").then((m) => m.SiteLogisticsDrawer),
  { ssr: false }
);
const BuildReplayBar = dynamic(
  () => import("@/components/ui/BuildReplayBar").then((m) => m.BuildReplayBar),
  { ssr: false }
);
const EquipmentPickerModal = dynamic(
  () => import("@/components/ui/EquipmentPickerModal").then((m) => m.EquipmentPickerModal),
  { ssr: false }
);
const SaveDesignModal = dynamic(
  () => import("@/components/ui/SaveDesignModal").then((m) => m.SaveDesignModal),
  { ssr: false }
);

export const StudioPortalClient: React.FC = () => {
  const [isEquipmentPickerOpen, setIsEquipmentPickerOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [slowNetBanner, setSlowNetBanner] = useState<string | null>(null);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  const loadScene = useStudioStore((s) => s.loadScene);
  const loadCatalog = useStudioStore((s) => s.loadCatalog);
  const setCameraMode = useStudioStore((s) => s.setCameraMode);
  const cameraMode = useStudioStore((s) => s.cameraMode);
  const activeDrawer = useStudioStore((s) => s.activeDrawer);

  // Check for saved scene URL (?design=ID) and slow-network status on mount
  useEffect(() => {
    loadCatalog();
    const params = new URLSearchParams(window.location.search);
    const designId = params.get("design");
    if (designId) {
      fetch(`/api/designs?id=${encodeURIComponent(designId)}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.sceneJson) {
            try {
              const parsed = JSON.parse(data.sceneJson);
              loadScene(parsed);
            } catch {
              // ignore corrupted saved JSON
            }
          }
        })
        .catch(() => {});
    }

    const updateConn = () => {
      if (!navigator.onLine) {
        setSlowNetBanner("Offline mode — 3D changes stay local until back online");
        return;
      }
      const conn = (navigator as any)?.connection;
      const eff = String(conn?.effectiveType || "").toLowerCase();
      if (eff === "slow-2g" || eff === "2g" || eff === "3g" || conn?.saveData) {
        setSlowNetBanner(`${conn?.saveData ? "Data Saver" : eff.toUpperCase()} connection`);
      } else {
        setSlowNetBanner(null);
      }
    };

    updateConn();
    window.addEventListener("online", updateConn);
    window.addEventListener("offline", updateConn);
    const conn = (navigator as any)?.connection;
    conn?.addEventListener?.("change", updateConn);

    return () => {
      window.removeEventListener("online", updateConn);
      window.removeEventListener("offline", updateConn);
      conn?.removeEventListener?.("change", updateConn);
    };
  }, [loadScene]);

  return (
    <>
      {/* 1. Main 3D WebGL Canvas Layer */}
      <div className="absolute inset-0 z-0">
        <StudioCanvas />
      </div>

      {/* Subtle Vignette Depth Overlay */}
      <div className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(circle_at_center,transparent_55%,rgba(226,232,240,0.45)_100%)]" />

      {/* Slow-Internet / Mobile Lite Helper Pill */}
      {slowNetBanner && !bannerDismissed && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-3 py-2 rounded-2xl bg-slate-950/90 border border-amber-500/40 shadow-xl text-[11px] text-amber-200 max-w-[92vw]">
          <Wifi className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="truncate">{slowNetBanner}</span>
          <Link
            href="/guides"
            className="px-2 py-1 rounded-lg bg-emerald-500 text-slate-950 font-bold whitespace-nowrap inline-flex items-center space-x-1"
          >
            <BookOpen className="w-3 h-3" />
            <span>Lite Guides</span>
          </Link>
          <button
            type="button"
            aria-label="Dismiss network notice"
            onClick={() => setBannerDismissed(true)}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 2. Unified Left-Side Icon Rail & Flyouts */}
      <StudioToolbar
        onOpenEquipmentPicker={() => setIsEquipmentPickerOpen(true)}
        onOpenSaveModal={() => setIsSaveModalOpen(true)}
      />

      {/* 3. Contextual Room / Item Customizer Pill */}
      <FloatingPillCustomizer />

      {/* 5. First-Time Empty Plot Purpose Picker */}
      <PurposePickerOverlay />

      {/* 6. Helpful Walk-Inside Exit Pill (only visible in Look Inside mode) */}
      {cameraMode === "firstperson" && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-30 flex items-center space-x-2 px-3 py-1.5 bg-slate-950/90 backdrop-blur-xl border border-cyan-500/40 rounded-full shadow-2xl text-xs text-white max-w-[95vw]">
          <span className="hidden sm:inline whitespace-nowrap">
            Drag to look 360° • WASD / Arrows walk
          </span>
          <div className="flex items-center space-x-1">
            <button
              type="button"
              onClick={() =>
                window.dispatchEvent(new CustomEvent("myprefabroom:nudge-look", { detail: { dYaw: 0.7 } }))
              }
              className="min-w-[34px] min-h-[34px] px-2 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold transition"
              title="Turn Left (Q)"
              aria-label="Turn Camera Left"
            >
              ↺
            </button>
            <button
              type="button"
              onClick={() =>
                window.dispatchEvent(new CustomEvent("myprefabroom:nudge-look", { detail: { dYaw: -0.7 } }))
              }
              className="min-w-[34px] min-h-[34px] px-2 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold transition"
              title="Turn Right (E)"
              aria-label="Turn Camera Right"
            >
              ↻
            </button>
            <button
              type="button"
              onClick={() =>
                window.dispatchEvent(new CustomEvent("myprefabroom:nudge-look", { detail: { reset: true } }))
              }
              className="min-h-[34px] px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold transition"
              title="Reset view center"
            >
              Center
            </button>
          </div>
          <button
            type="button"
            onClick={() => setCameraMode("orbit")}
            className="min-h-[34px] px-3 py-1 rounded-full bg-cyan-500 text-slate-950 font-bold hover:bg-cyan-400 transition whitespace-nowrap"
          >
            Exit Room
          </button>
        </div>
      )}

      {/* 7. Slide-Out Drawers (mount chunks cleanly when opened) */}
      {activeDrawer === "challenges" && <ChallengesDrawer />}
      {activeDrawer === "quotes" && <LiveBrandQuoteDrawer />}
      {activeDrawer === "bom" && <BomDrawer />}
      {activeDrawer === "logistics" && <SiteLogisticsDrawer />}
      <BuildReplayBar />

      {/* 8. On-Demand Modals */}
      {isEquipmentPickerOpen && (
        <EquipmentPickerModal
          isOpen={isEquipmentPickerOpen}
          onClose={() => setIsEquipmentPickerOpen(false)}
        />
      )}

      {isSaveModalOpen && (
        <SaveDesignModal
          isOpen={isSaveModalOpen}
          onClose={() => setIsSaveModalOpen(false)}
        />
      )}
    </>
  );
};
