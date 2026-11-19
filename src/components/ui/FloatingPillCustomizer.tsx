"use client";

import React from "react";
import { useStudioStore } from "@/store/useStudioStore";
import {
  GlassTypeCode,
  FrameMaterialCode,
  WallFinishCode,
} from "@/types";
import { EQUIPMENT_CATALOG } from "@/lib/equipmentCatalog";
import { X, Trash2, Plus, Sparkles, Sliders, Layers } from "lucide-react";

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

    const finishes: { code: WallFinishCode; name: string; color: string; desc: string }[] = [
      { code: "FINISH_BATTLESHIP_GREY", name: "Battleship Grey", color: "#475569", desc: "Corrosion Shield Marine Polyurethane" },
      { code: "FINISH_OCEAN_CYBER", name: "Cyber Ocean Blue", color: "#0f3d5e", desc: "High-Gloss Modern Aesthetic" },
      { code: "FINISH_DESERT_BEIGE", name: "Sahara Sand Beige", color: "#cbb393", desc: "Thermal-Reflective Solar SRI 88" },
      { code: "FINISH_FOREST_OLIVE", name: "Tactical Forest Olive", color: "#2c3b2e", desc: "Matte Eco Camouflage Blend" },
    ];

    return (
      <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-30 w-[95%] max-w-xl bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-2xl shadow-2xl p-4 text-white animate-in fade-in slide-in-from-bottom-4 duration-200">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
          <div className="flex items-center space-x-2">
            <Layers className="w-5 h-5 text-emerald-400" />
            <h3 className="font-semibold text-sm tracking-wide">
              {cabin.type === "CABIN_40FT" ? "40ft High Cube Container" : "20ft Insulated Container"}
              <span className="ml-2 text-xs text-slate-400 font-mono">[{cabin.id}]</span>
            </h3>
          </div>
          <button
            onClick={() => setSelectedEntity(null)}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Wall Finish Swatches */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-slate-400 mb-2">
            Exterior Corten Coating & Paint Finish
          </label>
          <div className="grid grid-cols-2 gap-2">
            {finishes.map((f) => (
              <button
                key={f.code}
                onClick={() => updateCabinFinish(cabin.id, f.code)}
                className={`flex items-center space-x-2.5 p-2 rounded-xl text-left border transition ${
                  cabin.wallFinish === f.code
                    ? "border-emerald-400 bg-emerald-950/40"
                    : "border-slate-800 bg-slate-800/50 hover:border-slate-700"
                }`}
              >
                <div
                  className="w-5 h-5 rounded-full border border-white/20 shrink-0"
                  style={{ backgroundColor: f.color }}
                />
                <div className="overflow-hidden">
                  <div className="text-xs font-medium truncate">{f.name}</div>
                  <div className="text-[10px] text-slate-400 truncate">{f.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Quick Add Sub-Components & Stack Actions */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-800/80">
          <button
            onClick={() => addDoorToCabin(cabin.id, "DOOR_SLIDING_GLASS")}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 transition"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-400" />
            <span>+ Sliding Glass Door</span>
          </button>
          <button
            onClick={() => addDoorToCabin(cabin.id, "DOOR_STEEL_PANEL")}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 transition"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-400" />
            <span>+ Steel Door</span>
          </button>
          <button
            onClick={() => addWindowToCabin(cabin.id, "WINDOW_PANORAMIC")}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 transition"
          >
            <Plus className="w-3.5 h-3.5 text-cyan-400" />
            <span>+ Panoramic Window</span>
          </button>
          <button
            onClick={() => addCabin(cabin.type, cabin.tier + 1, "top")}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-900/60 hover:bg-indigo-800 border border-indigo-700 text-xs text-indigo-200 transition"
          >
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            <span>Stack Story #{cabin.tier + 2}</span>
          </button>
          <button
            onClick={() => removeCabin(cabin.id)}
            className="ml-auto p-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 border border-red-800 text-red-300 transition"
            title="Delete Container"
          >
            <Trash2 className="w-4 h-4" />
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

    const glasses: { code: GlassTypeCode; name: string; brand: string; tint: string }[] = [
      { code: "GLASS_CLEAR_SG", name: "Ultra Clear Float", brand: "Saint-Gobain Planiclear", tint: "90% Transmittance" },
      { code: "GLASS_TINTED_BLACK", name: "Cool-Lite Tinted Black", brand: "Saint-Gobain", tint: "65% Heat Rejection" },
      { code: "GLASS_BRONZE_AIS", name: "Reflective Bronze", brand: "AIS SunShield", tint: "70% Solar Shield" },
      { code: "GLASS_FROSTED_AIS", name: "Satinlite Privacy White", brand: "AIS Glass", tint: "Translucent Obscure" },
    ];

    const frames: { code: FrameMaterialCode; name: string; brand: string }[] = [
      { code: "FRAME_ALUM_CHARCOAL", name: "Matt Charcoal Powder Aluminum", brand: "Jindal Aluminium" },
      { code: "FRAME_UPVC_WHITE", name: "Multi-Chamber Glacier uPVC", brand: "Fenesta" },
      { code: "FRAME_STEEL_TATA", name: "Heavy Hot-Dip Steel", brand: "Tata Structura" },
    ];

    return (
      <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-30 w-[95%] max-w-lg bg-slate-900/90 backdrop-blur-md border border-cyan-500/40 rounded-2xl shadow-2xl p-4 text-white animate-in fade-in slide-in-from-bottom-4 duration-200">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            <h3 className="font-semibold text-sm">
              {door.type === "DOOR_SLIDING_GLASS" ? "Panoramic Sliding Patio Door" : "Steel Security Door"}
            </h3>
          </div>
          <button
            onClick={() => setSelectedEntity(null)}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {door.type === "DOOR_SLIDING_GLASS" && (
          <div className="mb-3">
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              Architectural Glass Specification
            </label>
            <div className="grid grid-cols-2 gap-2">
              {glasses.map((g) => (
                <button
                  key={g.code}
                  onClick={() => updateDoor(cabin.id, door.id, { glassType: g.code, brand: g.brand })}
                  className={`p-2 rounded-xl text-left border text-xs transition ${
                    door.glassType === g.code
                      ? "border-cyan-400 bg-cyan-950/40 font-medium"
                      : "border-slate-800 bg-slate-800/40 hover:border-slate-700"
                  }`}
                >
                  <div className="text-white truncate">{g.name}</div>
                  <div className="text-[10px] text-cyan-300/80">{g.brand}</div>
                  <div className="text-[9px] text-slate-400">{g.tint}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mb-3">
          <label className="block text-xs font-medium text-slate-400 mb-1.5">
            Frame Profile & Material
          </label>
          <div className="grid grid-cols-3 gap-2">
            {frames.map((f) => (
              <button
                key={f.code}
                onClick={() => updateDoor(cabin.id, door.id, { frameMaterial: f.code })}
                className={`p-2 rounded-xl text-left border text-xs transition ${
                  door.frameMaterial === f.code
                    ? "border-cyan-400 bg-cyan-950/40 font-medium"
                    : "border-slate-800 bg-slate-800/40 hover:border-slate-700"
                }`}
              >
                <div className="text-white truncate">{f.name}</div>
                <div className="text-[10px] text-slate-400">{f.brand}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-slate-800">
          <button
            onClick={() => removeDoor(cabin.id, door.id)}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-red-950/50 hover:bg-red-900 border border-red-800 text-xs text-red-200 transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Remove Door</span>
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

    const glasses: { code: GlassTypeCode; name: string; brand: string; tint: string }[] = [
      { code: "GLASS_CLEAR_SG", name: "Ultra Clear Float", brand: "Saint-Gobain Planiclear", tint: "90% Transmittance" },
      { code: "GLASS_TINTED_BLACK", name: "Cool-Lite Tinted Black", brand: "Saint-Gobain", tint: "65% Heat Rejection" },
      { code: "GLASS_BRONZE_AIS", name: "Reflective Bronze", brand: "AIS SunShield", tint: "70% Solar Shield" },
      { code: "GLASS_FROSTED_AIS", name: "Satinlite Privacy White", brand: "AIS Glass", tint: "Translucent Obscure" },
    ];

    const frames: { code: FrameMaterialCode; name: string; brand: string }[] = [
      { code: "FRAME_ALUM_CHARCOAL", name: "Matt Charcoal Powder Aluminum", brand: "Jindal Aluminium" },
      { code: "FRAME_UPVC_WHITE", name: "Multi-Chamber Glacier uPVC", brand: "Fenesta" },
      { code: "FRAME_STEEL_TATA", name: "Heavy Hot-Dip Steel", brand: "Tata Structura" },
    ];

    return (
      <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-30 w-[95%] max-w-lg bg-slate-900/90 backdrop-blur-md border border-cyan-500/40 rounded-2xl shadow-2xl p-4 text-white animate-in fade-in slide-in-from-bottom-4 duration-200">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            <h3 className="font-semibold text-sm">
              {win.type === "WINDOW_PANORAMIC" ? "Architectural Panoramic Viewport" : "Standard Awning Window"}
            </h3>
          </div>
          <button
            onClick={() => setSelectedEntity(null)}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mb-3">
          <label className="block text-xs font-medium text-slate-400 mb-1.5">
            Glass Technology & UV Shield
          </label>
          <div className="grid grid-cols-2 gap-2">
            {glasses.map((g) => (
              <button
                key={g.code}
                onClick={() => updateWindow(cabin.id, win.id, { glassType: g.code, brand: g.brand })}
                className={`p-2 rounded-xl text-left border text-xs transition ${
                  win.glassType === g.code
                    ? "border-cyan-400 bg-cyan-950/40 font-medium"
                    : "border-slate-800 bg-slate-800/40 hover:border-slate-700"
                }`}
              >
                <div className="text-white truncate">{g.name}</div>
                <div className="text-[10px] text-cyan-300/80">{g.brand}</div>
                <div className="text-[9px] text-slate-400">{g.tint}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="mb-3">
          <label className="block text-xs font-medium text-slate-400 mb-1.5">
            Window Frame Profile
          </label>
          <div className="grid grid-cols-3 gap-2">
            {frames.map((f) => (
              <button
                key={f.code}
                onClick={() => updateWindow(cabin.id, win.id, { frameMaterial: f.code })}
                className={`p-2 rounded-xl text-left border text-xs transition ${
                  win.frameMaterial === f.code
                    ? "border-cyan-400 bg-cyan-950/40 font-medium"
                    : "border-slate-800 bg-slate-800/40 hover:border-slate-700"
                }`}
              >
                <div className="text-white truncate">{f.name}</div>
                <div className="text-[10px] text-slate-400">{f.brand}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-slate-800">
          <button
            onClick={() => removeWindow(cabin.id, win.id)}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-red-950/50 hover:bg-red-900 border border-red-800 text-xs text-red-200 transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Remove Window</span>
          </button>
        </div>
      </div>
    );
  }

  // Selected Smart Equipment
  if (selectedEntity.type === "equipment") {
    const eq = equipment.find((e) => e.id === selectedEntity.id);
    if (!eq) return null;
    const def = EQUIPMENT_CATALOG[eq.type];
    if (!def) return null;

    return (
      <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-30 w-[95%] max-w-lg bg-slate-900/90 backdrop-blur-md border border-amber-500/40 rounded-2xl shadow-2xl p-4 text-white animate-in fade-in slide-in-from-bottom-4 duration-200">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
          <div className="flex items-center space-x-2">
            <Sliders className="w-5 h-5 text-amber-400" />
            <h3 className="font-semibold text-sm">{def.name}</h3>
          </div>
          <button
            onClick={() => setSelectedEntity(null)}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Brand Options */}
        <div className="mb-3">
          <label className="block text-xs font-medium text-slate-400 mb-1.5">
            Select Manufacturer Brand
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {def.brands.map((b) => (
              <button
                key={b.name}
                onClick={() => updateEquipment(eq.id, { brand: b.name })}
                className={`p-2 rounded-xl text-left border text-xs transition ${
                  eq.brand === b.name
                    ? "border-amber-400 bg-amber-950/40 font-medium"
                    : "border-slate-800 bg-slate-800/40 hover:border-slate-700"
                }`}
              >
                <div className="text-white truncate">{b.name}</div>
                <div className="text-[10px] text-amber-300/80">
                  {b.modifier === 0 ? "Standard" : b.modifier > 0 ? `+₹${b.modifier.toLocaleString()}` : `-₹${Math.abs(b.modifier).toLocaleString()}`}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Capacity / Size Options */}
        {def.capacities && def.capacities.length > 0 && (
          <div className="mb-3">
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              Capacity / Scale
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {def.capacities.map((c) => (
                <button
                  key={c.label}
                  onClick={() => updateEquipment(eq.id, { capacity: c.label })}
                  className={`p-2 rounded-xl text-left border text-xs transition ${
                    eq.capacity === c.label
                      ? "border-amber-400 bg-amber-950/40 font-medium"
                      : "border-slate-800 bg-slate-800/40 hover:border-slate-700"
                  }`}
                >
                  <div className="text-white truncate">{c.label}</div>
                  <div className="text-[10px] text-slate-400">
                    {c.modifier === 0 ? "Included" : c.modifier > 0 ? `+₹${c.modifier.toLocaleString()}` : `-₹${Math.abs(c.modifier).toLocaleString()}`}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Finish Options (if any) */}
        {def.finishes && def.finishes.length > 0 && (
          <div className="mb-3">
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              Material Finish
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {def.finishes.map((f) => (
                <button
                  key={f.label}
                  onClick={() => updateEquipment(eq.id, { finish: f.label })}
                  className={`flex items-center space-x-2 p-2 rounded-xl text-left border text-xs transition ${
                    eq.finish === f.label
                      ? "border-amber-400 bg-amber-950/40 font-medium"
                      : "border-slate-800 bg-slate-800/40 hover:border-slate-700"
                  }`}
                >
                  <div className="w-3.5 h-3.5 rounded-full border border-white/20 shrink-0" style={{ backgroundColor: f.color }} />
                  <span className="truncate">{f.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end pt-2 border-t border-slate-800">
          <button
            onClick={() => removeEquipment(eq.id)}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-red-950/50 hover:bg-red-900 border border-red-800 text-xs text-red-200 transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Remove Equipment</span>
          </button>
        </div>
      </div>
    );
  }

  return null;
};
