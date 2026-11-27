"use client";

import React, { useState } from "react";
import { useStudioStore } from "@/store/useStudioStore";
import { EnvironmentType, CameraMode } from "@/types";
import {
  Sun,
  Moon,
  Volume2,
  VolumeX,
  Undo2,
  Redo2,
  Orbit,
  Eye,
  Scan,
  Compass,
  Trophy,
  Tag,
  History,
  Save,
  Box,
  Layers,
  Wrench,
  Building2,
  Cpu,
  Globe,
  MoreHorizontal,
  Sparkles,
  Truck,
} from "lucide-react";

interface StudioToolbarProps {
  onOpenEquipmentPicker: () => void;
  onOpenSaveModal: () => void;
}

export const StudioToolbar: React.FC<StudioToolbarProps> = ({
  onOpenEquipmentPicker,
  onOpenSaveModal,
}) => {
  const [moreOpen, setMoreOpen] = useState(false);

  const environment = useStudioStore((state) => state.environment);
  const setEnvironment = useStudioStore((state) => state.setEnvironment);
  const dayNight = useStudioStore((state) => state.dayNight);
  const toggleDayNight = useStudioStore((state) => state.toggleDayNight);

  const cameraMode = useStudioStore((state) => state.cameraMode);
  const setCameraMode = useStudioStore((state) => state.setCameraMode);

  const isMuted = useStudioStore((state) => state.isMuted);
  const toggleMute = useStudioStore((state) => state.toggleMute);

  const undo = useStudioStore((state) => state.undo);
  const redo = useStudioStore((state) => state.redo);
  const historyIndex = useStudioStore((state) => state.historyIndex);
  const history = useStudioStore((state) => state.history);

  const addCabin = useStudioStore((state) => state.addCabin);
  const cabins = useStudioStore((state) => state.cabins);
  const catalogElements = useStudioStore((state) => state.catalogElements);

  const activeDrawer = useStudioStore((state) => state.activeDrawer);
  const setActiveDrawer = useStudioStore((state) => state.setActiveDrawer);
  const setShowPurposePicker = useStudioStore((state) => state.setShowPurposePicker);

  const cabinOptions = catalogElements.filter((el) => el.category === "CABIN");

  const environments: { id: EnvironmentType; label: string; icon: string }[] = [
    { id: "forest", label: "Garden Lawn", icon: "🏡" },
    { id: "urban", label: "House Rooftop", icon: "🏢" },
    { id: "beach", label: "Beach / Farm", icon: "🏖️" },
    { id: "desert", label: "Sunny Plot", icon: "☀️" },
  ];

  const cameraModes: { id: CameraMode; label: string; icon: any }[] = [
    { id: "orbit", label: "3D View", icon: Orbit },
    { id: "cutaway", label: "Open Roof", icon: Eye },
    { id: "firstperson", label: "Look Inside", icon: Compass },
  ];

  return (
    <>
      {/* Unified Non-Overlapping Top Navigation Bar */}
      {moreOpen && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => setMoreOpen(false)}
          aria-hidden="true"
        />
      )}
      <header className="fixed top-3 inset-x-3 z-40 flex items-center justify-between gap-2 pointer-events-none">
        {/* Left: Brand & Site Selector */}
        <div className="flex items-center space-x-1.5 p-1 bg-slate-950/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl pointer-events-auto shrink-0">
          <button
            onClick={() => setShowPurposePicker(true)}
            className="flex items-center space-x-2 px-2.5 py-1 hover:bg-white/5 rounded-xl transition"
            title="Choose Room Type"
          >
            <div className="w-5 h-5 rounded-md bg-gradient-to-tr from-emerald-400 to-cyan-400 flex items-center justify-center text-slate-950 font-black text-[11px] shadow-sm">
              P
            </div>
            <span className="font-extrabold text-xs tracking-wide text-white hidden sm:inline">
              MyRoom <span className="text-emerald-400">3D</span>
            </span>
          </button>

          <div className="w-px h-4 bg-white/10" />

          {/* Environment Pills */}
          {environments.map((env) => (
            <button
              key={env.id}
              onClick={() => setEnvironment(env.id)}
              aria-label={env.label}
              className={`p-1.5 rounded-xl text-xs transition ${
                environment === env.id
                  ? "bg-white/15 text-white shadow-inner scale-105"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
              title={env.label}
            >
              <span>{env.icon}</span>
            </button>
          ))}

          {/* Day / Night Toggle */}
          <button
            onClick={toggleDayNight}
            aria-label="Toggle Day or Night"
            className={`p-1.5 rounded-xl transition ${
              dayNight === "night"
                ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
            }`}
            title={dayNight === "night" ? "Switch to Daylight" : "Switch to Night Lights"}
          >
            {dayNight === "night" ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Center: Plain Camera Modes */}
        <div className="hidden md:flex items-center space-x-1 p-1 bg-slate-950/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl pointer-events-auto">
          {cameraModes.map((cm) => {
            const Icon = cm.icon;
            const isActive = cameraMode === cm.id;
            return (
              <button
                key={cm.id}
                onClick={() => setCameraMode(cm.id)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                  isActive
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                    : "text-slate-300 hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">{cm.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right: Undo/Redo, Sound, Check Prices, Save & Share, More */}
        <div className="flex items-center space-x-1 p-1 bg-slate-950/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl pointer-events-auto shrink-0 relative">
          <button
            onClick={undo}
            disabled={historyIndex <= 0}
            aria-label="Undo"
            className="p-1.5 rounded-xl text-slate-400 hover:text-white disabled:opacity-25 hover:bg-white/5 transition"
            title="Undo"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={redo}
            disabled={historyIndex >= history.length - 1}
            aria-label="Redo"
            className="p-1.5 rounded-xl text-slate-400 hover:text-white disabled:opacity-25 hover:bg-white/5 transition"
            title="Redo"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={toggleMute}
            aria-label={isMuted ? "Unmute sound" : "Mute sound"}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition"
            title={isMuted ? "Turn Sound On" : "Mute Sound"}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
          </button>

          <div className="w-px h-4 bg-white/10 mx-0.5" />

          {/* Check Makers / Prices */}
          <button
            onClick={() => setActiveDrawer(activeDrawer === "quotes" ? null : "quotes")}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              activeDrawer === "quotes"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                : "text-emerald-300 hover:bg-emerald-500/15"
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Get Quotes</span>
          </button>

          {/* Save & Share */}
          <button
            onClick={onOpenSaveModal}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-bold text-xs transition shadow-md active:scale-95"
          >
            <Save className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Save & Share</span>
          </button>

          <div className="w-px h-4 bg-white/10 mx-0.5" />

          {/* More Dropdown (Accessible on ALL viewports) */}
          <button
            type="button"
            onClick={() => setMoreOpen((prev) => !prev)}
            aria-label="More options"
            aria-expanded={moreOpen}
            className={`flex items-center space-x-1 px-2 py-1.5 rounded-xl text-xs font-medium transition ${
              moreOpen ? "bg-white/15 text-white" : "text-slate-300 hover:text-white hover:bg-white/10"
            }`}
            title="More options & Partner portals"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {moreOpen && (
            <div className="absolute top-full mt-2 right-0 w-56 bg-slate-950/95 backdrop-blur-xl border border-white/15 rounded-2xl shadow-2xl p-1.5 space-y-0.5 z-50 text-xs">
              <button
                type="button"
                onClick={() => {
                  setShowPurposePicker(true);
                  setMoreOpen(false);
                }}
                className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-emerald-300 hover:bg-white/10 transition text-left"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Ready Room Ideas</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setCameraMode("xray");
                  setMoreOpen(false);
                }}
                className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-slate-300 hover:bg-white/10 transition text-left"
              >
                <Scan className="w-3.5 h-3.5 text-cyan-400" />
                <span>Steel Structure X-Ray</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveDrawer(activeDrawer === "versions" ? null : "versions");
                  setMoreOpen(false);
                }}
                className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-slate-300 hover:bg-white/10 transition text-left"
              >
                <History className="w-3.5 h-3.5 text-cyan-400" />
                <span>Watch Build Steps</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveDrawer(activeDrawer === "challenges" ? null : "challenges");
                  setMoreOpen(false);
                }}
                className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-slate-300 hover:bg-white/10 transition text-left"
              >
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                <span>Design Challenges</span>
              </button>

              <div className="my-1 border-t border-white/10" />
              <div className="px-3 py-1 text-[10px] font-bold text-slate-500 uppercase">
                Partner & Admin
              </div>
              <a
                href="/vendor"
                onClick={() => setMoreOpen(false)}
                className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
              >
                <Building2 className="w-3.5 h-3.5 text-amber-400" />
                <span>Maker / Vendor Portal</span>
              </a>
              <a
                href="/admin"
                onClick={() => setMoreOpen(false)}
                className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
              >
                <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                <span>Catalog Admin</span>
              </a>
              <a
                href="/auth/signin"
                onClick={() => setMoreOpen(false)}
                className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
              >
                <Globe className="w-3.5 h-3.5 text-emerald-400" />
                <span>Sign In / Register</span>
              </a>
            </div>
          )}
        </div>
      </header>

      {/* Bottom Plain Action Dock */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center space-x-1.5 p-1.5 bg-slate-950/85 backdrop-blur-xl border border-white/15 rounded-2xl shadow-2xl max-w-[96vw] overflow-x-auto">
        {(cabinOptions.length > 0
          ? cabinOptions
          : [
              { code: "CABIN_20FT", friendlyName: "+ 160 sq.ft Room", iconUrl: null },
              { code: "CABIN_40FT", friendlyName: "+ 320 sq.ft Hall", iconUrl: null },
            ]
        ).map((cab, idx) => (
          <button
            key={cab.code}
            onClick={() => addCabin(cab.code)}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-semibold transition border border-white/5 hover:border-white/20 shrink-0 active:scale-95"
          >
            {cab.iconUrl ? (
              <img src={cab.iconUrl} alt={cab.friendlyName || cab.code} className="w-4 h-4 rounded object-cover" />
            ) : (
              <Box className={`w-4 h-4 ${idx % 2 === 0 ? "text-emerald-400" : "text-cyan-400"}`} />
            )}
            <span>
              {(cab.friendlyName || cab.code).startsWith("+")
                ? cab.friendlyName
                : `+ ${cab.friendlyName || cab.code}`}
            </span>
          </button>
        ))}

        {cabins.length > 0 && (
          <button
            onClick={() => {
              const last = cabins[cabins.length - 1];
              addCabin(last?.type || cabinOptions[0]?.code || "CABIN_20FT", 1, "top");
            }}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 text-indigo-200 text-xs font-semibold transition shrink-0 active:scale-95"
          >
            <Layers className="w-4 h-4 text-indigo-400" />
            <span>+ 2nd Floor</span>
          </button>
        )}

        <div className="w-px h-6 bg-white/10 mx-0.5 shrink-0" />

        <button
          onClick={onOpenEquipmentPicker}
          className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 text-xs font-bold transition shadow-md shrink-0 active:scale-95"
        >
          <Wrench className="w-4 h-4 text-amber-400" />
          <span>+ Furniture & AC</span>
        </button>

        <button
          onClick={() => setActiveDrawer(activeDrawer === "logistics" ? null : "logistics")}
          className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl border text-xs font-bold transition shrink-0 active:scale-95 ${
            activeDrawer === "logistics"
              ? "bg-cyan-500/25 border-cyan-400 text-cyan-200"
              : "bg-white/5 hover:bg-white/10 border-white/10 text-cyan-300"
          }`}
          title="2nd Hand option, Transport cost, Crane & Heat Roof"
        >
          <Truck className="w-4 h-4 text-cyan-400" />
          <span>2nd Hand & Transport</span>
        </button>
      </div>
    </>
  );
};
