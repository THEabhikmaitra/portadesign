"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Cpu,
  FileText,
  UploadCloud,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Database,
  Sparkles,
  Loader2,
  FileSpreadsheet,
} from "lucide-react";

export default function AdminPortalPage() {
  const [catalogText, setCatalogText] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [engineUsed, setEngineUsed] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [autoCommit, setAutoCommit] = useState(true);

  const sampleGlazing = `Saint-Gobain Solar Shield Cool-Lite SKN 154, GLASS_TYPE, ₹4200, Saint-Gobain, Neutral dark solar control coating transmission 0.50
AIS SunShield Emerald Green Reflective Glass, GLASS_TYPE, ₹3900, AIS Glass, 6mm heat reflective glass ior 1.54
Fenesta SoundShield Triple Chamber uPVC Frame, FRAME_MATERIAL, ₹2200, Fenesta, Sound reduction 45dB matte off-white
Daikin Inverter 2.0 Ton High Wall AC Unit, EQUIPMENT, ₹48000, Daikin, 5-Star high efficiency cooling
Tata Power Solar 4.5kW Monocrystalline Bifacial Array, EQUIPMENT, ₹180000, Tata Solar, 8x bifacial modules with aluminum rack`;

  const handleParse = async (commitAfterParse = false) => {
    if (!catalogText.trim()) return;

    setIsParsing(true);
    setStatusMessage(null);

    try {
      const res = await fetch("/api/admin/bulk-parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rawText: catalogText,
          autoCommit: commitAfterParse || autoCommit,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Parsing failed");
      }

      setParsedData(data.items || []);
      setEngineUsed(data.engine);
      setStatusMessage(
        `Successfully extracted ${data.count} items via ${
          data.engine.startsWith("ollama") ? "Local Ollama AI (qwen2.5)" : "Deterministic Offline Parser"
        }${commitAfterParse || autoCommit ? " and committed to SQLite Database!" : ""}`
      );
    } catch (err: any) {
      setStatusMessage(`Error: ${err.message}`);
    } finally {
      setIsParsing(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCatalogText(event.target?.result as string);
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-16">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link
              href="/"
              className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white transition"
              title="Back to 3D Studio"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="flex items-center space-x-2">
              <Cpu className="w-5 h-5 text-cyan-400" />
              <h1 className="text-base font-bold text-white">Offline AI Bulk Catalog Admin</h1>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs text-cyan-300 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Ollama: qwen2.5 / llama3.2 (Local)</span>
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 space-y-8">
        {statusMessage && (
          <div className="p-4 rounded-2xl bg-slate-900 border border-cyan-500/50 text-xs text-cyan-300 font-medium">
            {statusMessage}
          </div>
        )}

        {/* Input Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <FileText className="w-5 h-5 text-cyan-400" />
                <span>Unstructured Vendor Rate Cards & Catalog Import</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Paste supplier brochures, rate lists, or upload CSV to extract Three.js PBR shader attributes
              </p>
            </div>

            {/* Quick Sample Fill Buttons */}
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setCatalogText(sampleGlazing)}
                className="text-xs px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              >
                Load Sample Catalog
              </button>
              <label className="flex items-center space-x-1.5 text-xs px-3 py-1.5 rounded-xl bg-cyan-950/60 hover:bg-cyan-900/80 border border-cyan-800 text-cyan-300 cursor-pointer transition">
                <UploadCloud className="w-3.5 h-3.5" />
                <span>Upload CSV</span>
                <input
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <textarea
            rows={7}
            placeholder="Paste raw vendor pricing, supplier specifications, glass transmission data, or CSV rows here..."
            value={catalogText}
            onChange={(e) => setCatalogText(e.target.value)}
            className="w-full p-4 bg-slate-950 border border-slate-800 rounded-2xl text-xs text-slate-200 placeholder-slate-600 font-mono focus:outline-none focus:border-cyan-500"
          />

          <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
            <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={autoCommit}
                onChange={(e) => setAutoCommit(e.target.checked)}
                className="rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-0"
              />
              <span>Auto-commit extracted items into SQLite Database</span>
            </label>

            <button
              type="button"
              onClick={() => handleParse(false)}
              disabled={isParsing || !catalogText.trim()}
              className="flex items-center space-x-2 py-2.5 px-6 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 font-bold text-xs transition shadow-lg disabled:opacity-50"
            >
              {isParsing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              <span>{isParsing ? "AI Parsing..." : "Parse with Local Ollama AI"}</span>
            </button>
          </div>
        </div>

        {/* Parsed Attributes & Shaders Result Table */}
        {parsedData.length > 0 && (
          <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4 animate-in fade-in duration-300">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Database className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">Extracted Master Attributes & 3D Shaders</h3>
              </div>
              <span className="text-xs font-mono text-cyan-400">
                Engine: {engineUsed} • {parsedData.length} records
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase text-[11px]">
                    <th className="py-2.5 px-2">Category</th>
                    <th className="py-2.5 px-2">Identifier Code</th>
                    <th className="py-2.5 px-2">Component Name</th>
                    <th className="py-2.5 px-2">Brand</th>
                    <th className="py-2.5 px-2 text-right">Price Delta</th>
                    <th className="py-2.5 px-2">Three.js PBR Shader Spec</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-200">
                  {parsedData.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/30">
                      <td className="py-3 px-2">
                        <span className="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-[10px] font-mono text-cyan-300">
                          {item.category}
                        </span>
                      </td>
                      <td className="py-3 px-2 font-mono text-emerald-400 font-semibold">{item.code}</td>
                      <td className="py-3 px-2 font-medium text-white">{item.name}</td>
                      <td className="py-3 px-2 text-slate-300">{item.brand || "—"}</td>
                      <td className="py-3 px-2 text-right font-mono text-slate-300">
                        {item.costModifier ? `+₹${item.costModifier.toLocaleString("en-IN")}` : "Base"}
                      </td>
                      <td className="py-3 px-2 font-mono text-[11px] text-slate-400">
                        {item.shaderJson ? (
                          <div className="flex items-center space-x-1.5">
                            <span
                              className="w-3.5 h-3.5 rounded-full border border-white/20 shrink-0"
                              style={{ backgroundColor: item.shaderJson.color || "#ffffff" }}
                            />
                            <span>
                              r:{item.shaderJson.roughness?.toFixed(2)} m:{item.shaderJson.metalness?.toFixed(2)}{" "}
                              {item.shaderJson.transmission ? `t:${item.shaderJson.transmission}` : ""}
                            </span>
                          </div>
                        ) : (
                          "Default PBR"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
