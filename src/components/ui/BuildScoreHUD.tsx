"use client";

import React, { useState } from "react";
import { useStudioStore } from "@/store/useStudioStore";
import { Thermometer, Sun, Zap, Target, ChevronUp, ChevronDown } from "lucide-react";

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
    <div className="fixed top-16 right-3 z-20 flex flex-col items-end pointer-events-auto animate-in fade-in duration-300">
      {/* Sleek Minimal Glassmorphic HUD */}
      <div className="w-72 bg-slate-950/75 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-3.5 text-white transition-all duration-300">
        {/* Header: Price Ticker + BOM Toggle */}
        <div className="flex items-center justify-between border-b border-white/10 pb-2">
          <div>
            <div className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
              ESTIMATED TOTAL
            </div>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-xl font-black font-mono tracking-tight text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.3)]">
                ₹{bom.totalCost.toLocaleString("en-IN")}
              </span>
              <button
                onClick={() => setActiveDrawer("bom")}
                className="text-[10px] text-cyan-400 hover:text-cyan-300 transition"
              >
                ({bom.items.length})
              </button>
            </div>
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {isExpanded && (
          <div className="pt-2.5 space-y-2.5 animate-in fade-in duration-200">
            {/* Target Budget Bar */}
            <div>
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className="flex items-center space-x-1 text-slate-400">
                  <Target className="w-3 h-3 text-amber-400" />
                  <span>Target</span>
                </span>
                {isEditingBudget ? (
                  <form onSubmit={handleBudgetSubmit} className="flex items-center space-x-1">
                    <input
                      type="text"
                      value={budgetInput}
                      onChange={(e) => setBudgetInput(e.target.value)}
                      className="w-16 px-1 py-0.5 text-[10px] bg-slate-900 border border-slate-700 rounded text-right font-mono text-white"
                      autoFocus
                    />
                    <button type="submit" className="text-[9px] text-emerald-400">
                      ✓
                    </button>
                  </form>
                ) : (
                  <button
                    onClick={() => {
                      setBudgetInput(String(targetBudget));
                      setIsEditingBudget(true);
                    }}
                    className="font-mono text-slate-300 hover:text-emerald-400 transition"
                  >
                    ₹{(targetBudget / 100000).toFixed(1)}L
                  </button>
                )}
              </div>
              <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden border border-white/5">
                <div
                  className={`h-full transition-all duration-500 rounded-full ${
                    isOverBudget ? "bg-red-500" : budgetPct > 85 ? "bg-amber-400" : "bg-emerald-500"
                  }`}
                  style={{ width: `${Math.min(100, budgetPct)}%` }}
                />
              </div>
            </div>

            {/* 3 Real-Time Engineering Gauges */}
            <div className="grid grid-cols-3 gap-1.5 pt-1 border-t border-white/10">
              {/* Thermal */}
              <div className="bg-white/5 p-2 rounded-xl text-center border border-white/5">
                <div className="flex items-center justify-center space-x-1 text-slate-400 mb-0.5">
                  <Thermometer className="w-3 h-3 text-cyan-400" />
                  <span className="text-[9px] uppercase font-bold tracking-wider">Thermal</span>
                </div>
                <div className="text-base font-black font-mono text-cyan-300">
                  {scores.thermalComfort}
                </div>
                <div className="w-full bg-slate-900 h-1 rounded-full mt-1 overflow-hidden">
                  <div
                    className="bg-cyan-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${scores.thermalComfort}%` }}
                  />
                </div>
              </div>

              {/* Daylight */}
              <div className="bg-white/5 p-2 rounded-xl text-center border border-white/5">
                <div className="flex items-center justify-center space-x-1 text-slate-400 mb-0.5">
                  <Sun className="w-3 h-3 text-amber-400" />
                  <span className="text-[9px] uppercase font-bold tracking-wider">Light</span>
                </div>
                <div className="text-base font-black font-mono text-amber-300">
                  {scores.naturalDaylight}
                </div>
                <div className="w-full bg-slate-900 h-1 rounded-full mt-1 overflow-hidden">
                  <div
                    className="bg-amber-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${scores.naturalDaylight}%` }}
                  />
                </div>
              </div>

              {/* Eco */}
              <div className="bg-white/5 p-2 rounded-xl text-center border border-white/5">
                <div className="flex items-center justify-center space-x-1 text-slate-400 mb-0.5">
                  <Zap className="w-3 h-3 text-emerald-400" />
                  <span className="text-[9px] uppercase font-bold tracking-wider">Solar</span>
                </div>
                <div className="text-base font-black font-mono text-emerald-300">
                  {scores.ecoSolar}
                </div>
                <div className="w-full bg-slate-900 h-1 rounded-full mt-1 overflow-hidden">
                  <div
                    className="bg-emerald-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${scores.ecoSolar}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
