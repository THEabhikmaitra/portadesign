"use client";

import React, { useState } from "react";
import { useStudioStore } from "@/store/useStudioStore";
import { X, Save, Globe, Lock, Copy, Check, ExternalLink, Loader2 } from "lucide-react";

interface SaveDesignModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SaveDesignModal: React.FC<SaveDesignModalProps> = ({ isOpen, onClose }) => {
  const cabins = useStudioStore((state) => state.cabins);
  const equipment = useStudioStore((state) => state.equipment);
  const environment = useStudioStore((state) => state.environment);
  const dayNight = useStudioStore((state) => state.dayNight);
  const getBom = useStudioStore((state) => state.getBom);

  const [title, setTitle] = useState("My Custom Modular Portacabin");
  const [description, setDescription] = useState(
    "Custom engineered 3D container layout with high-performance solar array, climate control, and architectural glazing."
  );
  const [isPublic, setIsPublic] = useState(true);
  const [commitNote, setCommitNote] = useState("V1 - Initial 3D Cabin Spec");
  const [isSaving, setIsSaving] = useState(false);
  const [savedSlug, setSavedSlug] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      // Capture WebGL canvas snapshot
      let snapshotDataUrl: string | null = null;
      const canvasEl = document.querySelector("canvas");
      if (canvasEl) {
        snapshotDataUrl = canvasEl.toDataURL("image/png");
      }

      const sceneData = {
        environment,
        dayNight,
        cabins,
        equipment,
      };

      const bomData = getBom();

      const res = await fetch("/api/designs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          isPublic,
          commitNote,
          sceneJson: JSON.stringify(sceneData),
          bomJson: JSON.stringify(bomData),
          snapshotBase64: snapshotDataUrl,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save design");
      }

      setSavedSlug(data.design.slug);
    } catch (err: any) {
      setError(err.message || "Failed to save design");
    } finally {
      setIsSaving(false);
    }
  };

  const shareableUrl = typeof window !== "undefined" && savedSlug ? `${window.location.origin}/design/${savedSlug}` : "";

  const handleCopy = () => {
    if (shareableUrl) {
      navigator.clipboard.writeText(shareableUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Save className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Save & Version Control</h2>
              <div className="text-xs text-slate-400">Persist to local SQLite with shareable link</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {savedSlug ? (
          // Success Screen with Shareable Link
          <div className="p-6 space-y-4 text-center animate-in fade-in">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
              <Check className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Design Saved Successfully!</h3>
              <p className="text-xs text-slate-400 mt-1">
                Your 3D layout, BOM pricing, and specifications are saved as Version 1.
              </p>
            </div>

            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-xs font-mono">
              <span className="truncate text-slate-300 pr-2">{shareableUrl}</span>
              <button
                onClick={handleCopy}
                className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold font-sans transition shrink-0"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Copied!" : "Copy Link"}</span>
              </button>
            </div>

            <div className="flex justify-center space-x-3 pt-2">
              <a
                href={`/design/${savedSlug}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition"
              >
                <span>Open Public Page</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <button
                onClick={onClose}
                className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          // Input Form
          <form onSubmit={handleSave} className="p-6 space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-red-950/40 border border-red-800 text-xs text-red-300">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Design Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Description</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Version Commit Note</label>
              <input
                type="text"
                value={commitNote}
                onChange={(e) => setCommitNote(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Visibility Toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 border border-slate-700/60">
              <div className="flex items-center space-x-2.5">
                {isPublic ? (
                  <Globe className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Lock className="w-4 h-4 text-slate-400" />
                )}
                <div>
                  <div className="text-xs font-semibold text-white">
                    {isPublic ? "Public Portfolio (SSR & Search Indexed)" : "Private Draft"}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {isPublic ? "Anyone with link can view, quote & remix" : "Only accessible in your account"}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPublic(!isPublic)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  isPublic ? "bg-emerald-500" : "bg-slate-700"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    isPublic ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center space-x-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-bold text-xs transition shadow-lg disabled:opacity-50"
              >
                {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{isSaving ? "Saving Version..." : "Save Design"}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
