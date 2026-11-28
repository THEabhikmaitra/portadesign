"use client";

import React, { useState, useEffect } from "react";
import { signOut, useSession } from "next-auth/react";
import { useStudioStore } from "@/store/useStudioStore";
import { EnvironmentType, CameraMode } from "@/types";
import {
  Sun,
  Moon,
  Volume2,
  VolumeX,
  Undo2,
  Redo2,
  Orbit,
  Eye,
  Scan,
  Compass,
  Trophy,
  Tag,
  History,
  Save,
  Box,
  Layers,
  Wrench,
  Building2,
  Globe,
  Sparkles,
  Truck,
  BookOpen,
  LogOut,
  ShieldCheck,
  User as UserIcon,
  PiggyBank,
  Thermometer,
  Zap,
  Target,
} from "lucide-react";

interface StudioToolbarProps {
  onOpenEquipmentPicker: () => void;
  onOpenSaveModal: () => void;
}

export const StudioToolbar: React.FC<StudioToolbarProps> = ({
  onOpenEquipmentPicker,
  onOpenSaveModal,
}) => {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [budgetInput, setBudgetInput] = useState("");
  const { data: session } = useSession();
  const authUser =
    (session?.user as {
      name?: string;
      email?: string;
      role?: string;
      image?: string;
    } | undefined) || null;

  const environment = useStudioStore((state) => state.environment);
  const setEnvironment = useStudioStore((state) => state.setEnvironment);
  const dayNight = useStudioStore((state) => state.dayNight);
  const toggleDayNight = useStudioStore((state) => state.toggleDayNight);

  const cameraMode = useStudioStore((state) => state.cameraMode);
  const setCameraMode = useStudioStore((state) => state.setCameraMode);

  const isMuted = useStudioStore((state) => state.isMuted);
  const toggleMute = useStudioStore((state) => state.toggleMute);

  const undo = useStudioStore((state) => state.undo);
  const redo = useStudioStore((state) => state.redo);
  const historyIndex = useStudioStore((state) => state.historyIndex);
  const history = useStudioStore((state) => state.history);

  const addCabin = useStudioStore((state) => state.addCabin);
  const cabins = useStudioStore((state) => state.cabins);
  const catalogElements = useStudioStore((state) => state.catalogElements);

  const activeDrawer = useStudioStore((state) => state.activeDrawer);
  const setActiveDrawer = useStudioStore((state) => state.setActiveDrawer);
  const setShowPurposePicker = useStudioStore((state) => state.setShowPurposePicker);
  const getBom = useStudioStore((state) => state.getBom);
  const getScores = useStudioStore((state) => state.getScores);
  const targetBudget = useStudioStore((state) => state.targetBudget);
  const setTargetBudget = useStudioStore((state) => state.setTargetBudget);
  const logistics = useStudioStore((state) => state.logistics);

  const bom = getBom();
  const scores = getScores();
  const budgetPct = Math.min(100, Math.round((bom.totalCost / (targetBudget || 1)) * 100));
  const isOverBudget = bom.totalCost > targetBudget;

  const handleBudgetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(budgetInput.replace(/\D/g, ""), 10);
    if (!isNaN(val) && val > 50000) {
      setTargetBudget(val);
    }
    setIsEditingBudget(false);
  };

  const cabinOptions = catalogElements.filter((el) => el.category === "CABIN");

  const environments: { id: EnvironmentType; label: string; icon: string }[] = [
    { id: "forest", label: "Garden Lawn", icon: "🏡" },
    { id: "urban", label: "House Rooftop", icon: "🏢" },
    { id: "beach", label: "Beach / Farm", icon: "🏖️" },
    { id: "desert", label: "Sunny Plot", icon: "☀️" },
  ];

  const cameraModes: { id: CameraMode; label: string; icon: any }[] = [
    { id: "orbit", label: "3D View", icon: Orbit },
    { id: "cutaway", label: "Open Roof", icon: Eye },
    { id: "firstperson", label: "Look Inside", icon: Compass },
  ];

  const initials = (authUser?.name || authUser?.email || "")
    .split(/[\s@]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");

  const flyoutClass = (id: string, alignBottom = false) =>
    `absolute ${alignBottom ? "bottom-0" : "top-0"} left-full pl-2 z-50 transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] origin-left ${
      openMenu === id
        ? "opacity-100 translate-x-0 scale-100 pointer-events-auto"
        : "opacity-0 -translate-x-1.5 scale-95 pointer-events-none"
    }`;

  return (
    <>
      {openMenu && (
        <div
          className="fixed inset-0 z-30 md:hidden"
          onClick={() => setOpenMenu(null)}
          aria-hidden="true"
        />
      )}

      {/* Left-Side-Only 6-Icon Hover Rail */}
      <aside
        aria-label="Portal Controls"
        className="fixed top-3 left-3 z-40 flex flex-col items-center gap-1.5 p-1.5 bg-white/95 backdrop-blur-xl border border-slate-200 rounded-2xl shadow-lg text-slate-800"
      >
        {/* 1. Brand / Ideas & Guides */}
        <div
          className="relative"
          onMouseEnter={() => setOpenMenu("brand")}
          onMouseLeave={() => setOpenMenu((m) => (m === "brand" ? null : m))}
        >
          <button
            type="button"
            onClick={() => setShowPurposePicker(true)}
            aria-label="MyPrefabRoom — Pick a Model"
            className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-100 transition"
          >
            <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center text-white font-black text-xs shadow-sm">
              M
            </div>
          </button>

          <div className={flyoutClass("brand")}>
              <div className="w-52 bg-white/95 backdrop-blur-xl border border-slate-200 rounded-2xl shadow-2xl p-1.5 space-y-0.5 text-xs text-slate-700">
                <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase">MyPrefabRoom</div>
                <button
                  type="button"
                  onClick={() => {
                    setShowPurposePicker(true);
                    setOpenMenu(null);
                  }}
                  className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-emerald-700 hover:bg-slate-100 transition text-left"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Ready Room Ideas</span>
                </button>
                <a
                  href="/guides"
                  onClick={() => setOpenMenu(null)}
                  className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-100 transition"
                >
                  <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Cost &amp; Permit Guides</span>
                </a>
              </div>
          </div>
        </div>

        {/* 2. Environment & Day/Night */}
        <div
          className="relative"
          onMouseEnter={() => setOpenMenu("env")}
          onMouseLeave={() => setOpenMenu((m) => (m === "env" ? null : m))}
        >
          <button
            type="button"
            onClick={toggleDayNight}
            aria-label="Site & Lighting"
            className={`w-10 h-10 flex items-center justify-center rounded-xl transition ${
              openMenu === "env"
                ? "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
                : "text-amber-600 hover:bg-slate-100"
            }`}
          >
            {dayNight === "night" ? <Moon className="w-4 h-4 text-indigo-600" /> : <Sun className="w-4 h-4" />}
          </button>

          <div className={flyoutClass("env")}>
              <div className="w-52 bg-white/95 backdrop-blur-xl border border-slate-200 rounded-2xl shadow-2xl p-1.5 space-y-0.5 text-xs text-slate-700">
                <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase">Site &amp; Lighting</div>
                {environments.map((env) => (
                  <button
                    key={env.id}
                    type="button"
                    onClick={() => {
                      setEnvironment(env.id);
                      setOpenMenu(null);
                    }}
                    className={`w-full flex items-center space-x-2 px-3 py-2 rounded-xl transition text-left ${
                      environment === env.id
                        ? "bg-emerald-50 text-emerald-700 font-semibold"
                        : "hover:bg-slate-100"
                    }`}
                  >
                    <span>{env.icon}</span>
                    <span>{env.label}</span>
                  </button>
                ))}
                <div className="my-1 border-t border-slate-200" />
                <button
                  type="button"
                  onClick={toggleDayNight}
                  className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl hover:bg-slate-100 transition text-left"
                >
                  {dayNight === "night" ? (
                    <Sun className="w-3.5 h-3.5 text-amber-600" />
                  ) : (
                    <Moon className="w-3.5 h-3.5 text-indigo-600" />
                  )}
                  <span>{dayNight === "night" ? "Switch to Daylight" : "Switch to Night Lights"}</span>
                </button>
              </div>
          </div>
        </div>

        {/* 3. Build (Rooms, 2nd Floor, Furniture, Transport) */}
        <div
          className="relative"
          onMouseEnter={() => setOpenMenu("build")}
          onMouseLeave={() => setOpenMenu((m) => (m === "build" ? null : m))}
        >
          <button
            type="button"
            onClick={onOpenEquipmentPicker}
            aria-label="Build & Add Rooms"
            className={`w-10 h-10 flex items-center justify-center rounded-xl transition ${
              openMenu === "build"
                ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                : "text-emerald-600 hover:bg-slate-100"
            }`}
          >
            <Box className="w-4 h-4" />
          </button>

          <div className={flyoutClass("build")}>
              <div className="w-56 bg-white/95 backdrop-blur-xl border border-slate-200 rounded-2xl shadow-2xl p-1.5 space-y-0.5 text-xs text-slate-700">
                <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase">Add Structure</div>
                {(cabinOptions.length > 0
                  ? cabinOptions
                  : [
                      { code: "CABIN_20FT", friendlyName: "+ 160 sq.ft Room", iconUrl: null },
                      { code: "CABIN_40FT", friendlyName: "+ 320 sq.ft Hall", iconUrl: null },
                    ]
                ).map((cab, idx) => (
                  <button
                    key={cab.code}
                    type="button"
                    onClick={() => {
                      addCabin(cab.code);
                      setOpenMenu(null);
                    }}
                    className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl hover:bg-slate-100 transition text-left font-medium"
                  >
                    {cab.iconUrl ? (
                      <img src={cab.iconUrl} alt={cab.friendlyName || cab.code} className="w-4 h-4 rounded object-cover" />
                    ) : (
                      <Box className={`w-3.5 h-3.5 ${idx % 2 === 0 ? "text-emerald-600" : "text-cyan-600"}`} />
                    )}
                    <span className="truncate">
                      {cab.friendlyName
                        ? cab.friendlyName.startsWith("+")
                          ? cab.friendlyName
                          : `+ ${cab.friendlyName}`
                        : `+ ${cab.code}`}
                    </span>
                  </button>
                ))}
                {cabins.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      const last = cabins[cabins.length - 1];
                      addCabin(last?.type || cabinOptions[0]?.code || "CABIN_20FT", 1, "top");
                      setOpenMenu(null);
                    }}
                    className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-indigo-700 hover:bg-indigo-50 transition text-left font-medium"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>+ 2nd Floor</span>
                  </button>
                )}
                <div className="my-1 border-t border-slate-200" />
                <button
                  type="button"
                  onClick={() => {
                    onOpenEquipmentPicker();
                    setOpenMenu(null);
                  }}
                  className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-amber-700 hover:bg-amber-50 transition text-left font-semibold"
                >
                  <Wrench className="w-3.5 h-3.5" />
                  <span>+ Furniture &amp; AC</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveDrawer(activeDrawer === "logistics" ? null : "logistics");
                    setOpenMenu(null);
                  }}
                  className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-cyan-700 hover:bg-cyan-50 transition text-left font-semibold"
                >
                  <Truck className="w-3.5 h-3.5" />
                  <span>2nd Hand &amp; Transport</span>
                </button>
              </div>
          </div>
        </div>

        {/* 4. View & Tools */}
        <div
          className="relative"
          onMouseEnter={() => setOpenMenu("view")}
          onMouseLeave={() => setOpenMenu((m) => (m === "view" ? null : m))}
        >
          <button
            type="button"
            onClick={() => setCameraMode("orbit")}
            aria-label="Camera & Tools"
            className={`w-10 h-10 flex items-center justify-center rounded-xl transition ${
              openMenu === "view"
                ? "bg-cyan-50 text-cyan-700 ring-1 ring-cyan-200"
                : "text-cyan-600 hover:bg-slate-100"
            }`}
          >
            <Orbit className="w-4 h-4" />
          </button>

          <div className={flyoutClass("view")}>
              <div className="w-56 bg-white/95 backdrop-blur-xl border border-slate-200 rounded-2xl shadow-2xl p-1.5 space-y-0.5 text-xs text-slate-700">
                <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase">Camera &amp; Views</div>
                {cameraModes.map((cm) => {
                  const Icon = cm.icon;
                  return (
                    <button
                      key={cm.id}
                      type="button"
                      onClick={() => {
                        setCameraMode(cm.id);
                        setOpenMenu(null);
                      }}
                      className={`w-full flex items-center space-x-2 px-3 py-2 rounded-xl transition text-left ${
                        cameraMode === cm.id ? "bg-cyan-50 text-cyan-700 font-semibold" : "hover:bg-slate-100"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{cm.label}</span>
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => {
                    setCameraMode("xray");
                    setOpenMenu(null);
                  }}
                  className={`w-full flex items-center space-x-2 px-3 py-2 rounded-xl transition text-left ${
                    cameraMode === "xray" ? "bg-cyan-50 text-cyan-700 font-semibold" : "hover:bg-slate-100"
                  }`}
                >
                  <Scan className="w-3.5 h-3.5 text-cyan-600" />
                  <span>Steel Structure X-Ray</span>
                </button>
                <div className="my-1 border-t border-slate-200" />
                <button
                  type="button"
                  onClick={() => {
                    setActiveDrawer(activeDrawer === "versions" ? null : "versions");
                    setOpenMenu(null);
                  }}
                  className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl hover:bg-slate-100 transition text-left"
                >
                  <History className="w-3.5 h-3.5 text-cyan-600" />
                  <span>Watch Build Steps</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveDrawer(activeDrawer === "challenges" ? null : "challenges");
                    setOpenMenu(null);
                  }}
                  className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl hover:bg-slate-100 transition text-left"
                >
                  <Trophy className="w-3.5 h-3.5 text-amber-600" />
                  <span>Design Challenges</span>
                </button>
                <div className="my-1 border-t border-slate-200" />
                <div className="flex items-center justify-between px-2 py-1">
                  <button
                    type="button"
                    onClick={undo}
                    disabled={historyIndex <= 0}
                    aria-label="Undo"
                    title="Undo"
                    className="p-2 rounded-xl hover:bg-slate-100 disabled:opacity-30 transition"
                  >
                    <Undo2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={redo}
                    disabled={historyIndex >= history.length - 1}
                    aria-label="Redo"
                    title="Redo"
                    className="p-2 rounded-xl hover:bg-slate-100 disabled:opacity-30 transition"
                  >
                    <Redo2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={toggleMute}
                    aria-label={isMuted ? "Unmute sound" : "Mute sound"}
                    title={isMuted ? "Turn Sound On" : "Mute Sound"}
                    className="p-2 rounded-xl hover:bg-slate-100 transition"
                  >
                    {isMuted ? (
                      <VolumeX className="w-3.5 h-3.5 text-red-500" />
                    ) : (
                      <Volume2 className="w-3.5 h-3.5 text-emerald-600" />
                    )}
                  </button>
                </div>
              </div>
          </div>
        </div>

        {/* 5. Money Pot: Price, Budget, Comfort & Item List */}
        <div
          className="relative"
          onMouseEnter={() => setOpenMenu("budget")}
          onMouseLeave={() => setOpenMenu((m) => (m === "budget" ? null : m))}
        >
          <button
            type="button"
            onClick={() => {
              if (cabins.length === 0) {
                setShowPurposePicker(true);
              } else {
                setActiveDrawer(activeDrawer === "bom" ? null : "bom");
              }
            }}
            aria-label="Budget, Price & Item List"
            title={
              cabins.length === 0
                ? "Pick a room to see price"
                : `₹${bom.totalCost.toLocaleString("en-IN")} • Item List (${bom.items.length})`
            }
            className={`w-10 h-10 flex items-center justify-center rounded-xl transition relative ${
              activeDrawer === "bom" || openMenu === "budget"
                ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                : "text-emerald-600 hover:bg-slate-100"
            }`}
          >
            <PiggyBank className="w-4 h-4" />
            {bom.items.length > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-emerald-600 text-white text-[9px] font-bold flex items-center justify-center shadow-sm">
                {bom.items.length}
              </span>
            )}
          </button>

          <div className={flyoutClass("budget")}>
            <div className="w-72 bg-white/95 backdrop-blur-xl border border-slate-200 rounded-2xl shadow-2xl p-3.5 text-slate-800 space-y-2.5">
              {cabins.length === 0 ? (
                <div className="space-y-2 text-center py-1">
                  <div className="text-xs font-semibold text-slate-600">No room placed yet</div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPurposePicker(true);
                      setOpenMenu(null);
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold hover:bg-emerald-100 transition"
                  >
                    Pick a room to see price
                  </button>
                </div>
              ) : (
                <>
                  <div className="border-b border-slate-200 pb-2">
                    <div className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                      True Landed Price (Incl. Tax + Transport)
                    </div>
                    <div className="flex items-baseline justify-between gap-2 mt-0.5">
                      <span className="text-lg font-black font-mono tracking-tight text-emerald-600">
                        ₹{bom.totalCost.toLocaleString("en-IN")}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveDrawer("bom");
                          setOpenMenu(null);
                        }}
                        className="text-[11px] font-semibold text-cyan-700 hover:text-cyan-900 underline"
                      >
                        Item List ({bom.items.length})
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveDrawer("logistics");
                        setOpenMenu(null);
                      }}
                      className="mt-1.5 inline-flex items-center space-x-1 text-[10px] px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100 transition"
                    >
                      <span>
                        {logistics.condition === "NEW"
                          ? "Brand New"
                          : logistics.condition === "REFURB_READY"
                          ? "2nd Hand (-38%)"
                          : "Used Shell (-55%)"}
                      </span>
                      <span>•</span>
                      <span>
                        {logistics.deliveryMode === "SELF_PICKUP"
                          ? "Self-Pickup"
                          : logistics.deliveryMode === "KNOCK_DOWN"
                          ? "Flat-Pack"
                          : logistics.placementLevel === "TERRACE"
                          ? "Terrace"
                          : logistics.placementLevel === "MID_FLOOR"
                          ? "1st/2nd Flr"
                          : "Ground"}
                      </span>
                      <span>•</span>
                      <span>
                        {logistics.deliveryMode === "SELF_PICKUP"
                          ? "₹0 Delivery"
                          : `₹${((bom.transportCost + bom.craneOrAssemblyCost) / 1000).toFixed(1)}k Delivery`}
                      </span>
                    </button>
                  </div>

                  {/* Target Budget Bar */}
                  <div>
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="flex items-center space-x-1 text-slate-600 font-medium">
                        <Target className="w-3 h-3 text-amber-600" />
                        <span>My Budget</span>
                      </span>
                      {isEditingBudget ? (
                        <form onSubmit={handleBudgetSubmit} className="flex items-center space-x-1">
                          <input
                            type="text"
                            value={budgetInput}
                            onChange={(e) => setBudgetInput(e.target.value)}
                            className="w-20 px-1.5 py-0.5 text-[10px] bg-slate-50 border border-slate-300 rounded text-right font-mono text-slate-900"
                            autoFocus
                          />
                          <button type="submit" className="text-[10px] text-emerald-700 font-bold">
                            Save
                          </button>
                        </form>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setBudgetInput(String(targetBudget));
                            setIsEditingBudget(true);
                          }}
                          className="font-mono text-slate-700 hover:text-emerald-700 transition underline decoration-dotted"
                          title="Tap to change your budget"
                        >
                          ₹{(targetBudget / 100000).toFixed(1)}L
                        </button>
                      )}
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden border border-slate-200">
                      <div
                        className={`h-full transition-all duration-500 rounded-full ${
                          isOverBudget ? "bg-amber-500" : "bg-emerald-500"
                        }`}
                        style={{ width: `${Math.min(100, budgetPct)}%` }}
                      />
                    </div>
                  </div>

                  {/* 3 Comfort Gauges */}
                  <div className="grid grid-cols-3 gap-1.5 pt-1 border-t border-slate-200">
                    <div className="bg-slate-50 p-2 rounded-xl text-center border border-slate-200/80">
                      <div className="flex items-center justify-center space-x-1 text-slate-600 mb-0.5">
                        <Thermometer className="w-3 h-3 text-cyan-600" />
                        <span className="text-[10px] font-semibold">Coolness</span>
                      </div>
                      <div className="text-xs font-black font-mono text-cyan-700">{scores.thermalComfort}%</div>
                      <div className="w-full bg-slate-200 h-1 rounded-full mt-1 overflow-hidden">
                        <div className="bg-cyan-500 h-full rounded-full" style={{ width: `${scores.thermalComfort}%` }} />
                      </div>
                    </div>

                    <div className="bg-slate-50 p-2 rounded-xl text-center border border-slate-200/80">
                      <div className="flex items-center justify-center space-x-1 text-slate-600 mb-0.5">
                        <Sun className="w-3 h-3 text-amber-500" />
                        <span className="text-[10px] font-semibold">Sunlight</span>
                      </div>
                      <div className="text-xs font-black font-mono text-amber-700">{scores.naturalDaylight}%</div>
                      <div className="w-full bg-slate-200 h-1 rounded-full mt-1 overflow-hidden">
                        <div className="bg-amber-500 h-full rounded-full" style={{ width: `${scores.naturalDaylight}%` }} />
                      </div>
                    </div>

                    <div className="bg-slate-50 p-2 rounded-xl text-center border border-slate-200/80">
                      <div className="flex items-center justify-center space-x-1 text-slate-600 mb-0.5">
                        <Zap className="w-3 h-3 text-emerald-600" />
                        <span className="text-[10px] font-semibold">Power Save</span>
                      </div>
                      <div className="text-xs font-black font-mono text-emerald-700">{scores.ecoSolar}%</div>
                      <div className="w-full bg-slate-200 h-1 rounded-full mt-1 overflow-hidden">
                        <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${scores.ecoSolar}%` }} />
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* 6. Save & Quotes */}
        <div
          className="relative"
          onMouseEnter={() => setOpenMenu("save")}
          onMouseLeave={() => setOpenMenu((m) => (m === "save" ? null : m))}
        >
          <button
            type="button"
            onClick={onOpenSaveModal}
            aria-label="Save & Get Quotes"
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white shadow-sm transition active:scale-95"
          >
            <Save className="w-4 h-4" />
          </button>

          <div className={flyoutClass("save")}>
              <div className="w-48 bg-white/95 backdrop-blur-xl border border-slate-200 rounded-2xl shadow-2xl p-1.5 space-y-0.5 text-xs text-slate-700">
                <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase">Export &amp; Pricing</div>
                <button
                  type="button"
                  onClick={() => {
                    onOpenSaveModal();
                    setOpenMenu(null);
                  }}
                  className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-emerald-700 hover:bg-emerald-50 transition text-left font-semibold"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save &amp; Share</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveDrawer(activeDrawer === "quotes" ? null : "quotes");
                    setOpenMenu(null);
                  }}
                  className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl hover:bg-slate-100 transition text-left font-medium"
                >
                  <Tag className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Get Quotes</span>
                </button>
              </div>
          </div>
        </div>

        <div className="w-6 h-px bg-slate-200 my-0.5" />

        {/* 6. Profile Picture Avatar */}
        <div
          className="relative"
          onMouseEnter={() => setOpenMenu("profile")}
          onMouseLeave={() => setOpenMenu((m) => (m === "profile" ? null : m))}
        >
          <button
            type="button"
            onClick={() => setOpenMenu((m) => (m === "profile" ? null : "profile"))}
            aria-label="Account Profile"
            className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-100 transition"
          >
            {authUser?.image ? (
              <img
                src={authUser.image}
                alt={authUser.name || "Profile"}
                referrerPolicy="no-referrer"
                className="w-7 h-7 rounded-full object-cover border border-emerald-400 shadow-sm"
              />
            ) : authUser ? (
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-emerald-600 to-cyan-600 text-white text-[11px] font-black flex items-center justify-center shadow-sm">
                {initials || "U"}
              </div>
            ) : (
              <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center">
                <UserIcon className="w-4 h-4" />
              </div>
            )}
          </button>

          <div className={flyoutClass("profile", true)}>
              <div className="w-56 bg-white/95 backdrop-blur-xl border border-slate-200 rounded-2xl shadow-2xl p-1.5 space-y-0.5 text-xs text-slate-700">
                {authUser ? (
                  <>
                    <div className="px-3 py-2 flex items-center gap-2.5 border-b border-slate-200 mb-1">
                      {authUser.image ? (
                        <img
                          src={authUser.image}
                          alt={authUser.name || "Profile"}
                          referrerPolicy="no-referrer"
                          className="w-8 h-8 rounded-full object-cover border border-emerald-300 shrink-0"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-600 to-cyan-600 text-white text-xs font-black flex items-center justify-center shrink-0">
                          {initials || "U"}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 truncate">{authUser.name || authUser.email}</div>
                        <div className="text-[10px] font-mono text-emerald-700">{authUser.role}</div>
                      </div>
                    </div>
                    <a
                      href="/profile"
                      onClick={() => setOpenMenu(null)}
                      className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-emerald-700 hover:bg-emerald-50 transition font-semibold"
                    >
                      <UserIcon className="w-3.5 h-3.5" />
                      <span>My Profile</span>
                    </a>
                    <a
                      href="/vendor"
                      onClick={() => setOpenMenu(null)}
                      className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl hover:bg-slate-100 transition"
                    >
                      <Building2 className="w-3.5 h-3.5 text-amber-600" />
                      <span>Maker / Vendor Portal</span>
                    </a>
                    {authUser.role === "ADMIN" && (
                      <a
                        href="/admin"
                        onClick={() => setOpenMenu(null)}
                        className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-cyan-700 hover:bg-slate-100 transition"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Admin Console</span>
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setOpenMenu(null);
                        signOut({ callbackUrl: "/" });
                      }}
                      className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-red-600 hover:bg-red-50 transition text-left"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </>
                ) : (
                  <>
                    <a
                      href="/profile"
                      onClick={() => setOpenMenu(null)}
                      className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-emerald-700 hover:bg-emerald-50 transition font-semibold"
                    >
                      <UserIcon className="w-3.5 h-3.5" />
                      <span>My Profile</span>
                    </a>
                    <a
                      href="/vendor"
                      onClick={() => setOpenMenu(null)}
                      className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl hover:bg-slate-100 transition"
                    >
                      <Building2 className="w-3.5 h-3.5 text-amber-600" />
                      <span>Maker / Vendor Portal</span>
                    </a>
                    <a
                      href="/auth/signin"
                      onClick={() => setOpenMenu(null)}
                      className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-emerald-700 hover:bg-emerald-50 transition font-semibold"
                    >
                      <Globe className="w-3.5 h-3.5" />
                      <span>Sign In / Register</span>
                    </a>
                  </>
                )}
              </div>
          </div>
        </div>
      </aside>
    </>
  );
};
