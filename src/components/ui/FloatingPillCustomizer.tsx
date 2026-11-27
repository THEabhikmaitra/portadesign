"use client";

import React from "react";
import { useStudioStore } from "@/store/useStudioStore";
import { X, Trash2, Layers, Sliders, RotateCw, ArrowLeft, ArrowRight, ArrowUp, ArrowDown } from "lucide-react";

export const FloatingPillCustomizer: React.FC = () => {
  const selectedEntity = useStudioStore((state) => state.selectedEntity);
  const setSelectedEntity = useStudioStore((state) => state.setSelectedEntity);
  const cabins = useStudioStore((state) => state.cabins);
  const equipment = useStudioStore((state) => state.equipment);
  const catalogElements = useStudioStore((state) => state.catalogElements);
  const catalogAttributes = useStudioStore((state) => state.catalogAttributes);

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
  const nudgeSelectedEntity = useStudioStore((state) => state.nudgeSelectedEntity);
  const rotateSelectedEntity = useStudioStore((state) => state.rotateSelectedEntity);

  if (!selectedEntity) return null;

  const finishes = catalogAttributes.filter((a) => a.category === "WALL_FINISH");
  const glasses = catalogAttributes.filter((a) => a.category === "GLASS_TYPE");
  const frames = catalogAttributes.filter((a) => a.category === "FRAME_MATERIAL");
  const doorsCatalog = catalogElements.filter((e) => e.category === "DOOR");
  const windowsCatalog = catalogElements.filter((e) => e.category === "WINDOW");

  if (selectedEntity.type === "cabin") {
    const cabin = cabins.find((c) => c.id === selectedEntity.id);
    if (!cabin) return null;
    const cabinMeta = catalogElements.find((e) => e.code === cabin.type);
    const defaultDoorCode = doorsCatalog[0]?.code || "DOOR_SLIDING_GLASS";
    const defaultWinCode = windowsCatalog[0]?.code || "WINDOW_PANORAMIC";

    return (
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-30 w-[95%] max-w-md bg-slate-950/90 backdrop-blur-xl border border-white/15 rounded-2xl shadow-2xl p-3.5 text-white animate-in fade-in slide-in-from-bottom-3 duration-200">
        <div className="flex items-center justify-between border-b border-white/10 pb-1.5 mb-2.5">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-emerald-400" />
            <h3 className="font-bold text-xs tracking-wide">
              {cabinMeta?.friendlyName || cabinMeta?.name || cabin.type}
            </h3>
          </div>
          <button
            onClick={() => setSelectedEntity(null)}
            aria-label="Close room editor"
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="text-[11px] text-slate-400 mb-1.5">Wall Paint / Finish</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 mb-2.5 max-h-24 overflow-y-auto">
          {finishes.map((f) => (
            <button
              key={f.code}
              onClick={() => updateCabinFinish(cabin.id, f.code)}
              className={`flex items-center justify-center space-x-1.5 py-1.5 px-2 rounded-xl border text-xs font-medium transition active:scale-95 ${
                cabin.wallFinish === f.code
                  ? "border-emerald-400 bg-emerald-500/15 text-white"
                  : "border-white/5 bg-white/5 text-slate-300 hover:border-white/15"
              }`}
            >
              {f.iconUrl ? (
                <img src={f.iconUrl} alt={f.name} className="w-3.5 h-3.5 rounded-full object-cover shrink-0" />
              ) : (
                <span
                  className="w-3 h-3 rounded-full border border-white/30 shrink-0"
                  style={{ backgroundColor: f.shader?.color || "#475569" }}
                />
              )}
              <span className="text-[11px] truncate">{f.friendlyName || f.name}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5 pt-2 border-t border-white/10 text-xs">
          <button
            onClick={() => addDoorToCabin(cabin.id, defaultDoorCode)}
            className="flex-1 py-1.5 px-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 transition truncate text-center font-medium"
          >
            + Door
          </button>
          <button
            onClick={() => addWindowToCabin(cabin.id, defaultWinCode)}
            className="flex-1 py-1.5 px-2 rounded-lg bg-white/5 hover:bg-white/10 text-cyan-200 border border-white/10 transition truncate text-center font-medium"
          >
            + Window
          </button>
          <button
            onClick={() => addCabin(cabin.type, cabin.tier + 1, "top")}
            className="flex-1 py-1.5 px-2 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-200 border border-indigo-500/30 transition truncate text-center font-medium"
          >
            + Floor #{cabin.tier + 2}
          </button>
          <button
            onClick={() => removeCabin(cabin.id)}
            aria-label="Delete room"
            className="p-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 transition"
            title="Remove Room"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  if (selectedEntity.type === "door") {
    const cabin = cabins.find((c) => c.id === selectedEntity.parentCabinId);
    const door = cabin?.doors.find((d) => d.id === selectedEntity.id);
    if (!cabin || !door) return null;
    const doorMeta = doorsCatalog.find((d) => d.code === door.type);

    return (
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-30 w-[95%] max-w-sm bg-slate-950/90 backdrop-blur-xl border border-white/15 rounded-2xl shadow-2xl p-3.5 text-white animate-in fade-in slide-in-from-bottom-3 duration-200">
        <div className="flex items-center justify-between border-b border-white/10 pb-1.5 mb-2">
          <h3 className="font-bold text-xs tracking-wide">
            {doorMeta?.friendlyName || doorMeta?.name || door.type}
          </h3>
          <button
            onClick={() => setSelectedEntity(null)}
            aria-label="Close door editor"
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {doorsCatalog.length > 1 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {doorsCatalog.map((dc) => (
              <button
                key={dc.code}
                onClick={() => updateDoor(cabin.id, door.id, { type: dc.code })}
                className={`py-1 px-2 rounded-lg border text-[10px] font-semibold transition ${
                  door.type === dc.code
                    ? "border-emerald-400 bg-emerald-500/20 text-emerald-200"
                    : "border-white/5 bg-white/5 text-slate-300"
                }`}
              >
                {dc.friendlyName || dc.name}
              </button>
            ))}
          </div>
        )}

        {door.type.includes("GLASS") && glasses.length > 0 && (
          <div className="grid grid-cols-4 gap-1 mb-2">
            {glasses.map((g) => (
              <button
                key={g.code}
                onClick={() => updateDoor(cabin.id, door.id, { glassType: g.code })}
                className={`py-1.5 px-1 rounded-lg border text-[11px] font-medium transition truncate text-center ${
                  door.glassType === g.code
                    ? "border-cyan-400 bg-cyan-500/20 text-cyan-200"
                    : "border-white/5 bg-white/5 text-slate-300 hover:border-white/15"
                }`}
              >
                {g.friendlyName || g.name}
              </button>
            ))}
          </div>
        )}

        <div className="grid grid-cols-3 gap-1 mb-2.5">
          {frames.map((f) => (
            <button
              key={f.code}
              onClick={() => updateDoor(cabin.id, door.id, { frameMaterial: f.code })}
              className={`py-1.5 px-1 rounded-lg border text-[11px] font-medium transition truncate text-center ${
                door.frameMaterial === f.code
                  ? "border-cyan-400 bg-cyan-500/20 text-cyan-200"
                  : "border-white/5 bg-white/5 text-slate-300 hover:border-white/15"
              }`}
            >
              {f.friendlyName || f.name}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-white/10">
          <div className="flex items-center space-x-1">
            <span className="text-[11px] text-slate-400 mr-1">Slide:</span>
            <button
              onClick={() => nudgeSelectedEntity(-0.4, 0)}
              aria-label="Move door left"
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => nudgeSelectedEntity(0.4, 0)}
              aria-label="Move door right"
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 transition"
            >
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <button
            onClick={() => removeDoor(cabin.id, door.id)}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-[11px] text-red-300 border border-red-500/30 transition"
          >
            <Trash2 className="w-3 h-3" />
            <span>Remove</span>
          </button>
        </div>
      </div>
    );
  }

  if (selectedEntity.type === "window") {
    const cabin = cabins.find((c) => c.id === selectedEntity.parentCabinId);
    const win = cabin?.windows.find((w) => w.id === selectedEntity.id);
    if (!cabin || !win) return null;
    const winMeta = windowsCatalog.find((w) => w.code === win.type);

    return (
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-30 w-[95%] max-w-sm bg-slate-950/90 backdrop-blur-xl border border-white/15 rounded-2xl shadow-2xl p-3.5 text-white animate-in fade-in slide-in-from-bottom-3 duration-200">
        <div className="flex items-center justify-between border-b border-white/10 pb-1.5 mb-2">
          <h3 className="font-bold text-xs tracking-wide">
            {winMeta?.friendlyName || winMeta?.name || win.type}
          </h3>
          <button
            onClick={() => setSelectedEntity(null)}
            aria-label="Close window editor"
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {windowsCatalog.length > 1 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {windowsCatalog.map((wc) => (
              <button
                key={wc.code}
                onClick={() => updateWindow(cabin.id, win.id, { type: wc.code })}
                className={`py-1 px-2 rounded-lg border text-[10px] font-semibold transition ${
                  win.type === wc.code
                    ? "border-emerald-400 bg-emerald-500/20 text-emerald-200"
                    : "border-white/5 bg-white/5 text-slate-300"
                }`}
              >
                {wc.friendlyName || wc.name}
              </button>
            ))}
          </div>
        )}

        <div className="grid grid-cols-4 gap-1 mb-2">
          {glasses.map((g) => (
            <button
              key={g.code}
              onClick={() => updateWindow(cabin.id, win.id, { glassType: g.code })}
              className={`py-1.5 px-1 rounded-lg border text-[11px] font-medium transition truncate text-center ${
                win.glassType === g.code
                  ? "border-cyan-400 bg-cyan-500/20 text-cyan-200"
                  : "border-white/5 bg-white/5 text-slate-300 hover:border-white/15"
              }`}
            >
              {g.friendlyName || g.name}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-1 mb-2.5">
          {frames.map((f) => (
            <button
              key={f.code}
              onClick={() => updateWindow(cabin.id, win.id, { frameMaterial: f.code })}
              className={`py-1.5 px-1 rounded-lg border text-[11px] font-medium transition truncate text-center ${
                win.frameMaterial === f.code
                  ? "border-cyan-400 bg-cyan-500/20 text-cyan-200"
                  : "border-white/5 bg-white/5 text-slate-300 hover:border-white/15"
              }`}
            >
              {f.friendlyName || f.name}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-white/10">
          <div className="flex items-center space-x-1">
            <span className="text-[11px] text-slate-400 mr-1">Slide:</span>
            <button
              onClick={() => nudgeSelectedEntity(-0.4, 0)}
              aria-label="Move window left"
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => nudgeSelectedEntity(0.4, 0)}
              aria-label="Move window right"
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 transition"
            >
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <button
            onClick={() => removeWindow(cabin.id, win.id)}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-[11px] text-red-300 border border-red-500/30 transition"
          >
            <Trash2 className="w-3 h-3" />
            <span>Remove</span>
          </button>
        </div>
      </div>
    );
  }

  if (selectedEntity.type === "equipment") {
    const eq = equipment.find((e) => e.id === selectedEntity.id);
    if (!eq) return null;
    const def = catalogElements.find((e) => e.code === eq.type);
    const brands = def?.options?.brands || [];
    const capacities = def?.options?.capacities || [];
    const finishesEq = def?.options?.finishes || [];

    return (
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-30 w-[95%] max-w-md bg-slate-950/90 backdrop-blur-xl border border-white/15 rounded-2xl shadow-2xl p-3.5 text-white animate-in fade-in slide-in-from-bottom-3 duration-200">
        <div className="flex items-center justify-between border-b border-white/10 pb-1.5 mb-2">
          <div className="flex items-center space-x-2">
            {(def?.imageUrl || def?.iconUrl) ? (
              <img
                src={(def.imageUrl || def.iconUrl)!}
                alt={def.friendlyName || def.name}
                className="w-5 h-5 rounded object-cover"
              />
            ) : (
              <Sliders className="w-3.5 h-3.5 text-amber-400" />
            )}
            <h3 className="font-bold text-xs tracking-wide">
              {def?.friendlyName || def?.name || eq.type}
            </h3>
          </div>
          <button
            onClick={() => setSelectedEntity(null)}
            aria-label="Close item editor"
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {brands.length > 0 && (
          <>
            <div className="text-[11px] text-slate-400 mb-1">Brand</div>
            <div className="flex flex-wrap gap-1 mb-2">
              {brands.map((b) => (
                <button
                  key={b.name}
                  onClick={() => updateEquipment(eq.id, { brand: b.name })}
                  className={`py-1 px-2.5 rounded-lg border text-[11px] font-medium transition ${
                    eq.brand === b.name
                      ? "border-amber-400 bg-amber-500/20 text-amber-200"
                      : "border-white/5 bg-white/5 text-slate-300 hover:border-white/15"
                  }`}
                >
                  {b.name}
                </button>
              ))}
            </div>
          </>
        )}

        {capacities.length > 0 && (
          <>
            <div className="text-[11px] text-slate-400 mb-1">Size / Power</div>
            <div className="flex flex-wrap gap-1 mb-2">
              {capacities.map((c) => (
                <button
                  key={c.label}
                  onClick={() => updateEquipment(eq.id, { capacity: c.label })}
                  className={`py-1 px-2.5 rounded-lg border text-[11px] font-medium transition ${
                    eq.capacity === c.label
                      ? "border-amber-400 bg-amber-500/20 text-amber-200"
                      : "border-white/5 bg-white/5 text-slate-300 hover:border-white/15"
                  }`}
                >
                  {c.label.split("(")[0]}
                </button>
              ))}
            </div>
          </>
        )}

        {finishesEq.length > 0 && (
          <>
            <div className="text-[11px] text-slate-400 mb-1">Finish / Color</div>
            <div className="flex flex-wrap gap-1 mb-2.5">
              {finishesEq.map((f) => (
                <button
                  key={f.label}
                  onClick={() => updateEquipment(eq.id, { finish: f.label })}
                  className={`flex items-center space-x-1.5 py-1 px-2.5 rounded-lg border text-[11px] font-medium transition ${
                    eq.finish === f.label
                      ? "border-amber-400 bg-amber-500/20 text-amber-200"
                      : "border-white/5 bg-white/5 text-slate-300 hover:border-white/15"
                  }`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full border border-white/30"
                    style={{ backgroundColor: f.color }}
                  />
                  <span>{f.label}</span>
                </button>
              ))}
            </div>
          </>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-white/10">
          <div className="flex items-center space-x-1">
            <button
              onClick={() => nudgeSelectedEntity(-0.35, 0)}
              aria-label="Move left"
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => nudgeSelectedEntity(0.35, 0)}
              aria-label="Move right"
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 transition"
            >
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => nudgeSelectedEntity(0, -0.35)}
              aria-label="Move back"
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 transition"
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => nudgeSelectedEntity(0, 0.35)}
              aria-label="Move forward"
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 transition"
            >
              <ArrowDown className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={rotateSelectedEntity}
              className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-[11px] font-semibold text-cyan-200 transition ml-1"
            >
              <RotateCw className="w-3 h-3" />
              <span>Rotate</span>
            </button>
          </div>

          <button
            onClick={() => removeEquipment(eq.id)}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-[11px] text-red-300 border border-red-500/30 transition"
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
