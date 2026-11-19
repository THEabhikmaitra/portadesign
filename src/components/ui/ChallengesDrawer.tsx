"use client";

import React, { useEffect } from "react";
import confetti from "canvas-confetti";
import { useStudioStore } from "@/store/useStudioStore";
import { X, Trophy, CheckCircle2, Circle, Award, Sparkles } from "lucide-react";

interface ChallengeDef {
  id: string;
  title: string;
  description: string;
  rewardXp: number;
  badgeName: string;
  badgeIcon: string;
  check: (state: {
    cabins: any[];
    equipment: any[];
    environment: string;
    dayNight: string;
    totalCost: number;
    scores: any;
  }) => {
    isComplete: boolean;
    objectives: { label: string; done: boolean }[];
  };
}

const CHALLENGES: ChallengeDef[] = [
  {
    id: "CHALLENGE_DESERT_OFFICE",
    title: "Luxury Desert Studio Under ₹4.5L",
    description: "Design a high-thermal off-grid desert office container with sun-shield glass, solar power, and active cooling.",
    rewardXp: 350,
    badgeName: "Desert Solara Architect",
    badgeIcon: "🏜️",
    check: ({ environment, cabins, equipment, totalCost, scores }) => {
      const isDesert = environment === "desert";
      const hasCabin = cabins.length >= 1;
      const hasAC = equipment.some((e) => e.type === "AC_SPLIT_INVERTER");
      const hasSolar = equipment.some((e) => e.type === "SOLAR_ARRAY_ROOF");
      const hasShieldGlazing = cabins.some((c) =>
        c.windows.some((w: any) => w.glassType === "GLASS_TINTED_BLACK" || w.glassType === "GLASS_BRONZE_AIS") ||
        c.doors.some((d: any) => d.glassType === "GLASS_TINTED_BLACK" || d.glassType === "GLASS_BRONZE_AIS")
      );
      const isUnderBudget = totalCost <= 460000;

      const objectives = [
        { label: "Set Environment to Sahara Desert", done: isDesert },
        { label: "Mount 1.5T Inverter Air Conditioning", done: hasAC },
        { label: "Install Rooftop Monocrystalline Solar Array", done: hasSolar },
        { label: "Equip Tinted Black or Bronze Solar Shield Glass", done: hasShieldGlazing },
        { label: "Keep Total Cost Under ₹4,60,000", done: isUnderBudget },
      ];

      return {
        isComplete: objectives.every((o) => o.done),
        objectives,
      };
    },
  },
  {
    id: "CHALLENGE_BEACH_DUPLEX",
    title: "2-Story Coastal Penthouse Studio",
    description: "Stack two containers vertically with an external galvanized staircase and panoramic sea viewports.",
    rewardXp: 500,
    badgeName: "Coastal High-Riser",
    badgeIcon: "🏖️",
    check: ({ environment, cabins, equipment }) => {
      const isBeach = environment === "beach";
      const isStacked = cabins.some((c) => c.tier >= 1 || c.position[1] > 2.0);
      const hasStairs = equipment.some((e) => e.type === "STAIRS_EXTERNAL");
      const hasPanoramic = cabins.some((c) => c.windows.some((w: any) => w.type === "WINDOW_PANORAMIC"));

      const objectives = [
        { label: "Set Environment to Coastal Beach", done: isBeach },
        { label: "Stack a 2nd Story Container (Tier 1)", done: isStacked },
        { label: "Attach External Galvanized Steel Staircase", done: hasStairs },
        { label: "Install Architectural Panoramic Viewport Window", done: hasPanoramic },
      ];

      return {
        isComplete: objectives.every((o) => o.done),
        objectives,
      };
    },
  },
  {
    id: "CHALLENGE_NET_ZERO",
    title: "Net-Zero Off-Grid Eco Hub",
    description: "Engineer an energy-independent modular structure achieving an Eco/Solar Score ≥ 90.",
    rewardXp: 400,
    badgeName: "Net-Zero Pioneer",
    badgeIcon: "⚡",
    check: ({ equipment, scores }) => {
      const ecoScoreHigh = scores.ecoSolar >= 90;
      const hasSolar = equipment.some((e) => e.type === "SOLAR_ARRAY_ROOF");
      const hasWaterTank = equipment.some((e) => e.type === "WATER_TANK_OVERHEAD");
      const hasLed = equipment.some((e) => e.type === "LED_CEILING_PANEL");

      const objectives = [
        { label: "Install Overhead UV-Insulated Water Storage", done: hasWaterTank },
        { label: "Equip Solar Photovoltaic Rooftop Generation", done: hasSolar },
        { label: "Install Ultra-Slim LED Ceiling Panels", done: hasLed },
        { label: "Achieve Eco/Solar Engineering Score ≥ 90/100", done: ecoScoreHigh },
      ];

      return {
        isComplete: objectives.every((o) => o.done),
        objectives,
      };
    },
  },
];

