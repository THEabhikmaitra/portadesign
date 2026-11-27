"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import {
  Sparkles,
  Plus,
  Trash2,
  Save,
  Loader2,
  CheckCircle2,
  Eye,
  EyeOff,
  Box,
  Layers,
  Trophy,
  Truck,
  FileCode2,
} from "lucide-react";
import { AdminAssetUploader } from "./AdminAssetUploader";
import { ThreePrimitive, ChallengeRule } from "@/types";

const AdminMini3DPreview = dynamic(
  () => import("./AdminMini3DPreview").then((m) => m.AdminMini3DPreview),
  { ssr: false }
);

function tryParse<T>(raw: any, fallback: T): T {
  if (!raw) return fallback;
  if (typeof raw !== "string") return raw as T;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/* =========================================================================
   1. ELEMENTS & AI GENERATOR TAB
   ========================================================================= */
export const AdminElementsPanel: React.FC<{
  elements: any[];
  ollamaOnline: boolean;
  onRefresh: () => void;
  onNotify: (msg: string) => void;
}> = ({ elements, ollamaOnline, onRefresh, onNotify }) => {
  const [filterCat, setFilterCat] = useState("ALL");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [friendlyName, setFriendlyName] = useState("");
  const [category, setCategory] = useState("EQUIPMENT");
  const [subCategory, setSubCategory] = useState("INTERIOR");
  const [mountZone, setMountZone] = useState("FLOOR_INTERIOR");
  const [description, setDescription] = useState("");
  const [baseCost, setBaseCost] = useState(25000);
  const [dims, setDims] = useState({ width: 1.2, height: 1.0, depth: 0.6, length: 1.2, weightKg: 40 });
  const [iconUrl, setIconUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [optionsJson, setOptionsJson] = useState(
    JSON.stringify(
      {
        spotLabel: "Auto-fits inside room",
        brands: [{ name: "Standard", modifier: 0, description: "Factory fitment" }],
        capacities: [{ label: "Standard", modifier: 0, multiplier: 1 }],
        finishes: [],
      },
      null,
      2
    )
  );
  const [primitives, setPrimitives] = useState<ThreePrimitive[]>([
    { shape: "box", args: [1.1, 0.8, 0.6], position: [0, 0.4, 0], color: "#cbd5e1", roughness: 0.4, metalness: 0.3 },
  ]);
  const [isActive, setIsActive] = useState(true);
  const [sortOrder, setSortOrder] = useState(50);
  const [saving, setSaving] = useState(false);

  // AI Generator State
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiCategory, setAiCategory] = useState("EQUIPMENT");
  const [aiCount, setAiCount] = useState(3);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiStaging, setAiStaging] = useState<any[]>([]);
  const [bulkRaw, setBulkRaw] = useState("");
  const [showBulk, setShowBulk] = useState(false);

  const resetForm = () => {
    setEditingId(null);
    setCode("");
    setName("");
    setFriendlyName("");
    setCategory("EQUIPMENT");
    setSubCategory("INTERIOR");
    setMountZone("FLOOR_INTERIOR");
    setDescription("");
    setBaseCost(25000);
    setDims({ width: 1.2, height: 1.0, depth: 0.6, length: 1.2, weightKg: 40 });
    setIconUrl("");
    setImageUrl("");
    setOptionsJson(
      JSON.stringify(
        {
          spotLabel: "Auto-fits inside room",
          brands: [{ name: "Standard", modifier: 0, description: "Factory fitment" }],
          capacities: [{ label: "Standard", modifier: 0, multiplier: 1 }],
          finishes: [],
        },
        null,
        2
      )
    );
    setPrimitives([
      { shape: "box", args: [1.1, 0.8, 0.6], position: [0, 0.4, 0], color: "#cbd5e1", roughness: 0.4, metalness: 0.3 },
    ]);
    setIsActive(true);
    setSortOrder(50);
  };

  const loadIntoForm = (el: any) => {
    setEditingId(el.id);
    setCode(el.code);
    setName(el.name);
    setFriendlyName(el.friendlyName || "");
    setCategory(el.category);
    setSubCategory(el.subCategory || "INTERIOR");
    setMountZone(el.mountZone || "FLOOR_INTERIOR");
    setDescription(el.description || "");
    setBaseCost(el.baseCost || 0);
    const parsedDims = tryParse(el.dimensionsJson, {});
    setDims({ width: 1.2, height: 1.0, depth: 0.6, length: 1.2, weightKg: 40, ...parsedDims });
    setIconUrl(el.iconUrl || "");
    setImageUrl(el.imageUrl || "");
    const parsedOpts = tryParse(el.optionsJson, {});
    setOptionsJson(JSON.stringify(parsedOpts, null, 2));
    const parsedThree = tryParse<any>(el.threeConfigJson, { primitives: [] });
    setPrimitives(Array.isArray(parsedThree?.primitives) ? parsedThree.primitives : []);
    setIsActive(Boolean(el.isActive));
    setSortOrder(el.sortOrder || 0);
  };

  const handleSaveElement = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const existingThree = editingId
        ? tryParse<any>(elements.find((x) => x.id === editingId)?.threeConfigJson, {})
        : {};
      const threePayload = {
        ...existingThree,
        primitives,
      };
      const payload = {
        id: editingId || undefined,
        code,
        name,
        friendlyName: friendlyName || name,
        category,
        subCategory,
        mountZone,
        description,
        baseCost,
        dimensionsJson: JSON.stringify(dims),
        optionsJson,
        threeConfigJson: JSON.stringify(threePayload),
        iconUrl: iconUrl || null,
        imageUrl: imageUrl || null,
        isActive,
        sortOrder,
      };
      const res = await fetch("/api/admin/elements", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      onNotify(`Saved element ${code.toUpperCase()} — live in Studio & Vendor Portal.`);
      resetForm();
      onRefresh();
    } catch (err: any) {
      onNotify(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (el: any) => {
    await fetch("/api/admin/elements", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: el.id, isActive: !el.isActive }),
    });
    onRefresh();
  };

  const deleteElement = async (id: string) => {
    if (!confirm("Delete this module permanently?")) return;
    await fetch(`/api/admin/elements?id=${id}`, { method: "DELETE" });
    if (editingId === id) resetForm();
    onRefresh();
  };

  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    try {
      const res = await fetch("/api/admin/ai-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: aiPrompt,
          target: "ELEMENT",
          category: aiCategory,
          count: aiCount,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "AI generation failed");
      setAiStaging(data.items || []);
      onNotify(`AI generated ${data.items?.length || 0} module candidates — review & commit below.`);
    } catch (err: any) {
      onNotify(err.message);
    } finally {
      setAiLoading(false);
    }
  };

  const commitAiStaging = async () => {
    if (aiStaging.length === 0) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/elements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: aiStaging }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onNotify(`Committed ${data.count} AI-generated modules to SQLite!`);
      setAiStaging([]);
      setAiPrompt("");
      onRefresh();
    } catch (err: any) {
      onNotify(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleBulkImport = async () => {
    if (!bulkRaw.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/bulk-parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawText: bulkRaw, autoCommit: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onNotify(`Bulk imported ${data.count} rows via ${data.engine}.`);
      setBulkRaw("");
      setShowBulk(false);
      onRefresh();
    } catch (err: any) {
      onNotify(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const visible =
    filterCat === "ALL" ? elements : elements.filter((e) => e.category === filterCat);

  return (
    <div className="space-y-6">
      {/* AI Generator Card */}
      <div className="p-5 rounded-3xl bg-slate-900 border border-cyan-500/30 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            <div>
              <h2 className="text-sm font-bold text-white">AI Module & Catalog Generator (Local Ollama)</h2>
              <p className="text-[11px] text-slate-400">
                Describe new furniture, solar gear, kitchens, partitions or pods — AI generates specs, INR prices & 3D meshes
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span
              className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold border ${
                ollamaOnline
                  ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
                  : "bg-amber-500/15 border-amber-500/30 text-amber-300"
              }`}
            >
              {ollamaOnline ? "Ollama Online" : "Ollama Offline"}
            </span>
            <button
              type="button"
              onClick={() => setShowBulk(!showBulk)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-200 hover:bg-slate-700"
            >
              {showBulk ? "Hide CSV Bulk" : "CSV / Text Import"}
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5">
          <select
            value={aiCategory}
            onChange={(e) => setAiCategory(e.target.value)}
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
          >
            {["EQUIPMENT", "POD", "STAIRS", "CABIN", "DOOR", "WINDOW"].map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select
            value={aiCount}
            onChange={(e) => setAiCount(Number(e.target.value))}
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
          >
            {[1, 2, 3, 5].map((n) => (
              <option key={n} value={n}>
                {n} items
              </option>
            ))}
          </select>
          <input
            type="text"
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            placeholder="Describe modules to generate (e.g. Modular kitchen counter, bunk bed, inverter battery rack)..."
            className="flex-1 px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500"
          />
          <button
            type="button"
            onClick={handleAiGenerate}
            disabled={aiLoading || !aiPrompt.trim()}
            className="flex items-center justify-center space-x-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 font-bold text-xs disabled:opacity-50"
          >
            {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            <span>{aiLoading ? "Generating..." : "AI Generate More"}</span>
          </button>
        </div>

        {showBulk && (
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="text-[11px] font-semibold text-slate-300">
              CSV / Line Import (Format: CATEGORY, Name, INR Price, Brand)
            </div>
            <textarea
              rows={3}
              value={bulkRaw}
              onChange={(e) => setBulkRaw(e.target.value)}
              placeholder="EQUIPMENT, 2kW Lithium Inverter Wall Unit, 45000, Luminous"
              className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono text-white"
            />
            <button
              type="button"
              onClick={handleBulkImport}
              disabled={saving || !bulkRaw.trim()}
              className="px-4 py-1.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs disabled:opacity-50"
            >
              Parse & Commit to DB
            </button>
          </div>
        )}

        {aiStaging.length > 0 && (
          <div className="p-4 rounded-2xl bg-slate-950 border border-emerald-500/40 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-300">
                Staging Queue ({aiStaging.length} generated candidates)
              </span>
              <button
                type="button"
                onClick={commitAiStaging}
                disabled={saving}
                className="flex items-center space-x-1.5 px-4 py-1.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Commit All to Live Catalog</span>
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {aiStaging.map((item, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2 text-xs">
                  <AdminMini3DPreview mode="element" primitives={item.threeConfig?.primitives || []} />
                  <div className="font-bold text-white truncate">{item.friendlyName || item.name}</div>
                  <div className="text-[10px] font-mono text-cyan-400">{item.code} • {item.mountZone}</div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-emerald-400 font-bold">₹{Number(item.baseCost || 0).toLocaleString("en-IN")}</span>
                    <button
                      type="button"
                      onClick={() => setAiStaging((prev) => prev.filter((_, i) => i !== idx))}
                      className="text-[10px] text-red-400 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main Split: Elements List + Full Form Editor w/ 3D Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left List */}
        <div className="lg:col-span-7 p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Box className="w-4 h-4 text-emerald-400" />
              <span>Catalog Elements & Modules ({visible.length})</span>
            </h3>
            <div className="flex flex-wrap gap-1">
              {["ALL", "CABIN", "DOOR", "WINDOW", "EQUIPMENT", "POD", "STAIRS"].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setFilterCat(c)}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold transition ${
                    filterCat === c ? "bg-emerald-500 text-slate-950" : "bg-slate-800 text-slate-300"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2 max-h-[680px] overflow-y-auto pr-1">
            {visible.map((el) => (
              <div
                key={el.id}
                className={`p-3 rounded-2xl border flex items-center justify-between gap-3 text-xs transition ${
                  editingId === el.id
                    ? "border-cyan-400 bg-cyan-950/20"
                    : "border-slate-800 bg-slate-950/60 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center space-x-3 overflow-hidden">
                  {el.imageUrl || el.iconUrl ? (
                    <img
                      src={el.imageUrl || el.iconUrl}
                      alt={el.name}
                      className="w-10 h-10 rounded-xl object-cover border border-slate-700 shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 shrink-0 font-mono text-[10px]">
                      {el.category.slice(0, 3)}
                    </div>
                  )}
                  <div className="overflow-hidden">
                    <div className="font-bold text-white truncate">
                      {el.friendlyName || el.name}
                      {!el.isActive && <span className="ml-2 text-[10px] text-red-400">(Hidden)</span>}
                    </div>
                    <div className="text-[10px] font-mono text-slate-400 truncate">
                      {el.code} • {el.mountZone} • ₹{Number(el.baseCost).toLocaleString("en-IN")}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => toggleActive(el)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                    title={el.isActive ? "Hide from Studio" : "Show in Studio"}
                  >
                    {el.isActive ? <Eye className="w-3.5 h-3.5 text-emerald-400" /> : <EyeOff className="w-3.5 h-3.5 text-slate-500" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => loadIntoForm(el)}
                    className="px-2.5 py-1.5 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 font-semibold"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteElement(el.id)}
                    className="p-1.5 rounded-lg bg-red-500/15 text-red-300 hover:bg-red-500/25"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right CRUD Form */}
        <form
          onSubmit={handleSaveElement}
          className="lg:col-span-5 p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-3.5 text-xs"
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="text-sm font-bold text-white">
              {editingId ? `Edit Module (${code})` : "+ Create New Module"}
            </h3>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="text-[11px] text-cyan-400 hover:underline"
              >
                + New Instead
              </button>
            )}
          </div>

          <AdminMini3DPreview mode="element" primitives={primitives} imageUrl={imageUrl} />

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[10px] text-slate-400 mb-1">Unique Code *</label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="MINI_KITCHEN_POD"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl font-mono text-white"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-400 mb-1">Base Cost (₹) *</label>
              <input
                type="number"
                required
                value={baseCost}
                onChange={(e) => setBaseCost(Number(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl font-mono text-emerald-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[10px] text-slate-400 mb-1">Technical Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-400 mb-1">Customer Label</label>
              <input
                type="text"
                value={friendlyName}
                onChange={(e) => setFriendlyName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-[10px] text-slate-400 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-2.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
              >
                {["EQUIPMENT", "POD", "STAIRS", "CABIN", "DOOR", "WINDOW"].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-slate-400 mb-1">Sub-Category</label>
              <select
                value={subCategory}
                onChange={(e) => setSubCategory(e.target.value)}
                className="w-full px-2.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
              >
                {["INTERIOR", "HVAC", "SOLAR", "PLUMBING", "LIGHTING", "SECURITY", "ACCESS", "STRUCTURE", "GLAZING"].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-slate-400 mb-1">3D Mount Zone</label>
              <select
                value={mountZone}
                onChange={(e) => setMountZone(e.target.value)}
                className="w-full px-2.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
              >
                {["FLOOR_INTERIOR", "WALL_INTERIOR", "WALL_EXTERIOR", "ROOF_TOP", "PERIMETER_EDGE"].map((z) => (
                  <option key={z}>{z}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {(["width", "height", "depth", "length"] as const).map((k) => (
              <div key={k}>
                <label className="block text-[10px] text-slate-400 mb-1 capitalize">{k} (m)</label>
                <input
                  type="number"
                  step="0.05"
                  value={dims[k] ?? 1}
                  onChange={(e) => setDims({ ...dims, [k]: Number(e.target.value) || 0 })}
                  className="w-full px-2 py-1.5 bg-slate-950 border border-slate-800 rounded-lg font-mono text-white"
                />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-slate-950 border border-slate-800">
            <AdminAssetUploader label="Card Icon" bucket="icons" value={iconUrl} onChange={setIconUrl} />
            <AdminAssetUploader label="Photo / 3D Decal" bucket="photos" value={imageUrl} onChange={setImageUrl} />
          </div>

          {/* 3D Primitives JSON + Quick Add */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] text-slate-400 flex items-center space-x-1">
                <FileCode2 className="w-3 h-3 text-cyan-400" />
                <span>3D Geometry Primitives (Live WebGL)</span>
              </label>
              <div className="flex space-x-1">
                <button
                  type="button"
                  onClick={() =>
                    setPrimitives((p) => [
                      ...p,
                      { shape: "box", args: [0.8, 0.5, 0.5], position: [0, 0.25, 0], color: "#94a3b8", roughness: 0.4, metalness: 0.3 },
                    ])
                  }
                  className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-cyan-300"
                >
                  + Box
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setPrimitives((p) => [
                      ...p,
                      { shape: "cylinder", args: [0.3, 0.3, 0.8, 20], position: [0, 0.4, 0], color: "#475569", roughness: 0.3, metalness: 0.6 },
                    ])
                  }
                  className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-cyan-300"
                >
                  + Cyl
                </button>
              </div>
            </div>
            <textarea
              rows={3}
              value={JSON.stringify(primitives)}
              onChange={(e) => {
                try {
                  const arr = JSON.parse(e.target.value);
                  if (Array.isArray(arr)) setPrimitives(arr);
                } catch {}
              }}
              className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-[10px] font-mono text-cyan-200"
            />
          </div>

          <div>
            <label className="block text-[10px] text-slate-400 mb-1">Options JSON (Brands, Capacities, Finishes)</label>
            <textarea
              rows={3}
              value={optionsJson}
              onChange={(e) => setOptionsJson(e.target.value)}
              className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-[10px] font-mono text-slate-200"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full flex items-center justify-center space-x-2 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-bold"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? "Saving..." : editingId ? "Update Module" : "Create Module"}</span>
          </button>
        </form>
      </div>
    </div>
  );
};

/* =========================================================================
   2. ATTRIBUTES & SHADERS TAB
   ========================================================================= */
export const AdminAttributesPanel: React.FC<{
  attributes: any[];
  onRefresh: () => void;
  onNotify: (msg: string) => void;
}> = ({ attributes, onRefresh, onNotify }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [category, setCategory] = useState("WALL_FINISH");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [friendlyName, setFriendlyName] = useState("");
  const [brand, setBrand] = useState("");
  const [costModifier, setCostModifier] = useState(0);
  const [iconUrl, setIconUrl] = useState("");
  const [textureUrl, setTextureUrl] = useState("");
  const [shader, setShader] = useState({
    color: "#3b82f6",
    roughness: 0.35,
    metalness: 0.2,
    transmission: 0,
    ior: 1.5,
    clearcoat: 0.2,
    opacity: 1,
    transparent: false,
  });
  const [specsJson, setSpecsJson] = useState("{}");
  const [saving, setSaving] = useState(false);

  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  const loadAttr = (a: any) => {
    setEditingId(a.id);
    setCategory(a.category);
    setCode(a.code);
    setName(a.name);
    setFriendlyName(a.friendlyName || "");
    setBrand(a.brand || "");
    setCostModifier(a.costModifier || 0);
    setIconUrl(a.iconUrl || "");
    setTextureUrl(a.textureUrl || "");
    setShader({
      color: "#475569",
      roughness: 0.4,
      metalness: 0.2,
      transmission: 0,
      ior: 1.5,
      clearcoat: 0,
      opacity: 1,
      transparent: false,
      ...tryParse(a.shaderJson, {}),
    });
    setSpecsJson(a.specsJson || "{}");
  };

  const resetAttr = () => {
    setEditingId(null);
    setCode("");
    setName("");
    setFriendlyName("");
    setBrand("");
    setCostModifier(0);
    setIconUrl("");
    setTextureUrl("");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/admin/attributes", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingId || undefined,
          category,
          code,
          name,
          friendlyName: friendlyName || name,
          brand,
          costModifier,
          iconUrl: iconUrl || null,
          textureUrl: textureUrl || null,
          shaderJson: JSON.stringify({ ...shader, transparent: shader.transmission > 0.05 || shader.opacity < 1 }),
          specsJson,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onNotify(`Saved attribute ${code.toUpperCase()} — live PBR shader updated in Studio.`);
      resetAttr();
      onRefresh();
    } catch (err: any) {
      onNotify(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleAiGenAttrs = async () => {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    try {
      const res = await fetch("/api/admin/ai-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: aiPrompt, target: "ATTRIBUTE", category, count: 3 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const saveRes = await fetch("/api/admin/attributes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: data.items }),
      });
      if (!saveRes.ok) throw new Error("Failed saving AI attributes");
      onNotify(`AI generated & saved ${data.items.length} attributes to DB!`);
      setAiPrompt("");
      onRefresh();
    } catch (err: any) {
      onNotify(err.message);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-7 p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>Design Attributes, Paint, Glass & Frames ({attributes.length})</span>
          </h3>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            placeholder="AI generate attributes (e.g. 3 coastal terracotta & teak finishes)..."
            className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
          />
          <button
            type="button"
            onClick={handleAiGenAttrs}
            disabled={aiLoading || !aiPrompt.trim()}
            className="px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs flex items-center space-x-1.5 disabled:opacity-50"
          >
            {aiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            <span>AI Gen</span>
          </button>
        </div>

        <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
          {attributes.map((a) => {
            const s = tryParse<any>(a.shaderJson, { color: "#475569" });
            return (
              <div
                key={a.id}
                className="p-3 rounded-2xl border border-slate-800 bg-slate-950/60 flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center space-x-3 overflow-hidden">
                  {a.iconUrl ? (
                    <img src={a.iconUrl} alt={a.name} className="w-8 h-8 rounded-full object-cover shrink-0" />
                  ) : (
                    <span
                      className="w-8 h-8 rounded-full border border-white/25 shrink-0"
                      style={{ backgroundColor: s.color || "#475569" }}
                    />
                  )}
                  <div className="overflow-hidden">
                    <div className="font-bold text-white truncate">{a.friendlyName || a.name}</div>
                    <div className="text-[10px] font-mono text-slate-400 truncate">
                      {a.category} • {a.code} • +₹{a.costModifier}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => loadAttr(a)}
                    className="px-2.5 py-1 rounded-lg bg-cyan-500/15 text-cyan-300 font-semibold"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      await fetch(`/api/admin/attributes?id=${a.id}`, { method: "DELETE" });
                      onRefresh();
                    }}
                    className="p-1.5 rounded-lg bg-red-500/15 text-red-300"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <form onSubmit={handleSave} className="lg:col-span-5 p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-3 text-xs">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <h3 className="text-sm font-bold text-white">{editingId ? `Edit ${code}` : "+ Create Attribute / Shader"}</h3>
          {editingId && (
            <button type="button" onClick={resetAttr} className="text-cyan-400 text-[11px] hover:underline">
              + New
            </button>
          )}
        </div>

        <AdminMini3DPreview mode="attribute" shader={shader} textureUrl={textureUrl} />

        <div className="grid grid-cols-2 gap-2">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
          >
            {["WALL_FINISH", "GLASS_TYPE", "FRAME_MATERIAL", "BRAND", "INSULATION"].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <input
            type="text"
            required
            placeholder="CODE_UPPERCASE"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl font-mono text-white"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <input
            type="text"
            required
            placeholder="Technical Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
          />
          <input
            type="text"
            placeholder="Friendly Label"
            value={friendlyName}
            onChange={(e) => setFriendlyName(e.target.value)}
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <input
            type="text"
            placeholder="Brand (e.g. Asian Paints)"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
          />
          <input
            type="number"
            placeholder="Cost +/- INR"
            value={costModifier}
            onChange={(e) => setCostModifier(Number(e.target.value) || 0)}
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl font-mono text-emerald-400"
          />
        </div>

        {/* Live PBR Shader Controls */}
        <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-300">Three.js PBR Color & Shader</span>
            <input
              type="color"
              value={shader.color}
              onChange={(e) => setShader({ ...shader, color: e.target.value })}
              className="w-8 h-6 rounded bg-transparent cursor-pointer"
            />
          </div>
          {(
            [
              ["roughness", 0, 1],
              ["metalness", 0, 1],
              ["transmission", 0, 1],
              ["opacity", 0.1, 1],
            ] as const
          ).map(([key, min, max]) => (
            <div key={key} className="flex items-center space-x-2 text-[10px]">
              <span className="w-20 text-slate-400 capitalize">{key}</span>
              <input
                type="range"
                min={min}
                max={max}
                step="0.02"
                value={(shader as any)[key] ?? 0}
                onChange={(e) => setShader({ ...shader, [key]: Number(e.target.value) })}
                className="flex-1 accent-cyan-400"
              />
              <span className="w-8 text-right font-mono text-slate-300">{((shader as any)[key] ?? 0).toFixed(2)}</span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-slate-950 border border-slate-800">
          <AdminAssetUploader label="Swatch Icon" bucket="icons" value={iconUrl} onChange={setIconUrl} />
          <AdminAssetUploader label="3D Surface Texture" bucket="textures" value={textureUrl} onChange={setTextureUrl} />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 font-bold"
        >
          {saving ? "Saving..." : editingId ? "Update Attribute" : "Save Attribute"}
        </button>
      </form>
    </div>
  );
};

/* =========================================================================
   3. PRESETS, MISSIONS & GLOBAL RATES TAB
   ========================================================================= */
export const AdminPresetsAndRatesPanel: React.FC<{
  presets: any[];
  challenges: any[];
  logisticsDefaults: any;
  onRefresh: () => void;
  onNotify: (msg: string) => void;
}> = ({ presets, challenges, logisticsDefaults, onRefresh, onNotify }) => {
  const [presetTitle, setPresetTitle] = useState("");
  const [presetCode, setPresetCode] = useState("");
  const [presetSubtitle, setPresetSubtitle] = useState("");
  const [presetSize, setPresetSize] = useState("160 sq.ft (20x8 ft)");
  const [presetPriceLabel, setPresetPriceLabel] = useState("~₹3.5L");
  const [presetBadge, setPresetBadge] = useState("Popular");
  const [presetThumbUrl, setPresetThumbUrl] = useState("");
  const [presetEnv, setPresetEnv] = useState("forest");
  const [presetBudget, setPresetBudget] = useState(380000);
  const [presetSceneJson, setPresetSceneJson] = useState('{"cabins":[],"equipment":[]}');

  const [chTitle, setChTitle] = useState("");
  const [chCode, setChCode] = useState("");
  const [chDesc, setChDesc] = useState("");
  const [chBadgeName, setChBadgeName] = useState("");
  const [chBadgeIcon, setChBadgeIcon] = useState("🏆");
  const [chBadgeIconUrl, setChBadgeIconUrl] = useState("");
  const [chXp, setChXp] = useState(300);
  const [chRules, setChRules] = useState<ChallengeRule[]>([
    { label: "Mount Inverter AC", type: "HAS_ELEMENT", value: "AC_SPLIT_INVERTER" },
  ]);

  const [defaults, setDefaults] = useState<any>(logisticsDefaults || {});
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    if (logisticsDefaults) setDefaults(logisticsDefaults);
  }, [logisticsDefaults]);

  const savePreset = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/admin/presets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: presetCode || presetTitle,
          title: presetTitle,
          subtitle: presetSubtitle,
          sizeLabel: presetSize,
          approxPriceLabel: presetPriceLabel,
          badge: presetBadge,
          thumbUrl: presetThumbUrl || null,
          environment: presetEnv,
          targetBudget: presetBudget,
          sceneJson: presetSceneJson,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      onNotify("Room Preset saved & live in 3D Studio!");
      setPresetTitle("");
      setPresetCode("");
      onRefresh();
    } catch (err: any) {
      onNotify(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const saveChallenge = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/admin/challenges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: chCode || chTitle,
          title: chTitle,
          description: chDesc,
          badgeName: chBadgeName || chTitle,
          badgeIcon: chBadgeIcon,
          badgeIconUrl: chBadgeIconUrl || null,
          rewardXp: chXp,
          rulesJson: JSON.stringify(chRules),
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      onNotify("Design Challenge saved & live in Studio!");
      setChTitle("");
      setChCode("");
      onRefresh();
    } catch (err: any) {
      onNotify(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const saveDefaults = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/logistics-defaults", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(defaults),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      onNotify("Platform GST, Logistics & Ad Bid defaults saved!");
      onRefresh();
    } catch (err: any) {
      onNotify(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 text-xs">
      {/* Global Platform Rates */}
      <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <Truck className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white">Global GST, Logistics & Ad Bid Guardrails</h3>
          </div>
          <button
            type="button"
            onClick={saveDefaults}
            disabled={saving}
            className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold"
          >
            Save Global Defaults
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {[
            ["gstRatePct", "GST %"],
            ["transportPerKm20ft", "20ft ₹/km"],
            ["transportPerKm40ft", "40ft ₹/km"],
            ["craneGroundFee", "Ground Crane ₹"],
            ["craneTerraceFee", "Terrace Crane ₹"],
            ["knockDownPerKm", "Flat-Pack ₹/km"],
            ["knockDownAssemblyFee", "Bolt Assembly ₹"],
            ["puf50mmCost", "50mm PUF ₹"],
            ["flyRoofCanopyPrice", "Cool Canopy ₹"],
            ["defaultRefurbDiscount", "Refurb % Off"],
            ["defaultUsedWwtDiscount", "Used WWT % Off"],
            ["minBidAmount", "Min Ad Bid ₹"],
          ].map(([key, label]) => (
            <div key={key}>
              <label className="block text-[10px] text-slate-400 mb-1">{label}</label>
              <input
                type="number"
                value={defaults[key] ?? 0}
                onChange={(e) => setDefaults({ ...defaults, [key]: Number(e.target.value) || 0 })}
                className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-xl font-mono text-white"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Presets & Challenges Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Room Presets */}
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white">Room Presets ({presets.length})</h3>
          <div className="space-y-2 max-h-56 overflow-y-auto">
            {presets.map((p) => (
              <div key={p.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-2">
                <div className="flex items-center space-x-2.5 overflow-hidden">
                  {p.thumbUrl && <img src={p.thumbUrl} alt={p.title} className="w-9 h-9 rounded-lg object-cover shrink-0" />}
                  <div className="overflow-hidden">
                    <div className="font-bold text-white truncate">{p.title} ({p.approxPriceLabel})</div>
                    <div className="text-[10px] text-slate-400 truncate">{p.code} • {p.environment}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <button
                    type="button"
                    onClick={() => {
                      setPresetCode(p.code);
                      setPresetTitle(p.title);
                      setPresetSubtitle(p.subtitle);
                      setPresetSize(p.sizeLabel);
                      setPresetPriceLabel(p.approxPriceLabel);
                      setPresetBadge(p.badge || "");
                      setPresetThumbUrl(p.thumbUrl || "");
                      setPresetEnv(p.environment);
                      setPresetBudget(p.targetBudget);
                      setPresetSceneJson(p.sceneJson);
                    }}
                    className="px-2 py-1 rounded bg-cyan-500/15 text-cyan-300"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      await fetch(`/api/admin/presets?id=${p.id}`, { method: "DELETE" });
                      onRefresh();
                    }}
                    className="p-1.5 rounded bg-red-500/15 text-red-300"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={savePreset} className="space-y-2.5 pt-2 border-t border-slate-800">
            <div className="font-bold text-white">Upsert Room Preset</div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                required
                placeholder="Title (e.g. Terrace Room)"
                value={presetTitle}
                onChange={(e) => setPresetTitle(e.target.value)}
                className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
              />
              <input
                type="text"
                placeholder="Slug Code (e.g. terrace-room)"
                value={presetCode}
                onChange={(e) => setPresetCode(e.target.value)}
                className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl font-mono text-white"
              />
            </div>
            <input
              type="text"
              placeholder="Short Subtitle"
              value={presetSubtitle}
              onChange={(e) => setPresetSubtitle(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
            />
            <div className="grid grid-cols-3 gap-2">
              <input
                type="text"
                placeholder="Size Label"
                value={presetSize}
                onChange={(e) => setPresetSize(e.target.value)}
                className="px-2.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
              />
              <input
                type="text"
                placeholder="~₹3.5L"
                value={presetPriceLabel}
                onChange={(e) => setPresetPriceLabel(e.target.value)}
                className="px-2.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
              />
              <select
                value={presetEnv}
                onChange={(e) => setPresetEnv(e.target.value)}
                className="px-2.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
              >
                {["forest", "urban", "beach", "desert"].map((e) => (
                  <option key={e}>{e}</option>
                ))}
              </select>
            </div>
            <AdminAssetUploader label="Preset Thumbnail Photo" bucket="presets" value={presetThumbUrl} onChange={setPresetThumbUrl} />
            <textarea
              rows={2}
              value={presetSceneJson}
              onChange={(e) => setPresetSceneJson(e.target.value)}
              placeholder='{"cabins": [...], "equipment": [...]}'
              className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl font-mono text-[10px] text-white"
            />
            <button type="submit" disabled={saving} className="w-full py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold">
              Save Room Preset
            </button>
          </form>
        </div>

        {/* Design Challenges */}
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>Dynamic Missions / Challenges ({challenges.length})</span>
          </h3>
          <div className="space-y-2 max-h-56 overflow-y-auto">
            {challenges.map((ch) => (
              <div key={ch.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-2">
                <div className="flex items-center space-x-2.5 overflow-hidden">
                  {ch.badgeIconUrl ? (
                    <img src={ch.badgeIconUrl} alt={ch.badgeName} className="w-8 h-8 rounded object-cover" />
                  ) : (
                    <span className="text-lg">{ch.badgeIcon}</span>
                  )}
                  <div className="overflow-hidden">
                    <div className="font-bold text-white truncate">{ch.title} (+{ch.rewardXp} XP)</div>
                    <div className="text-[10px] text-slate-400 truncate">{ch.code}</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    await fetch(`/api/admin/challenges?id=${ch.id}`, { method: "DELETE" });
                    onRefresh();
                  }}
                  className="p-1.5 rounded bg-red-500/15 text-red-300"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          <form onSubmit={saveChallenge} className="space-y-2.5 pt-2 border-t border-slate-800">
            <div className="font-bold text-white">+ Create Mission</div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                required
                placeholder="Mission Title"
                value={chTitle}
                onChange={(e) => setChTitle(e.target.value)}
                className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
              />
              <input
                type="text"
                placeholder="CODE_UPPERCASE"
                value={chCode}
                onChange={(e) => setChCode(e.target.value.toUpperCase())}
                className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl font-mono text-white"
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <input
                type="text"
                placeholder="Badge Name"
                value={chBadgeName}
                onChange={(e) => setChBadgeName(e.target.value)}
                className="px-2.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
              />
              <input
                type="text"
                placeholder="Emoji 🏆"
                value={chBadgeIcon}
                onChange={(e) => setChBadgeIcon(e.target.value)}
                className="px-2.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
              />
              <input
                type="number"
                placeholder="XP Reward"
                value={chXp}
                onChange={(e) => setChXp(Number(e.target.value) || 0)}
                className="px-2.5 py-2 bg-slate-950 border border-slate-800 rounded-xl font-mono text-white"
              />
            </div>
            <AdminAssetUploader label="Badge Icon Image (Optional)" bucket="badges" value={chBadgeIconUrl} onChange={setChBadgeIconUrl} />

            {/* Declarative Rule Builder */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400">Evaluation Rules</span>
                <button
                  type="button"
                  onClick={() =>
                    setChRules((r) => [
                      ...r,
                      { label: "Target Check", type: "HAS_ELEMENT", value: "SOLAR_ARRAY_ROOF" },
                    ])
                  }
                  className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-cyan-300"
                >
                  + Rule
                </button>
              </div>
              {chRules.map((rule, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-1.5">
                  <select
                    value={rule.type}
                    onChange={(e) =>
                      setChRules((prev) =>
                        prev.map((r, i) => (i === idx ? { ...r, type: e.target.value as any } : r))
                      )
                    }
                    className="col-span-4 px-2 py-1 bg-slate-950 border border-slate-800 rounded-lg text-[10px] text-white"
                  >
                    {[
                      "HAS_ELEMENT",
                      "ENVIRONMENT_EQ",
                      "MIN_STORIES",
                      "MIN_CABINS",
                      "HAS_WINDOW_TYPE",
                      "HAS_GLASS_CODE",
                      "MAX_TOTAL_COST",
                      "MIN_ECO_SCORE",
                    ].map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={String(rule.value)}
                    onChange={(e) =>
                      setChRules((prev) =>
                        prev.map((r, i) => (i === idx ? { ...r, value: e.target.value } : r))
                      )
                    }
                    placeholder="Value"
                    className="col-span-3 px-2 py-1 bg-slate-950 border border-slate-800 rounded-lg text-[10px] font-mono text-white"
                  />
                  <input
                    type="text"
                    value={rule.label}
                    onChange={(e) =>
                      setChRules((prev) =>
                        prev.map((r, i) => (i === idx ? { ...r, label: e.target.value } : r))
                      )
                    }
                    placeholder="Display text"
                    className="col-span-4 px-2 py-1 bg-slate-950 border border-slate-800 rounded-lg text-[10px] text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setChRules((prev) => prev.filter((_, i) => i !== idx))}
                    className="col-span-1 text-red-400 text-center"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            <button type="submit" disabled={saving} className="w-full py-2 rounded-xl bg-amber-500 text-slate-950 font-bold">
              Save Mission
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
