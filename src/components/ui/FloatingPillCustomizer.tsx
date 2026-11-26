"use client";

import React from "react";
import { useStudioStore } from "@/store/useStudioStore";
import {
  GlassTypeCode,
  FrameMaterialCode,
  WallFinishCode,
} from "@/types";
import { EQUIPMENT_CATALOG } from "@/lib/equipmentCatalog";
import { X, Trash2, Plus, Layers, Sliders } from "lucide-react";

export const FloatingPillCustomizer: React.FC = () => {
  const selectedEntity = useStudioStore((state) => state.selectedEntity);
  const setSelectedEntity = useStudioStore((state) => state.setSelectedEntity);
  const cabins = useStudioStore((state) => state.cabins);
  const equipment = useStudioStore((state) => state.equipment);

  const updateCabinFinish = useStudioStore((state) => state.updateCabinFinish);
  const removeCabin = useStudioStore((state) => state.removeCabin);
  const addCabin = useStudioStore((state) => state.addCabin);
  const addDoorToCabin = useStudioStore((state) => state.addDoorToCabin);
  const addWindowToCabin = useStudioStore((state) => state.addWindowToCabin);

  const updateDoor = useStudioStore((state) => state.updateDoor);
  const removeDoor = useStudioStore((state) => state.removeDoor);

  const updateWindow = useStudioStore((state) => state.updateWindow);
  const removeWindow = useStudioStore((state) => state.removeWindow);

  const updateEquipment = useStudioStore((state) => state.updateEquipment);
  const removeEquipment = useStudioStore((state) => state.removeEquipment);

  if (!selectedEntity) return null;

  // Selected Cabin
  if (selectedEntity.type === "cabin") {
    const cabin = cabins.find((c) => c.id === selectedEntity.id);
    if (!cabin) return null;

    const finishes: { code: WallFinishCode; name: string; color: string }[] = [
      { code: "FINISH_BATTLESHIP_GREY", name: "Battleship Grey", color: "#475569" },
      { code: "FINISH_OCEAN_CYBER", name: "Cyber Blue", color: "#0f3d5e" },
      { code: "FINISH_DESERT_BEIGE", name: "Sand Beige", color: "#cbb393" },
      { code: "FINISH_FOREST_OLIVE", name: "Forest Olive", color: "#2c3b2e" },
    ];

    return (
      <div className="absolute bottom-22 left-1/2 -translate-x-1/2 z-30 w-[95%] max-w-md bg-slate-950/85 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-3 text-white animate-in fade-in slide-in-from-bottom-3 duration-200">
        <div className="flex items-center justify-between border-b border-white/10 pb-1.5 mb-2.5">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-emerald-400" />
            <h3 className="font-bold text-xs tracking-wide">
              {cabin.type === "CABIN_40FT" ? "40ft Container" : "20ft Container"}
            </h3>
          </div>
          <button
            onClick={() => setSelectedEntity(null)}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Tactile Wall Finish Swatches */}
        <div className="flex items-center justify-between gap-1.5 mb-2.5">
          {finishes.map((f) => (
            <button
              key={f.code}
              onClick={() => updateCabinFinish(cabin.id, f.code)}
              className={`flex-1 flex items-center justify-center space-x-1.5 py-1.5 px-2 rounded-xl border text-xs font-medium transition active:scale-95 ${
                cabin.wallFinish === f.code
                  ? "border-emerald-400 bg-emerald-500/15 text-white"
                  : "border-white/5 bg-white/5 text-slate-300 hover:border-white/15"
              }`}
            >
              <span
                className="w-3 h-3 rounded-full border border-white/30 shrink-0"
                style={{ backgroundColor: f.color }}
              />
              <span className="text-[11px] truncate">{f.name}</span>
            </button>
          ))}
        </div>

        {/* Quick Add Sub-Components & Stack Actions */}
        <div className="flex items-center gap-1.5 pt-1.5 border-t border-white/10 text-xs">
          <button
            onClick={() => addDoorToCabin(cabin.id, "DOOR_SLIDING_GLASS")}
            className="flex-1 py-1 px-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-200 border border-white/5 transition truncate text-center"
          >
            +Door
          </button>
          <button
            onClick={() => addWindowToCabin(cabin.id, "WINDOW_PANORAMIC")}
            className="flex-1 py-1 px-2 rounded-lg bg-white/5 hover:bg-white/10 text-cyan-200 border border-white/5 transition truncate text-center"
          >
            +Window
          </button>
          <button
            onClick={() => addCabin(cabin.type, cabin.tier + 1, "top")}
            className="flex-1 py-1 px-2 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 transition truncate text-center"
          >
            +Story #{cabin.tier + 2}
          </button>
          <button
            onClick={() => removeCabin(cabin.id)}
            className="p-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 transition"
            title="Delete Container"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  // Selected Door
  if (selectedEntity.type === "door") {
    const cabin = cabins.find((c) => c.id === selectedEntity.parentCabinId);
    const door = cabin?.doors.find((d) => d.id === selectedEntity.id);
    if (!cabin || !door) return null;

    const glasses: { code: GlassTypeCode; name: string }[] = [
      { code: "GLASS_CLEAR_SG", name: "Clear" },
      { code: "GLASS_TINTED_BLACK", name: "Tinted Black" },
      { code: "GLASS_BRONZE_AIS", name: "Bronze" },
      { code: "GLASS_FROSTED_AIS", name: "Frosted" },
    ];

    const frames: { code: FrameMaterialCode; name: string }[] = [
      { code: "FRAME_ALUM_CHARCOAL", name: "Charcoal Alum" },
      { code: "FRAME_UPVC_WHITE", name: "White uPVC" },
      { code: "FRAME_STEEL_TATA", name: "Steel" },
    ];

    return (
      <div className="absolute bottom-22 left-1/2 -translate-x-1/2 z-30 w-[95%] max-w-sm bg-slate-950/85 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-3 text-white animate-in fade-in slide-in-from-bottom-3 duration-200">
        <div className="flex items-center justify-between border-b border-white/10 pb-1.5 mb-2">
          <h3 className="font-bold text-xs tracking-wide">
            {door.type === "DOOR_SLIDING_GLASS" ? "Sliding Glass Door" : "Steel Door"}
          </h3>
          <button
            onClick={() => setSelectedEntity(null)}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {door.type === "DOOR_SLIDING_GLASS" && (
          <div className="grid grid-cols-4 gap-1 mb-2">
            {glasses.map((g) => (
              <button
                key={g.code}
                onClick={() => updateDoor(cabin.id, door.id, { glassType: g.code })}
                className={`py-1 px-1.5 rounded-lg border text-[11px] font-medium transition truncate text-center ${
                  door.glassType === g.code
                    ? "border-cyan-400 bg-cyan-500/20 text-cyan-200"
                    : "border-white/5 bg-white/5 text-slate-300 hover:border-white/15"
                }`}
              >
                {g.name}
              </button>
            ))}
          </div>
        )}

        <div className="grid grid-cols-3 gap-1 mb-2">
          {frames.map((f) => (
            <button
              key={f.code}
              onClick={() => updateDoor(cabin.id, door.id, { frameMaterial: f.code })}
              className={`py-1 px-1.5 rounded-lg border text-[11px] font-medium transition truncate text-center ${
                door.frameMaterial === f.code
                  ? "border-cyan-400 bg-cyan-500/20 text-cyan-200"
                  : "border-white/5 bg-white/5 text-slate-300 hover:border-white/15"
              }`}
            >
              {f.name}
            </button>
          ))}
        </div>

        <div className="flex justify-end pt-1.5 border-t border-white/10">
          <button
            onClick={() => removeDoor(cabin.id, door.id)}
            className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-[11px] text-red-300 border border-red-500/30 transition"
          >
            <Trash2 className="w-3 h-3" />
            <span>Remove</span>
          </button>
        </div>
      </div>
    );
  }

  // Selected Window
  if (selectedEntity.type === "window") {
    const cabin = cabins.find((c) => c.id === selectedEntity.parentCabinId);
    const win = cabin?.windows.find((w) => w.id === selectedEntity.id);
    if (!cabin || !win) return null;

    const glasses: { code: GlassTypeCode; name: string }[] = [
      { code: "GLASS_CLEAR_SG", name: "Clear" },
      { code: "GLASS_TINTED_BLACK", name: "Tinted Black" },
      { code: "GLASS_BRONZE_AIS", name: "Bronze" },
      { code: "GLASS_FROSTED_AIS", name: "Frosted" },
    ];

    const frames: { code: FrameMaterialCode; name: string }[] = [
      { code: "FRAME_ALUM_CHARCOAL", name: "Charcoal Alum" },
      { code: "FRAME_UPVC_WHITE", name: "White uPVC" },
      { code: "FRAME_STEEL_TATA", name: "Steel" },
    ];

    return (
      <div className="absolute bottom-22 left-1/2 -translate-x-1/2 z-30 w-[95%] max-w-sm bg-slate-950/85 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-3 text-white animate-in fade-in slide-in-from-bottom-3 duration-200">
        <div className="flex items-center justify-between border-b border-white/10 pb-1.5 mb-2">
          <h3 className="font-bold text-xs tracking-wide">
            {win.type === "WINDOW_PANORAMIC" ? "Panoramic Window" : "Awning Window"}
          </h3>
          <button
            onClick={() => setSelectedEntity(null)}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-4 gap-1 mb-2">
          {glasses.map((g) => (
            <button
              key={g.code}
              onClick={() => updateWindow(cabin.id, win.id, { glassType: g.code })}
              className={`py-1 px-1.5 rounded-lg border text-[11px] font-medium transition truncate text-center ${
                win.glassType === g.code
                  ? "border-cyan-400 bg-cyan-500/20 text-cyan-200"
                  : "border-white/5 bg-white/5 text-slate-300 hover:border-white/15"
              }`}
            >
              {g.name}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-1 mb-2">
          {frames.map((f) => (
            <button
              key={f.code}
              onClick={() => updateWindow(cabin.id, win.id, { frameMaterial: f.code })}
              className={`py-1 px-1.5 rounded-lg border text-[11px] font-medium transition truncate text-center ${
                win.frameMaterial === f.code
                  ? "border-cyan-400 bg-cyan-500/20 text-cyan-200"
                  : "border-white/5 bg-white/5 text-slate-300 hover:border-white/15"
              }`}
            >
              {f.name}
            </button>
          ))}
        </div>

        <div className="flex justify-end pt-1.5 border-t border-white/10">
          <button
            onClick={() => removeWindow(cabin.id, win.id)}
            className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-[11px] text-red-300 border border-red-500/30 transition"
          >
            <Trash2 className="w-3 h-3" />
            <span>Remove</span>
          </button>
        </div>
      </div>
    );
  }

  // Selected Equipment
  if (selectedEntity.type === "equipment") {
    const eq = equipment.find((e) => e.id === selectedEntity.id);
    if (!eq) return null;
    const def = EQUIPMENT_CATALOG[eq.type];
    if (!def) return null;

    return (
      <div className="absolute bottom-22 left-1/2 -translate-x-1/2 z-30 w-[95%] max-w-sm bg-slate-950/85 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-3 text-white animate-in fade-in slide-in-from-bottom-3 duration-200">
        <div className="flex items-center justify-between border-b border-white/10 pb-1.5 mb-2">
          <div className="flex items-center space-x-1.5">
            <Sliders className="w-3.5 h-3.5 text-amber-400" />
            <h3 className="font-bold text-xs tracking-wide">{def.name.split("(")[0]}</h3>
          </div>
          <button
            onClick={() => setSelectedEntity(null)}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Brand Options */}
        <div className="flex flex-wrap gap-1 mb-2">
          {def.brands.map((b) => (
            <button
              key={b.name}
              onClick={() => updateEquipment(eq.id, { brand: b.name })}
              className={`py-1 px-2 rounded-lg border text-[11px] font-medium transition ${
                eq.brand === b.name
                  ? "border-amber-400 bg-amber-500/20 text-amber-200"
                  : "border-white/5 bg-white/5 text-slate-300 hover:border-white/15"
              }`}
            >
              {b.name}
            </button>
          ))}
        </div>

        {/* Capacity */}
        {def.capacities && (
          <div className="flex flex-wrap gap-1 mb-2">
            {def.capacities.map((c) => (
              <button
                key={c.label}
                onClick={() => updateEquipment(eq.id, { capacity: c.label })}
                className={`py-1 px-2 rounded-lg border text-[10px] font-medium transition ${
                  eq.capacity === c.label
                    ? "border-amber-400 bg-amber-500/20 text-amber-200"
                    : "border-white/5 bg-white/5 text-slate-300 hover:border-white/15"
                }`}
              >
                {c.label.split("(")[0]}
              </button>
            ))}
          </div>
        )}

        <div className="flex justify-end pt-1.5 border-t border-white/10">
          <button
            onClick={() => removeEquipment(eq.id)}
            className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-[11px] text-red-300 border border-red-500/30 transition"
          >
            <Trash2 className="w-3 h-3" />
            <span>Remove</span>
          </button>
        </div>
      </div>
    );
  }

  return null;
};
