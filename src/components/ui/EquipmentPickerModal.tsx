"use client";

import React from "react";
import { EQUIPMENT_CATALOG } from "@/lib/equipmentCatalog";
import { useStudioStore } from "@/store/useStudioStore";
import { X, Sun, Wind, Droplets, MoveUp, Briefcase, Lightbulb, Video } from "lucide-react";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-slate-950/90 border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-white/5">
          <div className="flex items-center space-x-2">
            <h2 className="text-sm font-bold text-white tracking-wide">
              Smart Equipment Catalog
            </h2>
            <span className="text-[10px] text-amber-400 font-mono px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20">
              Press [R] to Rotate
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-white/5 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Equipment Cards Grid */}
        <div className="p-4 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {items.map((eq) => {
            const Icon = CATEGORY_ICONS[eq.category] || Wind;

            return (
              <div
                key={eq.type}
                onClick={() => handleSelect(eq.type)}
                className="group relative flex items-center justify-between p-3 rounded-2xl border border-white/5 bg-white/5 hover:bg-white/10 hover:border-amber-400/50 transition cursor-pointer active:scale-[0.99]"
              >
                <div className="flex items-center space-x-3 overflow-hidden">
                  <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 group-hover:bg-amber-500/20 transition shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="overflow-hidden">
                    <h4 className="text-xs font-bold text-white group-hover:text-amber-300 transition truncate">
                      {eq.name.split("(")[0]}
                    </h4>
                    <span className="text-[10px] text-slate-400 font-mono uppercase">
                      {eq.category} • {eq.allowedZones[0]?.replace("_", " ")}
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0 pl-2">
                  <div className="text-xs font-mono font-bold text-emerald-400">
                    ₹{(eq.basePrice / 1000).toFixed(0)}k
                  </div>
                  <span className="text-[10px] text-amber-400 opacity-0 group-hover:opacity-100 transition">
                    Mount →
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
