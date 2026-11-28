"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Compass, CheckCircle2, ShieldAlert } from "lucide-react";

type GoalType = "OFFICE" | "TERRACE" | "ADU" | "CAFE";
type ConstraintType = "GROUND_WIDE" | "ROOFTOP" | "NARROW_WIRES" | "BUDGET_USED";

export const InteractiveDecisionWizard: React.FC = () => {
  const [goal, setGoal] = useState<GoalType>("OFFICE");
  const [constraint, setConstraint] = useState<ConstraintType>("GROUND_WIDE");

  const recommendation = useMemo(() => {
    const size = goal === "ADU" ? "40ft Dual-Zone Studio (320 sq ft)" : "20ft Modular Unit (160 sq ft)";
    const condition = constraint === "BUDGET_USED" ? "Factory Refurbished (-38% cost)" : "Brand New Insulated Steel";
    const delivery =
      constraint === "NARROW_WIRES" || constraint === "ROOFTOP"
        ? "Knock-Down Flat-Pack Assembly"
        : "Ready-Built Trailer + Hydra Crane";
    const insulation =
      constraint === "ROOFTOP" || goal === "ADU"
        ? "75mm PUF + Sloped Fly-Roof Canopy (-6 to 9°C)"
        : "50mm High-Density PUF + Acoustic DGU Glass";
    const presetSlug =
      goal === "TERRACE" || constraint === "ROOFTOP"
        ? "terrace-room"
        : goal === "ADU"
        ? "guest-suite"
        : goal === "CAFE"
        ? "cafe-shop"
        : "garden-studio";

    const alert =
      constraint === "ROOFTOP"
        ? "Verify RCC column alignment & use steel I-beam load spreaders (never rest flat mid-slab)."
        : constraint === "NARROW_WIRES"
        ? "Measure minimum gate/stairwell width before dispatch; flat-pack avoids live HT wire crane risk."
        : constraint === "BUDGET_USED"
        ? "Audit bottom corner post rust, floor board softness, and roof weld leaks before pickup."
        : "Check local property boundary setbacks (2m in UK Class E, 4–5ft typical US ADU).";

    const indiaRange =
      goal === "ADU"
        ? "₹5.8L – ₹9.2L"
        : constraint === "BUDGET_USED"
        ? "₹2.1L – ₹3.4L"
        : constraint === "ROOFTOP"
        ? "₹3.8L – ₹5.6L"
        : "₹3.1L – ₹4.8L";

    const globalRange =
      goal === "ADU" ? "$38k–$65k US / £30k–£48k UK" : "$18k–$32k US / £14.5k–£26k UK";

    return { size, condition, delivery, insulation, presetSlug, alert, indiaRange, globalRange };
  }, [goal, constraint]);

  return (
    <section
      id="decision-wizard"
      className="my-8 p-5 sm:p-6 rounded-3xl bg-slate-900 border border-cyan-500/35 space-y-5 shadow-sm"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          <Compass className="w-5 h-5 text-cyan-400" />
          <h2 className="text-lg font-extrabold text-white">
            Interactive Prefab Room Selector (Get Instant Spec Match)
          </h2>
        </div>
        <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-semibold">
          Zero Sign-Up Tool
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <div className="space-y-2">
          <div className="font-bold text-slate-300">1. What are you building?</div>
          <div className="grid grid-cols-2 gap-2">
            {(
              [
                ["OFFICE", "Backyard WFH Office"],
                ["TERRACE", "Rooftop Extra Room"],
                ["ADU", "Guest / Granny ADU"],
                ["CAFE", "Shop / Garden Cafe"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setGoal(id)}
                className={`p-2.5 rounded-xl border text-left font-semibold transition ${
                  goal === id
                    ? "bg-emerald-500/20 border-emerald-400 text-white"
                    : "bg-slate-950 border-slate-700 text-slate-200 hover:border-emerald-500/60 hover:text-white"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <div className="font-bold text-slate-300">2. What is your site constraint?</div>
          <div className="grid grid-cols-2 gap-2">
            {(
              [
                ["GROUND_WIDE", "Wide Road & Open Lawn"],
                ["ROOFTOP", "Existing Roof Terrace"],
                ["NARROW_WIRES", "Narrow <12ft Lane / Wires"],
                ["BUDGET_USED", "Lowest Budget (Refurb)"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setConstraint(id)}
                className={`p-2.5 rounded-xl border text-left font-semibold transition ${
                  constraint === id
                    ? "bg-cyan-500/20 border-cyan-400 text-white"
                    : "bg-slate-950 border-slate-700 text-slate-200 hover:border-cyan-400/60 hover:text-white"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div>
            <div className="text-[10px] text-slate-400 uppercase">Recommended Size</div>
            <div className="font-bold text-white mt-0.5">{recommendation.size}</div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase">Delivery Mode</div>
            <div className="font-bold text-cyan-300 mt-0.5">{recommendation.delivery}</div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase">Insulation &amp; Build</div>
            <div className="font-bold text-slate-200 mt-0.5">{recommendation.insulation}</div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase">Indicative Turnkey Budget</div>
            <div className="font-bold font-mono text-emerald-400 mt-0.5">{recommendation.indiaRange}</div>
            <div className="text-[10px] text-slate-400">{recommendation.globalRange}</div>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="text-[11px] text-amber-300 flex items-center space-x-1.5">
            <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
            <span>{recommendation.alert}</span>
          </div>
          <Link
            href={`/?preset=${recommendation.presetSlug}`}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-extrabold text-xs inline-flex items-center space-x-1.5 shrink-0"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Open Match in 3D Configurator</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
};
