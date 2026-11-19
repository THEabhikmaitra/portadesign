"use client";

import React, { useState, useEffect } from "react";
import { useStudioStore } from "@/store/useStudioStore";
import { Play, Pause, SkipBack, SkipForward, X, History, Clock } from "lucide-react";

export const BuildReplayBar: React.FC = () => {
  const activeDrawer = useStudioStore((state) => state.activeDrawer);
  const setActiveDrawer = useStudioStore((state) => state.setActiveDrawer);
  const cabins = useStudioStore((state) => state.cabins);
  const equipment = useStudioStore((state) => state.equipment);
  const loadScene = useStudioStore((state) => state.loadScene);
  const environment = useStudioStore((state) => state.environment);
  const dayNight = useStudioStore((state) => state.dayNight);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  // Reconstruct step-by-step assembly milestones
  const steps = [
    {
      title: "Step 1: Ground Foundation Module",
      desc: "20ft Insulated Corten Steel Module placed on reinforced foundation",
      scene: {
        environment,
        dayNight,
        cabins: cabins.slice(0, 1).map((c) => ({ ...c, doors: [], windows: [] })),
        equipment: [],
      },
    },
    {
      title: "Step 2: Structural Glazing & Access",
      desc: "Sliding patio door & panoramic viewport windows installed with thermal break seals",
      scene: {
        environment,
        dayNight,
        cabins: cabins.slice(0, 1),
        equipment: [],
      },
    },
    {
      title: "Step 3: Interior MEP & Climate Control",
      desc: "Split Inverter AC, Executive dual desk workstation, and LED lighting hooked up",
      scene: {
        environment,
        dayNight,
        cabins: cabins.slice(0, 1),
        equipment: equipment.filter((e) => e.mountZone === "WALL_INTERIOR" || e.mountZone === "FLOOR_INTERIOR"),
      },
    },
    {
      title: "Step 4: Rooftop Solar & Clean Power",
      desc: "3.2kW Monocrystalline Photovoltaic Solar array and overhead water storage secured",
      scene: {
        environment,
        dayNight,
        cabins,
        equipment,
      },
    },
  ];

  useEffect(() => {
    let timer: any;
    if (isPlaying) {
      timer = setInterval(() => {
        setCurrentStep((prev) => {
          const next = (prev + 1) % steps.length;
          loadScene(steps[next].scene as any);
          return next;
        });
      }, 2400);
    }
    return () => clearInterval(timer);
  }, [isPlaying, steps, loadScene]);

  if (activeDrawer !== "versions") return null;

  const handleStepClick = (idx: number) => {
    setCurrentStep(idx);
    loadScene(steps[idx].scene as any);
  };

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full sm:w-[460px] bg-slate-900/95 backdrop-blur-xl border-l border-slate-700/80 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/60">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">3D Build Time-Lapse Replay</h2>
            <div className="text-xs text-slate-400">Step-by-step modular assembly sequence</div>
          </div>
        </div>
        <button
          onClick={() => {
            setIsPlaying(false);
            setActiveDrawer(null);
          }}
          className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Timeline Controls */}
      <div className="p-5 border-b border-slate-800 bg-slate-900/40 space-y-3">
        <div className="flex items-center justify-center space-x-3">
          <button
            onClick={() => handleStepClick(Math.max(0, currentStep - 1))}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            title="Previous Step"
          >
            <SkipBack className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-bold text-xs transition shadow-lg"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-slate-950" />}
            <span>{isPlaying ? "Pause Time-Lapse" : "Play Assembly Replay"}</span>
          </button>
          <button
            onClick={() => handleStepClick(Math.min(steps.length - 1, currentStep + 1))}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            title="Next Step"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>

        {/* Scrub Bar */}
        <div className="flex items-center space-x-2">
          {steps.map((_, idx) => (
            <div
              key={idx}
              onClick={() => handleStepClick(idx)}
              className={`flex-1 h-2 rounded-full cursor-pointer transition-all ${
                idx === currentStep
                  ? "bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]"
                  : idx < currentStep
                  ? "bg-emerald-500/80"
                  : "bg-slate-800"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Assembly Steps List */}
      <div className="flex-1 overflow-y-auto p-5 space-y-3">
        {steps.map((s, idx) => (
          <div
            key={idx}
            onClick={() => handleStepClick(idx)}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              idx === currentStep
                ? "border-cyan-400 bg-cyan-950/30 shadow-lg"
                : "border-slate-800 bg-slate-850/40 hover:border-slate-700"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className={`text-xs font-bold ${idx === currentStep ? "text-cyan-300" : "text-white"}`}>
                {s.title}
              </span>
              <span className="text-[10px] font-mono text-slate-500">Milestone #{idx + 1}</span>
            </div>
            <p className="text-xs text-slate-400">{s.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
