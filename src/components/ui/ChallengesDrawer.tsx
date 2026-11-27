"use client";

import React, { useEffect } from "react";
import confetti from "canvas-confetti";
import { useStudioStore } from "@/store/useStudioStore";
import { ChallengeRule } from "@/types";
import { X, Trophy, CheckCircle2, Circle, Award } from "lucide-react";

function evaluateChallengeRule(
  rule: ChallengeRule,
  ctx: {
    cabins: any[];
    equipment: any[];
    environment: string;
    totalCost: number;
    scores: any;
  }
): boolean {
  const valStr = String(rule.value || "");
  const valNum = Number(rule.value) || 0;

  switch (rule.type) {
    case "ENVIRONMENT_EQ":
      return ctx.environment === valStr;
    case "MIN_CABINS":
      return ctx.cabins.length >= valNum;
    case "MIN_STORIES":
      return ctx.cabins.some((c) => (c.tier ?? 0) >= valNum - 1 || (c.position?.[1] ?? 0) > 2.0);
    case "HAS_ELEMENT":
      return ctx.equipment.some((e) => e.type === valStr);
    case "HAS_WINDOW_TYPE":
      return ctx.cabins.some((c) => (c.windows || []).some((w: any) => w.type === valStr));
    case "HAS_DOOR_TYPE":
      return ctx.cabins.some((c) => (c.doors || []).some((d: any) => d.type === valStr));
    case "HAS_GLASS_CODE": {
      const codes = valStr.split(",").map((s) => s.trim());
      return ctx.cabins.some(
        (c) =>
          (c.windows || []).some((w: any) => codes.includes(w.glassType)) ||
          (c.doors || []).some((d: any) => codes.includes(d.glassType))
      );
    }
    case "MAX_TOTAL_COST":
      return ctx.cabins.length > 0 && ctx.totalCost <= valNum;
    case "MIN_ECO_SCORE":
      return ctx.scores.ecoSolar >= valNum;
    case "MIN_THERMAL_SCORE":
      return ctx.scores.thermalComfort >= valNum;
    case "MIN_DAYLIGHT_SCORE":
      return ctx.scores.naturalDaylight >= valNum;
    default:
      return false;
  }
}

export const ChallengesDrawer: React.FC = () => {
  const activeDrawer = useStudioStore((state) => state.activeDrawer);
  const setActiveDrawer = useStudioStore((state) => state.setActiveDrawer);
  const cabins = useStudioStore((state) => state.cabins);
  const equipment = useStudioStore((state) => state.equipment);
  const environment = useStudioStore((state) => state.environment);
  const getBom = useStudioStore((state) => state.getBom);
  const getScores = useStudioStore((state) => state.getScores);
  const completedChallengeIds = useStudioStore((state) => state.completedChallengeIds);
  const completeChallenge = useStudioStore((state) => state.completeChallenge);
  const catalogChallenges = useStudioStore((state) => state.catalogChallenges);

  const bom = getBom();
  const scores = getScores();

  useEffect(() => {
    catalogChallenges.forEach((ch) => {
      const rules = ch.rules || [];
      if (rules.length === 0) return;
      const done = rules.every((r) =>
        evaluateChallengeRule(r, { cabins, equipment, environment, totalCost: bom.totalCost, scores })
      );
      if (done && !completedChallengeIds.includes(ch.code)) {
        completeChallenge(ch.code);
        try {
          confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
        } catch {}
      }
    });
  }, [catalogChallenges, cabins, equipment, environment, bom.totalCost, scores, completedChallengeIds, completeChallenge]);

  if (activeDrawer !== "challenges") return null;

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full sm:w-96 bg-slate-900/95 backdrop-blur-xl border-l border-slate-700/80 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
      <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/60">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Design Challenges</h2>
            <div className="text-xs text-slate-400">Dynamic missions managed by Admin</div>
          </div>
        </div>
        <button
          onClick={() => setActiveDrawer(null)}
          className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {catalogChallenges.length === 0 ? (
          <div className="p-6 rounded-2xl border border-slate-800 bg-slate-950/60 text-center text-xs text-slate-400">
            No active challenges configured in Catalog Admin yet.
          </div>
        ) : (
          catalogChallenges.map((ch) => {
            const objectives = (ch.rules || []).map((r) => ({
              label: r.label,
              done: evaluateChallengeRule(r, {
                cabins,
                equipment,
                environment,
                totalCost: bom.totalCost,
                scores,
              }),
            }));
            const isUnlocked =
              completedChallengeIds.includes(ch.code) ||
              (objectives.length > 0 && objectives.every((o) => o.done));

            return (
              <div
                key={ch.code}
                className={`p-4 rounded-2xl border transition-all ${
                  isUnlocked
                    ? "border-emerald-500/60 bg-emerald-950/20 shadow-lg"
                    : "border-slate-800 bg-slate-950/50"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      {ch.badgeIconUrl ? (
                        <img src={ch.badgeIconUrl} alt={ch.badgeName} className="w-6 h-6 rounded object-cover" />
                      ) : (
                        <span className="text-lg">{ch.badgeIcon}</span>
                      )}
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

                <div className="mt-3.5 space-y-2 border-t border-slate-800/80 pt-3">
                  {objectives.map((obj, idx) => (
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

                <div className="mt-3.5 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="flex items-center space-x-1.5 text-amber-400 font-medium">
                    <Award className="w-4 h-4" />
                    <span>Badge: {ch.badgeName}</span>
                  </span>
                  <span className="font-mono text-emerald-400 font-bold">+{ch.rewardXp} XP</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
