"use client";

import React from "react";
import Link from "next/link";
import { useStudioStore } from "@/store/useStudioStore";
import { X, Sun, Wind, Droplets, MoveUp, Bath, Briefcase, Lightbulb, Video, Box } from "lucide-react";

interface EquipmentPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SUBCAT_ICONS: Record<string, any> = {
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
  const autoPlaceEquipment = useStudioStore((state) => state.autoPlaceEquipment);
  const catalogElements = useStudioStore((state) => state.catalogElements);

  if (!isOpen) return null;

  const items = catalogElements.filter((el) =>
    ["EQUIPMENT", "STAIRS", "POD"].includes(el.category)
  );

  const handleSelect = (itemType: string) => {
    autoPlaceEquipment(itemType);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-slate-950/95 border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[82vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-white/5">
          <div>
            <h2 className="text-sm font-bold text-white tracking-wide">
              Add Furniture, AC & Utilities
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Live Admin-managed modules — tap any item to add it straight into your 3D room
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-white/5 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {items.length === 0 ? (
            <div className="col-span-2 p-6 rounded-2xl border border-white/10 bg-white/5 text-center text-xs text-slate-300 space-y-2">
              <p>Loading furniture & utilities catalog...</p>
            </div>
          ) : (
            items.map((el) => {
              const Icon =
                el.category === "POD"
                  ? Bath
                  : el.category === "STAIRS"
                  ? MoveUp
                  : SUBCAT_ICONS[el.subCategory || ""] || Box;
              const displayImg = el.imageUrl || el.iconUrl;
              const spotLabel =
                el.options?.spotLabel ||
                `Mounts on ${(el.mountZone || "FLOOR_INTERIOR").toLowerCase().replace("_", " ")}`;

              return (
                <button
                  key={el.code}
                  onClick={() => handleSelect(el.code)}
                  className="group text-left flex items-center justify-between p-3.5 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-amber-400/50 transition cursor-pointer active:scale-[0.98]"
                >
                  <div className="flex items-center space-x-3 overflow-hidden">
                    {displayImg ? (
                      <img
                        src={displayImg}
                        alt={el.friendlyName || el.name}
                        className="w-10 h-10 rounded-xl object-cover border border-white/15 shrink-0 bg-slate-900"
                      />
                    ) : (
                      <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/25 text-amber-400 group-hover:bg-amber-500/25 transition shrink-0">
                        <Icon className="w-4 h-4" />
                      </div>
                    )}
                    <div className="overflow-hidden">
                      <h4 className="text-xs font-bold text-white group-hover:text-amber-300 transition truncate">
                        {el.friendlyName || el.name}
                      </h4>
                      <span className="text-[11px] text-slate-400 block truncate">
                        {spotLabel}
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0 pl-2">
                    <div className="text-xs font-mono font-bold text-emerald-400">
                      ₹{(el.baseCost / 1000).toFixed(0)}k
                    </div>
                    <span className="text-[11px] font-semibold text-amber-300">
                      + Add
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