export const ChallengesDrawer: React.FC = () => {
  const activeDrawer = useStudioStore((state) => state.activeDrawer);
  const setActiveDrawer = useStudioStore((state) => state.setActiveDrawer);
  const cabins = useStudioStore((state) => state.cabins);
  const equipment = useStudioStore((state) => state.equipment);
  const environment = useStudioStore((state) => state.environment);
  const dayNight = useStudioStore((state) => state.dayNight);
  const getBom = useStudioStore((state) => state.getBom);
  const getScores = useStudioStore((state) => state.getScores);
  const completedChallengeIds = useStudioStore((state) => state.completedChallengeIds);
  const completeChallenge = useStudioStore((state) => state.completeChallenge);

  const bom = getBom();
  const scores = getScores();

  // Evaluate challenges on state updates
  useEffect(() => {
    CHALLENGES.forEach((ch) => {
      const evaluation = ch.check({
        cabins,
        equipment,
        environment,
        dayNight,
        totalCost: bom.totalCost,
        scores,
      });

      if (evaluation.isComplete && !completedChallengeIds.includes(ch.id)) {
        completeChallenge(ch.id);

        // Confetti celebration
        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
          });
        } catch (e) {
          // ignore if canvas unavailable
        }
      }
    });
  }, [cabins, equipment, environment, dayNight, bom.totalCost, scores, completedChallengeIds, completeChallenge]);

  if (activeDrawer !== "challenges") return null;

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full sm:w-96 bg-slate-900/95 backdrop-blur-xl border-l border-slate-700/80 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/60">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Design Challenges</h2>
            <div className="text-xs text-slate-400">Complete missions to unlock badges & XP</div>
          </div>
        </div>
        <button
          onClick={() => setActiveDrawer(null)}
          className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Challenge Cards List */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {CHALLENGES.map((ch) => {
          const evalResult = ch.check({
            cabins,
            equipment,
            environment,
            dayNight,
            totalCost: bom.totalCost,
            scores,
          });
          const isUnlocked = completedChallengeIds.includes(ch.id) || evalResult.isComplete;

          return (
            <div
              key={ch.id}
              className={`p-4 rounded-2xl border transition-all ${
                isUnlocked
                  ? "border-emerald-500/60 bg-emerald-950/20 shadow-lg"
                  : "border-slate-800 bg-slate-850/50"
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{ch.badgeIcon}</span>
                    <h3 className="text-sm font-bold text-white">{ch.title}</h3>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{ch.description}</p>
                </div>
                {isUnlocked && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-[10px] font-semibold text-emerald-300">
                    CLAIMED
                  </span>
                )}
              </div>

              {/* Objectives List */}
              <div className="mt-3.5 space-y-2 border-t border-slate-800/80 pt-3">
                {evalResult.objectives.map((obj, idx) => (
                  <div key={idx} className="flex items-center space-x-2 text-xs">
                    {obj.done ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <Circle className="w-4 h-4 text-slate-600 shrink-0" />
                    )}
                    <span className={obj.done ? "text-slate-200 line-through opacity-80" : "text-slate-400"}>
                      {obj.label}
                    </span>
                  </div>
                ))}
              </div>

              {/* Reward Badge Footer */}
              <div className="mt-3.5 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="flex items-center space-x-1.5 text-amber-400 font-medium">
                  <Award className="w-4 h-4" />
                  <span>Badge: {ch.badgeName}</span>
                </span>
                <span className="font-mono text-emerald-400 font-bold">+{ch.rewardXp} XP</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
