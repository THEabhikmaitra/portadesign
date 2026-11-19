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
  Plus,
  Box,
  Layers,
  Wrench,
  Share2,
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
    { id: "urban", label: "Rooftop", icon: "🏙️" },
    { id: "forest", label: "Forest", icon: "🌲" },
  ];

  const cameraModes: { id: CameraMode; label: string; icon: any }[] = [
    { id: "orbit", label: "Orbit 360°", icon: Orbit },
    { id: "cutaway", label: "Cutaway", icon: Eye },
    { id: "xray", label: "X-Ray", icon: Scan },
    { id: "firstperson", label: "1st Person", icon: Compass },
  ];

  return (
    <>
      {/* Top Header Bar */}
      <header className="absolute top-4 left-4 z-20 flex items-center space-x-2">
        {/* Brand Pill */}
        <div className="flex items-center space-x-2.5 px-3.5 py-2 bg-slate-900/85 backdrop-blur-md border border-slate-700/80 rounded-2xl shadow-xl">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center text-slate-950 font-black text-xs">
            P
          </div>
          <div>
            <div className="font-bold text-xs tracking-wider text-white">PORTACRAFT 3D</div>
            <div className="text-[9px] text-emerald-400 font-mono">100% OFFLINE ENGINE</div>
          </div>
        </div>

        {/* Environment & Day/Night Toggle */}
        <div className="flex items-center space-x-1 p-1 bg-slate-900/85 backdrop-blur-md border border-slate-700/80 rounded-2xl shadow-xl">
          {environments.map((env) => (
            <button
              key={env.id}
              onClick={() => setEnvironment(env.id)}
              className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-xl text-xs font-medium transition ${
                environment === env.id
                  ? "bg-slate-700 text-white shadow"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              }`}
              title={`${env.label} Environment`}
            >
              <span>{env.icon}</span>
              <span className="hidden sm:inline">{env.label}</span>
            </button>
          ))}

          <div className="w-px h-4 bg-slate-700 mx-0.5" />

          {/* Day / Night Switch */}
          <button
            onClick={toggleDayNight}
            className={`p-1.5 rounded-xl text-xs transition ${
              dayNight === "night"
                ? "bg-indigo-950 text-indigo-300 border border-indigo-700"
                : "bg-amber-950/50 text-amber-300 border border-amber-700/50"
            }`}
            title={`Toggle Day/Night (Currently ${dayNight})`}
          >
            {dayNight === "night" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>
        </div>

        {/* Camera Modes */}
        <div className="hidden md:flex items-center space-x-1 p-1 bg-slate-900/85 backdrop-blur-md border border-slate-700/80 rounded-2xl shadow-xl">
          {cameraModes.map((cm) => {
            const Icon = cm.icon;
            return (
              <button
                key={cm.id}
                onClick={() => setCameraMode(cm.id)}
                className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-xl text-xs font-medium transition ${
                  cameraMode === cm.id
                    ? "bg-cyan-950 text-cyan-300 border border-cyan-700"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                }`}
                title={cm.label}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cm.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Top Center-Right Utility Tray */}
      <div className="absolute top-4 right-88 z-20 hidden lg:flex items-center space-x-1 p-1 bg-slate-900/85 backdrop-blur-md border border-slate-700/80 rounded-2xl shadow-xl">
        {/* Undo / Redo */}
        <button
          onClick={undo}
          disabled={historyIndex <= 0}
          className="p-1.5 rounded-xl text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 hover:bg-slate-800 transition"
          title="Undo (Ctrl+Z)"
        >
          <Undo2 className="w-4 h-4" />
        </button>
        <button
          onClick={redo}
          disabled={historyIndex >= history.length - 1}
          className="p-1.5 rounded-xl text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 hover:bg-slate-800 transition"
          title="Redo (Ctrl+Y)"
        >
          <Redo2 className="w-4 h-4" />
        </button>

        <div className="w-px h-4 bg-slate-700 mx-0.5" />

        {/* Audio Mute */}
        <button
          onClick={toggleMute}
          className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          title={isMuted ? "Unmute Audio SFX" : "Mute Audio SFX"}
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
        </button>

        <div className="w-px h-4 bg-slate-700 mx-0.5" />

        {/* Challenges Drawer Button */}
        <button
          onClick={() => setActiveDrawer(activeDrawer === "challenges" ? null : "challenges")}
          className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition ${
            activeDrawer === "challenges"
              ? "bg-amber-950 text-amber-300 border border-amber-700"
              : "text-amber-400 hover:bg-amber-950/40"
          }`}
        >
          <Trophy className="w-3.5 h-3.5" />
          <span>Challenges</span>
        </button>

        {/* Compare Quotes Drawer Button */}
        <button
          onClick={() => setActiveDrawer(activeDrawer === "quotes" ? null : "quotes")}
          className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition ${
            activeDrawer === "quotes"
              ? "bg-emerald-950 text-emerald-300 border border-emerald-700"
              : "text-emerald-400 hover:bg-emerald-950/40"
          }`}
        >
          <Tag className="w-3.5 h-3.5" />
          <span>Brand Quotes</span>
        </button>

        {/* Save / Version Link */}
        <button
          onClick={onOpenSaveModal}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-slate-950 font-semibold text-xs transition shadow-lg"
        >
          <Save className="w-3.5 h-3.5" />
          <span>Save & Share</span>
        </button>
      </div>

      {/* Bottom Main Action Dock */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center space-x-2 p-1.5 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-2xl shadow-2xl">
        {/* Add 20ft Cabin */}
        <button
          onClick={() => addCabin("CABIN_20FT")}
          className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium transition"
          title="Add 20ft Shipping Container Module"
        >
          <Box className="w-4 h-4 text-emerald-400" />
          <span>+ 20ft Cabin</span>
        </button>

        {/* Add 40ft High Cube Cabin */}
        <button
          onClick={() => addCabin("CABIN_40FT")}
          className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium transition"
          title="Add 40ft High Cube Container Module"
        >
          <Box className="w-4 h-4 text-cyan-400" />
          <span>+ 40ft High-Cube</span>
        </button>

        {/* Stack 2nd Story Cabin */}
        <button
          onClick={() => {
            const last = cabins[cabins.length - 1];
            addCabin(last?.type || "CABIN_20FT", 1, "top");
          }}
          className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-700/80 text-indigo-200 text-xs font-medium transition"
          title="Stack Container Vertically on 2nd Story"
        >
          <Layers className="w-4 h-4 text-indigo-400" />
          <span>Stack 2nd Story</span>
        </button>

        <div className="w-px h-6 bg-slate-700 mx-1" />

        {/* Open Smart Equipment Visual Catalog */}
        <button
          onClick={onOpenEquipmentPicker}
          className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-300 text-xs font-semibold transition"
        >
          <Wrench className="w-4 h-4 text-amber-400" />
          <span>Mount Equipment Catalog</span>
        </button>

        {/* Watch Build Replay */}
        <button
          onClick={() => setActiveDrawer(activeDrawer === "versions" ? null : "versions")}
          className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
          title="Watch Step-by-Step 3D Build Replay"
        >
          <History className="w-4 h-4 text-cyan-400" />
          <span>Build History</span>
        </button>
      </div>
    </>
  );
};
