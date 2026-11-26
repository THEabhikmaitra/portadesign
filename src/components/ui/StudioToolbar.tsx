"use client";

import React from "react";
import Link from "next/link";
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
} from "lucide-react";

interface StudioToolbarProps {
  onOpenEquipmentPicker: () => void;
  onOpenSaveModal: () => void;
}

export const StudioToolbar: React.FC<StudioToolbarProps> = ({
  onOpenEquipmentPicker,
  onOpenSaveModal,
}) => {
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

  const activeDrawer = useStudioStore((state) => state.activeDrawer);
  const setActiveDrawer = useStudioStore((state) => state.setActiveDrawer);

  const environments: { id: EnvironmentType; label: string; icon: string }[] = [
    { id: "desert", label: "Desert", icon: "🏜️" },
    { id: "beach", label: "Beach", icon: "🏖️" },
    { id: "urban", label: "Urban", icon: "🏙️" },
    { id: "forest", label: "Forest", icon: "🌲" },
  ];

  const cameraModes: { id: CameraMode; label: string; icon: any }[] = [
    { id: "orbit", label: "Orbit", icon: Orbit },
    { id: "cutaway", label: "Cutaway", icon: Eye },
    { id: "xray", label: "X-Ray", icon: Scan },
    { id: "firstperson", label: "Walk", icon: Compass },
  ];

  return (
    <>
      {/* Unified Non-Overlapping Top Navigation Header Bar */}
      <header className="fixed top-3 inset-x-3 z-20 flex items-center justify-between gap-2 pointer-events-none">
        {/* Left Section: Brand & Environment */}
        <div className="flex items-center space-x-1.5 p-1 bg-slate-950/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl pointer-events-auto shrink-0">
          <div className="flex items-center space-x-2 px-2.5 py-1">
            <div className="w-5 h-5 rounded-md bg-gradient-to-tr from-emerald-400 to-cyan-400 flex items-center justify-center text-slate-950 font-black text-[11px] shadow-sm">
              P
            </div>
            <span className="font-extrabold text-xs tracking-wider text-white hidden sm:inline">
              PORTA<span className="text-emerald-400">DESIGN</span>
            </span>
          </div>

          <div className="w-px h-4 bg-white/10" />

          {/* Environment Pills */}
          {environments.map((env) => (
            <button
              key={env.id}
              onClick={() => setEnvironment(env.id)}
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
            className={`p-1.5 rounded-xl transition ${
              dayNight === "night"
                ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
            }`}
            title={`Toggle Day/Night (${dayNight})`}
          >
            {dayNight === "night" ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Center Section: Camera Modes & Hub Links */}
        <div className="hidden md:flex items-center space-x-1 p-1 bg-slate-950/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl pointer-events-auto">
          {cameraModes.map((cm) => {
            const Icon = cm.icon;
            const isActive = cameraMode === cm.id;
            return (
              <button
                key={cm.id}
                onClick={() => setCameraMode(cm.id)}
                className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                  isActive
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                }`}
                title={cm.label}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">{cm.label}</span>
              </button>
            );
          })}

          <div className="w-px h-4 bg-white/10 mx-1" />

          {/* Portal Links */}
          <Link
            href="/vendor"
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl text-xs text-slate-300 hover:text-white hover:bg-white/10 transition font-medium"
            title="Vendor Portal"
          >
            <Building2 className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden xl:inline">Vendor</span>
          </Link>
          <Link
            href="/admin"
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl text-xs text-slate-300 hover:text-white hover:bg-white/10 transition font-medium"
            title="AI Ingestion Admin"
          >
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden xl:inline">AI</span>
          </Link>
          <Link
            href="/design/solara-desert-studio-20ft"
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl text-xs text-slate-300 hover:text-white hover:bg-white/10 transition font-medium"
            title="Public Spec Page"
          >
            <Globe className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden xl:inline">Spec</span>
          </Link>
        </div>

        {/* Right Section: Actions */}
        <div className="flex items-center space-x-1 p-1 bg-slate-950/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl pointer-events-auto shrink-0">
          {/* Undo / Redo */}
          <button
            onClick={undo}
            disabled={historyIndex <= 0}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white disabled:opacity-25 hover:bg-white/5 transition"
            title="Undo"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={redo}
            disabled={historyIndex >= history.length - 1}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white disabled:opacity-25 hover:bg-white/5 transition"
            title="Redo"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={toggleMute}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition"
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
          </button>

          <div className="w-px h-4 bg-white/10 mx-0.5" />

          {/* Missions Pill */}
          <button
            onClick={() => setActiveDrawer(activeDrawer === "challenges" ? null : "challenges")}
            className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition ${
              activeDrawer === "challenges"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                : "text-amber-400 hover:bg-amber-500/10"
            }`}
            title="Design Missions"
          >
            <Trophy className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Missions</span>
          </button>

          {/* Quotes Pill */}
          <button
            onClick={() => setActiveDrawer(activeDrawer === "quotes" ? null : "quotes")}
            className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition ${
              activeDrawer === "quotes"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                : "text-emerald-400 hover:bg-emerald-500/10"
            }`}
            title="Brand Quotes"
          >
            <Tag className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Quotes</span>
          </button>

          {/* Save Button */}
          <button
            onClick={onOpenSaveModal}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-bold text-xs transition shadow-md shadow-emerald-500/20 active:scale-95"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save</span>
          </button>
        </div>
      </header>

      {/* Bottom Main Action Dock */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center space-x-1.5 p-1.5 bg-slate-950/85 backdrop-blur-xl border border-white/15 rounded-2xl shadow-2xl">
        <button
          onClick={() => addCabin("CABIN_20FT")}
          className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-semibold transition border border-white/5 hover:border-white/20 active:scale-95"
          title="Add 20ft Container"
        >
          <Box className="w-4 h-4 text-emerald-400" />
          <span>+20ft</span>
        </button>

        <button
          onClick={() => addCabin("CABIN_40FT")}
          className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-semibold transition border border-white/5 hover:border-white/20 active:scale-95"
          title="Add 40ft High-Cube Container"
        >
          <Box className="w-4 h-4 text-cyan-400" />
          <span>+40ft</span>
        </button>

        <button
          onClick={() => {
            const last = cabins[cabins.length - 1];
            addCabin(last?.type || "CABIN_20FT", 1, "top");
          }}
          className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 text-indigo-300 text-xs font-semibold transition active:scale-95"
          title="Stack 2nd Story"
        >
          <Layers className="w-4 h-4 text-indigo-400" />
          <span>+Story</span>
        </button>

        <div className="w-px h-6 bg-white/10 mx-0.5" />

        <button
          onClick={onOpenEquipmentPicker}
          className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold transition shadow-md shadow-amber-500/10 active:scale-95"
        >
          <Wrench className="w-4 h-4 text-amber-400" />
          <span>Equipment</span>
        </button>

        <button
          onClick={() => setActiveDrawer(activeDrawer === "versions" ? null : "versions")}
          className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold transition border border-white/5 hover:border-white/20 active:scale-95"
          title="3D Assembly Timeline"
        >
          <History className="w-4 h-4 text-cyan-400" />
          <span>Replay</span>
        </button>
      </div>
    </>
  );
};
