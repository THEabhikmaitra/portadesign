"use client";

import React, { useState } from "react";
import { signIn } from "next-auth/react";
import { useStudioStore } from "@/store/useStudioStore";
import { X, Save, Globe, Lock, Copy, Check, ExternalLink, Loader2, MessageCircle } from "lucide-react";

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

  const [title, setTitle] = useState("My Custom Room");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSlug, setSavedSlug] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsAuth, setNeedsAuth] = useState(false);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");

  if (!isOpen) return null;

  const bom = getBom();

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
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

      const bodyPayload = {
        title,
        description: description || `Custom 3D room design (Estimated ₹${bom.totalCost.toLocaleString("en-IN")})`,
        isPublic,
        commitNote: "Saved from 3D Room Builder",
        sceneJson: JSON.stringify(sceneData),
        bomJson: JSON.stringify(bom),
        snapshotBase64: snapshotDataUrl,
      };

      let res = await fetch("/api/designs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyPayload),
      });

      if (res.status === 401) {
        if (!authEmail.trim() || authPassword.length < 6) {
          setNeedsAuth(true);
          throw new Error("Sign in or enter email + 6-char password below to save & get your link.");
        }
        await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: authEmail.trim(),
            password: authPassword,
            name: authEmail.split("@")[0],
            accountType: "BUYER",
          }),
        });
        const signRes = await signIn("credentials", {
          email: authEmail.trim(),
          password: authPassword,
          redirect: false,
        });
        if (signRes?.error) {
          setNeedsAuth(true);
          throw new Error(signRes.error);
        }
        res = await fetch("/api/designs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(bodyPayload),
        });
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Could not save your room");
      }

      setNeedsAuth(false);
      setSavedSlug(data.design.slug);
    } catch (err: any) {
      setError(err.message || "Could not save your room");
    } finally {
      setIsSaving(false);
    }
  };

  const shareableUrl =
    typeof window !== "undefined" && savedSlug ? `${window.location.origin}/design/${savedSlug}` : "";

  const handleCopy = () => {
    if (shareableUrl) {
      navigator.clipboard.writeText(shareableUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const whatsappHref = shareableUrl
    ? `https://wa.me/?text=${encodeURIComponent(
        `Look at this room I designed in 3D (${title}, approx ₹${bom.totalCost.toLocaleString("en-IN")}): ${shareableUrl}`
      )}`
    : "#";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/25 text-emerald-400">
              <Save className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Save & Share Your Room</h2>
              <div className="text-[11px] text-slate-400">Send link to family or makers on WhatsApp</div>
            </div>
          </div>
          <button
            onClick={() => {
              setSavedSlug(null);
              onClose();
            }}
            aria-label="Close save dialog"
            className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {savedSlug ? (
          <div className="p-6 space-y-4 text-center animate-in fade-in">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
              <Check className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Your Room is Saved!</h3>
              <p className="text-xs text-slate-400 mt-1">
                Share this link so anyone can view the 3D design and item prices.
              </p>
            </div>

            {/* 1-Click WhatsApp Share */}
            <a
              href={whatsappHref}
              target="_blank"
              rel="noreferrer"
              className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-[#25D366] hover:bg-[#22c35e] text-slate-950 font-bold text-xs transition shadow-lg"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Share on WhatsApp</span>
            </a>

            <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-xs font-mono">
              <span className="truncate text-slate-300 pr-2">{shareableUrl}</span>
              <button
                onClick={handleCopy}
                className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold font-sans transition shrink-0"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Copied" : "Copy"}</span>
              </button>
            </div>

            <div className="flex justify-center space-x-3 pt-1">
              <a
                href={`/design/${savedSlug}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition"
              >
                <span>View Summary</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <button
                onClick={() => {
                  setSavedSlug(null);
                  onClose();
                }}
                className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSave} className="p-6 space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-red-950/40 border border-red-800 text-xs text-red-300">
                {error}
              </div>
            )}

            {needsAuth && (
              <div className="p-3 rounded-xl bg-slate-800/80 border border-emerald-500/40 space-y-2">
                <div className="text-[11px] font-bold text-emerald-300">
                  Quick Account (Sign In or Auto-Create)
                </div>
                <input
                  type="email"
                  required
                  placeholder="Your Email"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                />
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="Password (min 6 chars)"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Name Your Room</label>
              <input
                type="text"
                required
                placeholder="e.g. Terrace Guest Room"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Notes (Optional)</label>
              <textarea
                rows={2}
                placeholder="e.g. For 2nd floor roof, need delivery before summer..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 border border-slate-700/60">
              <div className="flex items-center space-x-2.5">
                {isPublic ? (
                  <Globe className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Lock className="w-4 h-4 text-slate-400" />
                )}
                <div>
                  <div className="text-xs font-semibold text-white">
                    {isPublic ? "Shareable Link Enabled" : "Private Draft Only"}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {isPublic ? "Family & makers can open this link" : "Saved only for you"}
                  </div>
                </div>
              </div>
              <button
                type="button"
                aria-label="Toggle shareable link"
                onClick={() => setIsPublic(!isPublic)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                  isPublic ? "bg-emerald-500" : "bg-slate-700"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg transition ${
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
                <span>{isSaving ? "Saving..." : "Save & Get Link"}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
