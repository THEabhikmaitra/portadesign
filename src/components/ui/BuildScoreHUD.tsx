"use client";

import React, { useState } from "react";
import { useStudioStore } from "@/store/useStudioStore";
import { Thermometer, Sun, Zap, IndianRupee, Target, ShieldCheck, ChevronUp, ChevronDown } from "lucide-react";

export const BuildScoreHUD: React.FC = () => {
  const getBom = useStudioStore((state) => state.getBom);
  const getScores = useStudioStore((state) => state.getScores);
  const targetBudget = useStudioStore((state) => state.targetBudget);
  const setTargetBudget = useStudioStore((state) => state.setTargetBudget);
  const setActiveDrawer = useStudioStore((state) => state.setActiveDrawer);

  const [isExpanded, setIsExpanded] = useState(true);
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [budgetInput, setBudgetInput] = useState(String(targetBudget));

  const bom = getBom();
  const scores = getScores();

  const budgetPct = Math.min(100, Math.round((bom.totalCost / (targetBudget || 1)) * 100));
  const isOverBudget = bom.totalCost > targetBudget;

  const handleBudgetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(budgetInput.replace(/\D/g, ""), 10);
    if (!isNaN(val) && val > 50000) {
      setTargetBudget(val);
    }
    setIsEditingBudget(false);
  };

  return (
    <div className="absolute top-4 right-4 z-20 flex flex-col items-end space-y-2 pointer-events-auto">
      {/* Main Glassmorphism HUD Panel */}
      <div className="w-80 bg-slate-900/85 backdrop-blur-md border border-slate-700/80 rounded-2xl shadow-2xl p-4 text-white transition-all duration-300">
        {/* Header with Rolling Total Cost */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
          <div>
            <div className="text-[11px] font-medium tracking-wider uppercase text-slate-400">
              Live Estimated Total (Incl. 18% GST)
            </div>
            <div className="flex items-baseline space-x-1 mt-0.5">
              <span className="text-2xl font-bold font-mono tracking-tight text-emerald-400">
                ₹{bom.totalCost.toLocaleString("en-IN")}
              </span>
              <button
                onClick={() => setActiveDrawer("bom")}
                className="text-[10px] text-cyan-400 hover:underline ml-1"
              >
                View BOM ({bom.items.length} items)
              </button>
            </div>
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {isExpanded && (
          <div className="pt-3 space-y-3 animate-in fade-in duration-200">
            {/* Target Budget Bar */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="flex items-center space-x-1 text-slate-400">
                  <Target className="w-3.5 h-3.5 text-amber-400" />
                  <span>Target Budget</span>
                </span>
                {isEditingBudget ? (
                  <form onSubmit={handleBudgetSubmit} className="flex items-center space-x-1">
                    <input
                      type="text"
                      value={budgetInput}
                      onChange={(e) => setBudgetInput(e.target.value)}
                      className="w-20 px-1 py-0.5 text-[11px] bg-slate-800 border border-slate-600 rounded text-right font-mono"
                      autoFocus
                    />
                    <button type="submit" className="text-[10px] text-emerald-400 hover:underline">
                      Save
                    </button>
                  </form>
                ) : (
                  <button
                    onClick={() => {
                      setBudgetInput(String(targetBudget));
                      setIsEditingBudget(true);
                    }}
                    className="font-mono text-slate-300 hover:text-emerald-400 transition"
                    title="Click to edit target budget"
                  >
                    ₹{targetBudget.toLocaleString("en-IN")}
                  </button>
                )}
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700">
                <div
                  className={`h-full transition-all duration-500 rounded-full ${
                    isOverBudget ? "bg-red-500" : budgetPct > 85 ? "bg-amber-400" : "bg-emerald-500"
                  }`}
                  style={{ width: `${Math.min(100, budgetPct)}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                <span>{budgetPct}% utilized</span>
                <span className={isOverBudget ? "text-red-400 font-medium" : "text-emerald-400"}>
                  {isOverBudget
                    ? `+₹${(bom.totalCost - targetBudget).toLocaleString("en-IN")} over`
                    : `₹${(targetBudget - bom.totalCost).toLocaleString("en-IN")} left`}
                </span>
              </div>
            </div>

            {/* 3 Real-Time Engineering Gauges */}
            <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-800">
              {/* 1. Thermal Comfort Score */}
              <div className="bg-slate-800/60 p-2 rounded-xl text-center border border-slate-700/50">
                <div className="flex items-center justify-center space-x-1 text-slate-400 mb-1">
                  <Thermometer className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="text-[10px] font-medium">Thermal</span>
                </div>
                <div className="text-lg font-bold font-mono text-cyan-300">
                  {scores.thermalComfort}
                  <span className="text-[10px] font-normal text-slate-400">/100</span>
                </div>
                <div className="w-full bg-slate-700/60 h-1 rounded-full mt-1 overflow-hidden">
                  <div
                    className="bg-cyan-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${scores.thermalComfort}%` }}
                  />
                </div>
              </div>

              {/* 2. Natural Daylight Score */}
              <div className="bg-slate-800/60 p-2 rounded-xl text-center border border-slate-700/50">
                <div className="flex items-center justify-center space-x-1 text-slate-400 mb-1">
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-[10px] font-medium">Daylight</span>
                </div>
                <div className="text-lg font-bold font-mono text-amber-300">
                  {scores.naturalDaylight}
                  <span className="text-[10px] font-normal text-slate-400">/100</span>
                </div>
                <div className="w-full bg-slate-700/60 h-1 rounded-full mt-1 overflow-hidden">
                  <div
                    className="bg-amber-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${scores.naturalDaylight}%` }}
                  />
                </div>
              </div>

              {/* 3. Eco / Solar Score */}
              <div className="bg-slate-800/60 p-2 rounded-xl text-center border border-slate-700/50">
                <div className="flex items-center justify-center space-x-1 text-slate-400 mb-1">
                  <Zap className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-[10px] font-medium">Eco Solar</span>
                </div>
                <div className="text-lg font-bold font-mono text-emerald-300">
                  {scores.ecoSolar}
                  <span className="text-[10px] font-normal text-slate-400">/100</span>
                </div>
                <div className="w-full bg-slate-700/60 h-1 rounded-full mt-1 overflow-hidden">
                  <div
                    className="bg-emerald-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${scores.ecoSolar}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Overall Build Rating */}
            <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-emerald-950/30 border border-emerald-800/50 text-xs">
              <span className="flex items-center space-x-1.5 text-emerald-300">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Structural & Engineering Index</span>
              </span>
              <span className="font-mono font-bold text-emerald-400">
                {scores.overallScore} / 100
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
