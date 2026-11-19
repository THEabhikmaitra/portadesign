"use client";

import React from "react";
import { EQUIPMENT_CATALOG } from "@/lib/equipmentCatalog";
import { useStudioStore } from "@/store/useStudioStore";
import { X, Sun, Wind, Droplets, MoveUp, Bath, Briefcase, Lightbulb, Video } from "lucide-react";

interface EquipmentPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORY_ICONS: Record<string, any> = {
  HVAC: Wind,
  SOLAR: Sun,
  PLUMBING: Droplets,
  ACCESS: MoveUp,
  INTERIOR: Briefcase,
  LIGHTING: Lightbulb,
  SECURITY: Video,
};

export const EquipmentPickerModal: React.FC<EquipmentPickerModalProps> = ({
  isOpen,
  onClose,
}) => {
  const startPlacement = useStudioStore((state) => state.startPlacement);

  if (!isOpen) return null;

  const items = Object.values(EQUIPMENT_CATALOG);

  const handleSelect = (itemType: string) => {
    startPlacement("equipment", itemType);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-3xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center space-x-2">
              <span>Smart Equipment & MEP Modules</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Select an assembly to start interactive 3D surface mounting. Press{" "}
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-600 text-emerald-400 font-mono text-[11px]">
                R
              </kbd>{" "}
              to rotate 90° during placement.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Equipment Cards Grid */}
        <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((eq) => {
            const Icon = CATEGORY_ICONS[eq.category] || Wind;

            return (
              <div
                key={eq.type}
                onClick={() => handleSelect(eq.type)}
                className="group relative flex flex-col justify-between p-4 rounded-2xl border border-slate-800 bg-slate-800/40 hover:bg-slate-800/80 hover:border-amber-500/60 transition cursor-pointer shadow-md"
              >
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2.5">
                      <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 group-hover:bg-amber-500/20 transition">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-white group-hover:text-amber-300 transition">
                          {eq.name}
                        </h4>
                        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                          Zone: {eq.allowedZones.join(", ")}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-xs text-slate-300 space-y-1 mt-2">
                    <div className="flex items-center space-x-1.5 text-[11px] text-slate-400">
                      <span className="font-medium text-slate-300">Brands:</span>
                      <span className="truncate">{eq.brands.map((b) => b.name).join(", ")}</span>
                    </div>
                    {eq.capacities && (
                      <div className="flex items-center space-x-1.5 text-[11px] text-slate-400">
                        <span className="font-medium text-slate-300">Sizes:</span>
                        <span className="truncate">{eq.capacities.map((c) => c.label.split(" ")[0]).join(", ")}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-700/60 flex items-center justify-between">
                  <div className="text-xs font-mono font-bold text-emerald-400">
                    From ₹{eq.basePrice.toLocaleString("en-IN")}
                  </div>
                  <span className="text-xs font-medium text-amber-400 group-hover:translate-x-1 transition flex items-center space-x-1">
                    <span>Place in 3D</span>
                    <span>→</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
