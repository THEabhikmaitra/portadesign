"use client";

import { ExactLocationPicker } from "./ExactLocationPicker";

import React from "react";
import { useStudioStore } from "@/store/useStudioStore";
import { calculateSiteLogistics, defaultsToVendorLogistics } from "@/lib/logisticsEngine";
import { ConditionMode, DeliveryMode, InsulationTier, PlacementLevelType } from "@/types";
import {
  X,
  Truck,
  Recycle,
  AlertTriangle,
  Info,
  CheckCircle2,
  ShieldCheck,
  ThermometerSnowflake,
  MapPin,
  ArrowRight,
} from "lucide-react";

export const SiteLogisticsDrawer: React.FC = () => {
  const activeDrawer = useStudioStore((state) => state.activeDrawer);
  const setActiveDrawer = useStudioStore((state) => state.setActiveDrawer);
  const cabins = useStudioStore((state) => state.cabins);
  const logistics = useStudioStore((state) => state.logistics);
  const updateLogistics = useStudioStore((state) => state.updateLogistics);
  const catalogLogisticsDefaults = useStudioStore((state) => state.catalogLogisticsDefaults);

  if (activeDrawer !== "logistics") return null;

  const calc = calculateSiteLogistics(
    cabins,
    logistics,
    defaultsToVendorLogistics(catalogLogisticsDefaults),
    catalogLogisticsDefaults
  );

  const conditionOptions: { id: ConditionMode; title: string; tag: string; desc: string }[] = [
    { id: "NEW", title: "Brand New", tag: "5–7 Yr Warranty", desc: "Fresh factory build, full custom finish" },
    { id: "REFURB_READY", title: "2nd Hand Refurbished", tag: "-38% Off Cabin", desc: "Rust-treated, repainted, re-wired, leak-tested" },
    { id: "USED_WWT", title: "Used Shell (WWT)", tag: "-55% Off Cabin", desc: "Wind & watertight raw shipping shell, basic fit-out" },
  ];

  const deliveryOptions: { id: DeliveryMode; title: string; tag: string; desc: string }[] = [
    { id: "READY_BUILT", title: "Deliver Ready-Built (Truck + Crane)", tag: "1-Day Drop", desc: "Pre-built on flatbed trailer, lifted via crane" },
    { id: "KNOCK_DOWN", title: "Deliver Flat-Pack (Narrow Lane / Terrace)", tag: "No Crane Needed", desc: "Ships on small Tata Ace pickup, bolted on-site" },
    { id: "SELF_PICKUP", title: "Self-Pickup from Maker Yard", tag: "₹0 Transport & Crane", desc: "Bring your own truck/trailer to maker's factory gate" },
  ];

  const floorLevels: { id: PlacementLevelType; label: string }[] = [
    { id: "GROUND", label: "On Ground" },
    { id: "MID_FLOOR", label: "1st / 2nd Floor" },
    { id: "TERRACE", label: "Top Terrace" },
  ];

  const insulationOptions: { id: InsulationTier; title: string; costLabel: string }[] = [
    { id: "STANDARD", title: "Basic EPS Wall", costLabel: "Included" },
    { id: "PUF_50MM", title: "50mm PUF Heat-Shield", costLabel: "+₹14k" },
    { id: "PUF_75MM_CANOPY", title: "75mm PUF + Sloped Canopy", costLabel: "+₹38k (3D Roof)" },
  ];

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full sm:w-[460px] bg-slate-900/95 backdrop-blur-xl border-l border-slate-700/80 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
      <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/60">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">2nd Hand, Delivery & Self-Pickup</h2>
            <div className="text-[11px] text-slate-400">
              Set condition, floor height, narrow lane or self-pickup
            </div>
          </div>
        </div>
        <button
          onClick={() => setActiveDrawer(null)}
          aria-label="Close site and transport drawer"
          className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {calc.alerts.length > 0 && (
          <div className="space-y-2.5">
            {calc.alerts.map((al, idx) => (
              <div
                key={idx}
                className={`p-3.5 rounded-2xl border text-xs space-y-1.5 ${
                  al.severity === "warning"
                    ? "bg-red-950/35 border-red-500/50 text-red-200"
                    : al.severity === "success"
                    ? "bg-emerald-950/30 border-emerald-500/40 text-emerald-200"
                    : "bg-cyan-950/25 border-cyan-500/35 text-cyan-100"
                }`}
              >
                <div className="font-bold flex items-center space-x-1.5">
                  {al.severity === "warning" ? (
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                  ) : al.severity === "success" ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <Info className="w-4 h-4 text-cyan-400 shrink-0" />
                  )}
                  <span>{al.title}</span>
                </div>
                <p className="text-[11px] opacity-90 leading-relaxed">{al.detail}</p>
                {al.actionLabel && (
                  <button
                    onClick={() => {
                      if (al.actionType === "SWITCH_KNOCKDOWN") {
                        updateLogistics({ deliveryMode: "KNOCK_DOWN" });
                      } else if (al.actionType === "ADD_CANOPY") {
                        updateLogistics({ insulationTier: "PUF_75MM_CANOPY" });
                      }
                    }}
                    className="mt-1 px-3 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-white font-bold text-[11px] transition"
                  >
                    {al.actionLabel} →
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 1. New vs 2nd Hand Option */}
        <div className="space-y-2">
          <div className="flex items-center space-x-1.5 text-xs font-bold text-white">
            <Recycle className="w-4 h-4 text-emerald-400" />
            <span>1. Cabin Condition (New vs 2nd Hand)</span>
          </div>
          <div className="space-y-2">
            {conditionOptions.map((opt) => (
              <button
                key={opt.id}
                onClick={() => updateLogistics({ condition: opt.id })}
                className={`w-full text-left p-3 rounded-2xl border transition ${
                  logistics.condition === opt.id
                    ? "border-emerald-400 bg-emerald-500/15"
                    : "border-slate-800 bg-slate-850/50 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">{opt.title}</span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      opt.id === "NEW"
                        ? "bg-slate-800 text-slate-300"
                        : "bg-emerald-500/20 text-emerald-300"
                    }`}
                  >
                    {opt.tag}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">{opt.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* 2. Delivery vs Self-Pickup */}
        <div className="space-y-3">
          <div className="flex items-center space-x-1.5 text-xs font-bold text-white">
            <MapPin className="w-4 h-4 text-cyan-400" />
            <span>2. Delivery Method or Self-Pickup</span>
          </div>

          <div className="space-y-2">
            {deliveryOptions.map((d) => (
              <button
                key={d.id}
                onClick={() => updateLogistics({ deliveryMode: d.id })}
                className={`w-full text-left p-3 rounded-2xl border transition ${
                  logistics.deliveryMode === d.id
                    ? "border-cyan-400 bg-cyan-500/15"
                    : "border-slate-800 bg-slate-850/50 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">{d.title}</span>
                  <span className="text-[10px] font-semibold text-cyan-300">{d.tag}</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">{d.desc}</div>
              </button>
            ))}
          </div>

          {/* Floor, Road & Distance controls (only when Delivery is chosen) */}
          {logistics.deliveryMode !== "SELF_PICKUP" && (
            <div className="space-y-3 pt-1">
              <div className="text-[11px] font-semibold text-slate-300">Placement Floor Level</div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                {floorLevels.map((fl) => (
                  <button
                    key={fl.id}
                    onClick={() => updateLogistics({ placementLevel: fl.id })}
                    className={`p-2 rounded-xl border text-center font-semibold transition ${
                      logistics.placementLevel === fl.id
                        ? "border-cyan-400 bg-cyan-500/15 text-white"
                        : "border-slate-800 bg-slate-850/40 text-slate-400"
                    }`}
                  >
                    {fl.label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  onClick={() => updateLogistics({ roadWidth: "WIDE" })}
                  className={`p-2 rounded-xl border text-center font-semibold transition ${
                    logistics.roadWidth === "WIDE"
                      ? "border-cyan-400 bg-cyan-500/15 text-white"
                      : "border-slate-800 bg-slate-850/40 text-slate-400"
                  }`}
                >
                  Wide Road (&gt;14 ft)
                </button>
                <button
                  onClick={() => updateLogistics({ roadWidth: "NARROW" })}
                  className={`p-2 rounded-xl border text-center font-semibold transition ${
                    logistics.roadWidth === "NARROW"
                      ? "border-amber-400 bg-amber-500/15 text-amber-200"
                      : "border-slate-800 bg-slate-850/40 text-slate-400"
                  }`}
                >
                  Narrow Lane (&lt;12 ft)
                </button>
                <button
                  onClick={() => updateLogistics({ overheadClearance: "CLEAR" })}
                  className={`p-2 rounded-xl border text-center font-semibold transition ${
                    (logistics.overheadClearance || "CLEAR") === "CLEAR"
                      ? "border-cyan-400 bg-cyan-500/15 text-white"
                      : "border-slate-800 bg-slate-850/40 text-slate-400"
                  }`}
                >
                  Clear Open Sky
                </button>
                <button
                  onClick={() => updateLogistics({ overheadClearance: "WIRES_OR_GATE" })}
                  className={`p-2 rounded-xl border text-center font-semibold transition ${
                    logistics.overheadClearance === "WIRES_OR_GATE"
                      ? "border-amber-400 bg-amber-500/15 text-amber-200"
                      : "border-slate-800 bg-slate-850/40 text-slate-400"
                  }`}
                >
                  Low Wires / Gate
                </button>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300">Distance from Factory Yard</span>
                  <span className="font-mono font-bold text-amber-400">{logistics.distanceKm} km</span>
                </div>
                <ExactLocationPicker compact />
                <input
                  type="range"
                  min={15}
                  max={1500}
                  step={5}
                  value={logistics.distanceKm}
                  onChange={(e) => updateLogistics({ distanceKm: Number(e.target.value) })}
                  className="w-full accent-amber-400"
                />
              </div>
            </div>
          )}
        </div>

        {/* 3. Indian Summer & Monsoon Roof Shield */}
        <div className="space-y-2">
          <div className="flex items-center space-x-1.5 text-xs font-bold text-white">
            <ThermometerSnowflake className="w-4 h-4 text-cyan-400" />
            <span>3. Summer Heat & Monsoon Protection</span>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {insulationOptions.map((ins) => (
              <button
                key={ins.id}
                onClick={() => updateLogistics({ insulationTier: ins.id })}
                className={`flex items-center justify-between p-3 rounded-xl border text-xs transition ${
                  logistics.insulationTier === ins.id
                    ? "border-cyan-400 bg-cyan-500/15 text-white font-bold"
                    : "border-slate-800 bg-slate-850/40 text-slate-300 hover:border-slate-700"
                }`}
              >
                <span>{ins.title}</span>
                <span className="font-mono text-emerald-400">{ins.costLabel}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Breakdown Box */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
          <div className="flex items-center space-x-1.5 font-bold text-white pb-1 border-b border-slate-800">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Logistics & Site Estimate</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>
              {logistics.deliveryMode === "SELF_PICKUP"
                ? "Self-Pickup at Maker Gate"
                : `Transport (${logistics.distanceKm} km)`}
            </span>
            <span className="font-mono text-white">₹{calc.transportCost.toLocaleString("en-IN")}</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>
              {logistics.deliveryMode === "SELF_PICKUP"
                ? "Site Crane / Assembly"
                : logistics.deliveryMode === "KNOCK_DOWN"
                ? "On-Site Bolt Assembly"
                : logistics.placementLevel === "TERRACE"
                ? "Top Floor / Terrace Mobile Crane"
                : logistics.placementLevel === "MID_FLOOR"
                ? "1st / 2nd Floor Crane"
                : "Ground Hydra Crane"}
            </span>
            <span className="font-mono text-white">
              ₹{calc.craneOrAssemblyCost.toLocaleString("en-IN")}
            </span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Site Plinth / Grid + Heat Insulation</span>
            <span className="font-mono text-white">
              ₹{calc.foundationOrCanopyCost.toLocaleString("en-IN")}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom CTA to Submit Exact Address & Contact for Actual Final Quote */}
      <div className="p-4 border-t border-slate-800 bg-slate-900/90">
        <button
          onClick={() => setActiveDrawer("quotes")}
          className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-bold text-xs transition shadow-lg"
        >
          <span>Enter Contact & Address for Exact Price</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
