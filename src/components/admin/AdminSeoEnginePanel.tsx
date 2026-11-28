"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Play,
  UploadCloud,
  ExternalLink,
  Trash2,
  RefreshCw,
  FileText,
  ShieldCheck,
  Bot,
  Send,
  Image as ImageIcon,
} from "lucide-react";
import { AdminAssetUploader } from "./AdminAssetUploader";
import { LlmProviderType, SeoClusterRole, SeoGeoTarget, SeoGuideImage, SeoIntentType } from "@/lib/seoEngine/types";

export const AdminSeoEnginePanel: React.FC<{
  onNotify: (msg: string) => void;
}> = ({ onNotify }) => {
  const [queue, setQueue] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [providers, setProviders] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [pushing, setPushing] = useState(false);
  const [humanizing, setHumanizing] = useState(false);
  const [auditingQuality, setAuditingQuality] = useState(false);
  const [liveQualityAudit, setLiveQualityAudit] = useState<{ postId: string; report: any } | null>(null);
  const [showAllAuditChecks, setShowAllAuditChecks] = useState(false);

  // LLM + Generation Config (Local PC controls)
  const [provider, setProvider] = useState<LlmProviderType>("auto");
  const [modelName, setModelName] = useState("");
  const [runtimeApiKey, setRuntimeApiKey] = useState("");
  const [minWords, setMinWords] = useState(8500);

  // Add Keyword Form
  const [newKeyword, setNewKeyword] = useState("");
  const [newGeo, setNewGeo] = useState<SeoGeoTarget>("GLOBAL");
  const [newIntent, setNewIntent] = useState<SeoIntentType>("COST");
  const [newClusterRole, setNewClusterRole] = useState<SeoClusterRole>("PILLAR");
  const [newParentPillar, setNewParentPillar] = useState("");
  const [newPublishTier, setNewPublishTier] = useState(1);
  const [newPreset, setNewPreset] = useState("terrace-room");

  // Active HITL Post Editor State
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editMetaTitle, setEditMetaTitle] = useState("");
  const [editMetaDesc, setEditMetaDesc] = useState("");
  const [editTldr, setEditTldr] = useState("");
  const [editYmyl, setEditYmyl] = useState("");
  const [editSponsorship, setEditSponsorship] = useState("");
  const [editClusterRole, setEditClusterRole] = useState<SeoClusterRole>("PILLAR");
  const [editParentPillar, setEditParentPillar] = useState("");
  const [editAuthor, setEditAuthor] = useState("");
  const [editReviewer, setEditReviewer] = useState("");
  const [editReviewerCreds, setEditReviewerCreds] = useState("Licensed Modular Structural Consultant");
  const [editSections, setEditSections] = useState<any[]>([]);
  const [editImages, setEditImages] = useState<SeoGuideImage[]>([]);
  const [pendingImageUrl, setPendingImageUrl] = useState("");
  const [pendingImageCaption, setPendingImageCaption] = useState("");
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [gitPushEnabled, setGitPushEnabled] = useState(false);
  const [pingIndexersOnPush, setPingIndexersOnPush] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/seo", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load SEO Engine");
      setQueue(data.queue || []);
      setPosts(data.posts || []);
      setProviders(data.providers || null);
      if (data.posts?.length > 0 && !selectedPostId) {
        selectPostForHitl(data.posts[0]);
      }
    } catch (err: any) {
      onNotify(`SEO Engine Load Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [onNotify, selectedPostId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const selectPostForHitl = (post: any) => {
    setSelectedPostId(post.id);
    setEditTitle(post.title || "");
    setEditMetaTitle(post.metaTitle || "");
    setEditMetaDesc(post.metaDesc || "");
    setEditTldr(post.tldrAnswer || "");
    setEditYmyl(post.ymylDisclaimer || "");
    setEditSponsorship(post.sponsorshipDisclosure || "");
    setEditClusterRole(post.clusterRole || "PILLAR");
    setEditParentPillar(post.parentPillarSlug || "");
    setEditAuthor(post.authorName || "Arjun Mehta");
    setEditReviewer(post.reviewerName || "");
    setEditReviewerCreds(post.reviewerCreds || "Licensed Structural & Modular Engineer");
    setEditSections(Array.isArray(post.sections) ? post.sections : []);
    setEditImages(Array.isArray(post.guideImages) ? post.guideImages : []);
    setActiveSectionId(post.sections?.[0]?.id || null);
  };

  const llmConfigPayload = {
    provider,
    model: modelName.trim() || undefined,
    apiKey: runtimeApiKey.trim() || undefined,
  };

  const handleAddTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyword.trim()) return;
    const res = await fetch("/api/admin/seo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "ENQUEUE",
        keyword: newKeyword,
        targetGeo: newGeo,
        intent: newIntent,
        clusterRole: newClusterRole,
        parentPillarSlug: newParentPillar.trim() || undefined,
        publishTier: newPublishTier,
        linkedPresetCode: newPreset,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      onNotify(`Error: ${data.error}`);
      return;
    }
    setNewKeyword("");
    onNotify(`Queued keyword "${data.topic.keyword}" (${data.topic.targetGeo}).`);
    loadData();
  };

  const handleGenerate = async (topic?: any) => {
    setGenerating(true);
    try {
      const res = await fetch("/api/admin/seo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: topic ? "GENERATE" : "RUN_NEXT_QUEUED",
          topicId: topic?.id,
          minWords: Math.max(5000, minWords),
          llmConfig: llmConfigPayload,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");
      onNotify(
        `Generated ${data.wordCount.toLocaleString()} words (Score ${data.scoreTotal}/100 via ${data.engineUsed}) — Ready for HITL Review!`
      );
      await loadData();
      // Select freshly generated post
      const freshRes = await fetch("/api/admin/seo", { cache: "no-store" });
      const freshData = await freshRes.json();
      const found = (freshData.posts || []).find((p: any) => p.id === data.postId);
      if (found) selectPostForHitl(found);
    } catch (err: any) {
      onNotify(`Generation Error: ${err.message}`);
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveHitl = async (markApproved = false) => {
    if (!selectedPostId) return;
    const res = await fetch("/api/admin/seo", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: selectedPostId,
        title: editTitle,
        metaTitle: editMetaTitle,
        metaDesc: editMetaDesc,
        clusterRole: editClusterRole,
        parentPillarSlug: editParentPillar.trim() || null,
        tldrAnswer: editTldr,
        ymylDisclaimer: editYmyl,
        sponsorshipDisclosure: editSponsorship,
        authorName: editAuthor,
        reviewerName: editReviewer,
        reviewerCreds: editReviewerCreds,
        sections: editSections,
        guideImages: editImages,
        ...(markApproved ? { status: "APPROVED" } : {}),
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      onNotify(`Save Error: ${data.error}`);
      return;
    }
    onNotify(
      `HITL Updated (${data.post.wordCount.toLocaleString()} words • Score ${data.post.score.total}/100)`
    );
    loadData();
  };

  const handleAppendDeepSection = async () => {
    if (!selectedPostId) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/admin/seo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "APPEND_SECTION",
          postId: selectedPostId,
          llmConfig: llmConfigPayload,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onNotify(`Expanded to ${data.wordCount.toLocaleString()} words! (Score ${data.scoreTotal}/100)`);
      const fresh = await (await fetch("/api/admin/seo", { cache: "no-store" })).json();
      setPosts(fresh.posts || []);
      const found = (fresh.posts || []).find((p: any) => p.id === selectedPostId);
      if (found) selectPostForHitl(found);
    } catch (err: any) {
      onNotify(`Expand Error: ${err.message}`);
    } finally {
      setGenerating(false);
    }
  };

  const handleRegenSection = async (sectionId: string) => {
    if (!selectedPostId) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/admin/seo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "REGEN_SECTION",
          postId: selectedPostId,
          sectionId,
          llmConfig: llmConfigPayload,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onNotify(`Section regenerated! Total: ${data.wordCount.toLocaleString()} words.`);
      const fresh = await (await fetch("/api/admin/seo", { cache: "no-store" })).json();
      setPosts(fresh.posts || []);
      const found = (fresh.posts || []).find((p: any) => p.id === selectedPostId);
      if (found) selectPostForHitl(found);
    } catch (err: any) {
      onNotify(`Section Regen: ${err.message}`);
    } finally {
      setGenerating(false);
    }
  };

  const handleAuditQualityNow = async () => {
    if (!selectedPostId) return;
    setAuditingQuality(true);
    try {
      const res = await fetch("/api/admin/seo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "AUDIT_QUALITY",
          postId: selectedPostId,
          title: editTitle,
          metaTitle: editMetaTitle,
          metaDesc: editMetaDesc,
          tldrAnswer: editTldr,
          sections: editSections,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Audit failed");
      setLiveQualityAudit({ postId: selectedPostId, report: data.qualityAudit });
      onNotify(
        `Quality Audit: Grade ${data.qualityAudit.grade} (${data.qualityAudit.pct}% • ${data.qualityAudit.totalScore}/${data.qualityAudit.maxScore})`
      );
    } catch (err: any) {
      onNotify(`Quality Audit Error: ${err.message}`);
    } finally {
      setAuditingQuality(false);
    }
  };

  const handleAiHumanizeAll = async () => {
    if (!selectedPostId) return;
    setHumanizing(true);
    try {
      const res = await fetch("/api/admin/seo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "AI_HUMANIZE_POST",
          postId: selectedPostId,
          title: editTitle,
          metaTitle: editMetaTitle,
          metaDesc: editMetaDesc,
          tldrAnswer: editTldr,
          sections: editSections,
          llmConfig: llmConfigPayload,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "AI Humanize failed");
      setPosts((prev) => prev.map((p) => (p.id === selectedPostId ? data.post : p)));
      selectPostForHitl(data.post);
      setLiveQualityAudit({ postId: selectedPostId, report: data.post.qualityAudit });
      onNotify(
        `AI Editorial Pass (${data.engineUsed}): Grade ${data.post.qualityAudit.grade} (${data.post.qualityAudit.pct}%)`
      );
    } catch (err: any) {
      onNotify(`AI Humanize Error: ${err.message}`);
    } finally {
      setHumanizing(false);
    }
  };

  const handlePushToLive = async () => {
    if (!selectedPostId) return;
    setPushing(true);
    try {
      // Save latest HITL edits & reviewer signature first
      await handleSaveHitl(true);

      const res = await fetch("/api/admin/seo/push-live", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId: selectedPostId,
          webhookUrl: webhookUrl.trim() || undefined,
          gitPush: gitPushEnabled,
          pingIndexers: pingIndexersOnPush,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Push failed");
      onNotify(data.message);
      loadData();
    } catch (err: any) {
      onNotify(`Push Blocked: ${err.message}`);
    } finally {
      setPushing(false);
    }
  };

  const selectedPost = posts.find((p) => p.id === selectedPostId) || null;
  const activeSection = editSections.find((s) => s.id === activeSectionId) || editSections[0] || null;

  return (
    <div className="space-y-6 text-xs">
      {/* 1. Local LLM & Pipeline Controls */}
      <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <Bot className="w-5 h-5 text-emerald-400" />
              <span>Local 5,000+ Word SEO / AEO / GEO / E-E-A-T / YMYL Engine (HITL)</span>
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Runs locally on $0 Ollama or free BYOK providers. Minimum 5,000 words enforced with zero upper word cap. Push approved static bundles live anytime.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-1 rounded-full border text-[11px] font-mono ${
                providers?.ollama?.online
                  ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300"
                  : "bg-slate-800 border-slate-700 text-slate-400"
              }`}
            >
              Ollama: {providers?.ollama?.online ? providers.ollama.installedModels.join(", ") || "online" : "offline (fallback ready)"}
            </span>
            <button
              type="button"
              onClick={() => handleGenerate()}
              disabled={generating || loading}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-bold flex items-center space-x-1.5 hover:from-emerald-400 hover:to-cyan-400 disabled:opacity-50"
            >
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              <span>{generating ? "Writing 5,000+ Words..." : "Auto-Generate Next Queued"}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-2 border-t border-slate-800">
          <div>
            <label className="block text-[10px] text-slate-400 mb-1">LLM Engine (Local / Free $0)</label>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value as LlmProviderType)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
            >
              <option value="auto">Auto (Free Key / Local Ollama / Grounded)</option>
              <option value="ollama">Local Ollama ($0 Offline)</option>
              <option value="nvidia_nim">NVIDIA NIM (Free Dev Credits)</option>
              <option value="gemini">Google Gemini Free AI Studio</option>
              <option value="openrouter">OpenRouter (:free models)</option>
              <option value="groq">Groq Free Tier</option>
              <option value="deterministic">Instant Grounded Synthesizer (Offline $0)</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] text-slate-400 mb-1">Model Override (Optional)</label>
            <input
              type="text"
              placeholder="qwen2.5:3b | llama-3.3-70b-instruct"
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono placeholder-slate-600"
            />
          </div>
          <div>
            <label className="block text-[10px] text-slate-400 mb-1">Optional Session API Key (NIM / Gemini)</label>
            <input
              type="password"
              placeholder="Leave blank to use .env or local Ollama"
              value={runtimeApiKey}
              onChange={(e) => setRuntimeApiKey(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono placeholder-slate-600"
            />
          </div>
          <div>
            <label className="block text-[10px] text-slate-400 mb-1">Min Words Floor (&gt;=5,000, No Max)</label>
            <input
              type="number"
              min={5000}
              step={500}
              value={minWords}
              onChange={(e) => setMinWords(Math.max(5000, Number(e.target.value) || 5000))}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-emerald-300 font-mono font-bold"
            />
          </div>
        </div>
      </div>

      {/* 2. Topic Queue + Enqueue Custom Keyword */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
          <h3 className="text-sm font-bold text-white">Topic Queue ({queue.length})</h3>
          <form onSubmit={handleAddTopic} className="space-y-2 pb-3 border-b border-slate-800">
            <input
              type="text"
              required
              placeholder="Target SEO keyword (e.g. prefab guest house adu cost)"
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
            />
            <div className="grid grid-cols-3 gap-1.5">
              <select
                value={newGeo}
                onChange={(e) => setNewGeo(e.target.value as SeoGeoTarget)}
                className="px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white"
              >
                {["GLOBAL", "US", "UK", "AU", "IN"].map((g) => (
                  <option key={g}>{g}</option>
                ))}
              </select>
              <select
                value={newIntent}
                onChange={(e) => setNewIntent(e.target.value as SeoIntentType)}
                className="px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white"
              >
                {["COST", "PERMIT", "FINANCE", "GUIDE", "COMPARISON"].map((i) => (
                  <option key={i}>{i}</option>
                ))}
              </select>
              <button
                type="submit"
                className="px-2 py-1.5 rounded-lg bg-cyan-500 text-slate-950 font-bold flex items-center justify-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Queue</span>
              </button>
            </div>
            <div className="grid grid-cols-3 gap-1.5 text-[10px]">
              <select
                value={newClusterRole}
                onChange={(e) => setNewClusterRole(e.target.value as SeoClusterRole)}
                className="px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200"
              >
                <option value="PILLAR">PILLAR</option>
                <option value="SPOKE_COST">SPOKE_COST</option>
                <option value="SPOKE_VS">SPOKE_VS</option>
                <option value="SPOKE_LOCAL">SPOKE_LOCAL</option>
                <option value="SPOKE_GUIDE">SPOKE_GUIDE</option>
              </select>
              <select
                value={newPublishTier}
                onChange={(e) => setNewPublishTier(Number(e.target.value))}
                className="px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200"
              >
                <option value={1}>Priority Tier 1</option>
                <option value={2}>Priority Tier 2</option>
                <option value={3}>Priority Tier 3</option>
              </select>
              <input
                type="text"
                placeholder="Parent Pillar Slug"
                value={newParentPillar}
                onChange={(e) => setNewParentPillar(e.target.value)}
                className="px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 font-mono"
              />
            </div>
          </form>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {queue.map((t) => (
              <div key={t.id} className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="font-semibold text-white leading-snug">{t.keyword}</div>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[9px] font-bold shrink-0 ${
                      t.status === "DONE"
                        ? "bg-emerald-500/20 text-emerald-300"
                        : t.status === "FAILED"
                        ? "bg-red-500/20 text-red-300"
                        : t.status === "GENERATING"
                        ? "bg-amber-500/20 text-amber-300"
                        : "bg-slate-800 text-slate-300"
                    }`}
                  >
                    {t.status}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span>T{t.publishTier || 1} • {t.clusterRole || "PILLAR"} • {t.targetGeo} • {t.intent}</span>
                  <div className="flex items-center space-x-1.5">
                    <button
                      type="button"
                      disabled={generating}
                      onClick={() => handleGenerate(t)}
                      className="px-2 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold disabled:opacity-40"
                    >
                      {t.status === "DONE" ? "Regen 5k+" : "Generate 5k+"}
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        await fetch(`/api/admin/seo?id=${t.id}&type=topic`, { method: "DELETE" });
                        loadData();
                      }}
                      className="p-1 rounded bg-red-500/15 text-red-300"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                {t.errorMsg && <div className="text-[10px] text-red-400">{t.errorMsg}</div>}
              </div>
            ))}
          </div>
        </div>

        {/* 3. Articles List + HITL Split Review */}
        <div className="lg:col-span-2 space-y-4">
          <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <FileText className="w-4 h-4 text-cyan-400" />
                <span>Generated Pillar Guides ({posts.length})</span>
              </h3>
              <Link
                href="/guides"
                target="_blank"
                className="text-[11px] text-emerald-300 hover:underline inline-flex items-center space-x-1"
              >
                <span>Open Public /guides</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>

            {posts.length === 0 ? (
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-slate-400 text-center">
                No articles generated yet. Click &quot;Auto-Generate Next Queued&quot; above to build your first 5,000+ word E-E-A-T guide locally.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                {posts.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => selectPostForHitl(p)}
                    className={`p-3 rounded-2xl border text-left transition ${
                      selectedPostId === p.id
                        ? "bg-cyan-500/10 border-cyan-500/50"
                        : "bg-slate-950 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-white truncate">{p.title}</span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[9px] font-bold shrink-0 ${
                          p.status === "PUBLISHED"
                            ? "bg-emerald-500/20 text-emerald-300"
                            : "bg-amber-500/20 text-amber-300"
                        }`}
                      >
                        {p.status}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between font-mono">
                      <span>{p.wordCount.toLocaleString()}w • {p.targetGeo}</span>
                      <span>Score {p.score?.total || 0}/100</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Active Post HITL Console */}
          {selectedPost && (
            <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
              {/* Compliance Scorecard */}
              <div className="grid grid-cols-3 sm:grid-cols-7 gap-2 text-center">
                <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-[9px] text-slate-400">WORDS (&gt;=5k)</div>
                  <div className={`font-black font-mono ${selectedPost.score?.wordFloorOk ? "text-emerald-400" : "text-red-400"}`}>
                    {selectedPost.wordCount.toLocaleString()}
                  </div>
                </div>
                <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-[9px] text-slate-400">TOTAL</div>
                  <div className="font-black font-mono text-cyan-400">{selectedPost.score?.total || 0}/100</div>
                </div>
                <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-[9px] text-slate-400">E-E-A-T</div>
                  <div className="font-bold font-mono text-white">{selectedPost.score?.eeat || 0}/25</div>
                </div>
                <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-[9px] text-slate-400">YMYL</div>
                  <div className="font-bold font-mono text-white">{selectedPost.score?.ymyl || 0}/20</div>
                </div>
                <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-[9px] text-slate-400">AEO</div>
                  <div className="font-bold font-mono text-white">{selectedPost.score?.aeo || 0}/20</div>
                </div>
                <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-[9px] text-slate-400">GEO</div>
                  <div className="font-bold font-mono text-white">{selectedPost.score?.geo || 0}/20</div>
                </div>
                <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-[9px] text-slate-400">SEO</div>
                  <div className="font-bold font-mono text-white">{selectedPost.score?.seo || 0}/15</div>
                </div>
              </div>

              {selectedPost.score?.flags?.length > 0 && (
                <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-1">
                  {selectedPost.score.flags.map((f: string, idx: number) => (
                    <div key={idx} className="text-[11px] text-amber-300 flex items-center space-x-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Real-Time Content Quality & AI-Tell Audit */}
              {(() => {
                const audit =
                  liveQualityAudit?.postId === selectedPostId
                    ? liveQualityAudit.report
                    : selectedPost.qualityAudit;
                if (!audit) return null;
                return (
                  <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`px-2 py-0.5 rounded-lg text-xs font-black font-mono ${
                            audit.grade === "A"
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                              : audit.grade === "B"
                              ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                              : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                          }`}
                        >
                          GRADE {audit.grade} • {audit.pct}%
                        </span>
                        <span className="text-[11px] font-bold text-slate-200">
                          Real-Time Quality &amp; AI-Tell Audit ({audit.totalScore}/{audit.maxScore})
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={handleAuditQualityNow}
                          disabled={auditingQuality || humanizing}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold disabled:opacity-50"
                        >
                          {auditingQuality ? "Checking..." : "Re-Check Quality"}
                        </button>
                        <button
                          type="button"
                          onClick={handleAiHumanizeAll}
                          disabled={humanizing || auditingQuality}
                          className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 text-[11px] font-extrabold disabled:opacity-50"
                        >
                          {humanizing ? "AI Polishing..." : "AI Humanize & Strip Tells"}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-6 gap-1.5">
                      {(audit.categories || []).map((cat: any) => (
                        <div key={cat.category} className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-center">
                          <div className="text-[9px] text-slate-400 uppercase truncate">{cat.category}</div>
                          <div
                            className={`text-xs font-black font-mono ${
                              cat.pct >= 90 ? "text-emerald-400" : cat.pct >= 75 ? "text-cyan-300" : "text-amber-300"
                            }`}
                          >
                            {cat.pct}%
                          </div>
                        </div>
                      ))}
                    </div>

                    {audit.topFixes?.length > 0 && (
                      <div className="space-y-1">
                        <div className="text-[10px] font-bold text-amber-300 uppercase">Priority Fixes ({audit.topFixes.length})</div>
                        {audit.topFixes.slice(0, 4).map((fix: any, idx: number) => (
                          <div key={idx} className="text-[11px] text-slate-300 flex items-center justify-between gap-2">
                            <span className="truncate">• [{fix.category}] {fix.check}</span>
                            <span className="text-amber-300 font-mono text-[10px] shrink-0">{fix.detail}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => setShowAllAuditChecks((v) => !v)}
                        className="text-[10px] font-bold text-cyan-400 hover:underline"
                      >
                        {showAllAuditChecks ? "Hide full checklist" : `Show all ${audit.checks?.length || 0} quality checks`}
                      </button>
                      {showAllAuditChecks && (
                        <div className="mt-2 max-h-52 overflow-y-auto space-y-1 pr-1">
                          {(audit.checks || []).map((c: any, idx: number) => (
                            <div key={idx} className="text-[10px] flex items-center justify-between gap-2 py-0.5 border-b border-slate-900">
                              <span className={c.status === "PASS" ? "text-emerald-400" : c.status === "WARN" ? "text-amber-300" : "text-red-400"}>
                                {c.status} • [{c.category}] {c.check}
                              </span>
                              <span className="text-slate-400 font-mono truncate max-w-[45%]">{c.detail}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Metadata & TL;DR Editor */}
              <div className="space-y-2">
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Article H1 Title"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-bold"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={editMetaTitle}
                    onChange={(e) => setEditMetaTitle(e.target.value)}
                    placeholder="SEO Meta Title"
                    className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200"
                  />
                  <input
                    type="text"
                    value={editMetaDesc}
                    onChange={(e) => setEditMetaDesc(e.target.value)}
                    placeholder="SEO Meta Description"
                    className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">AEO Featured-Snippet Direct Answer (40–75 words)</label>
                  <textarea
                    rows={2}
                    value={editTldr}
                    onChange={(e) => setEditTldr(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200"
                  />
                </div>
                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="text-[11px] font-bold text-cyan-300 flex items-center space-x-1.5">
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>Original Guide Images &amp; Diagrams (ImageObject JSON-LD • {editImages.length})</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-end">
                    <AdminAssetUploader label="Upload Diagram / Real Asset" bucket="photos" value={pendingImageUrl} onChange={setPendingImageUrl} />
                    <div className="space-y-1.5">
                      <input
                        type="text"
                        placeholder="Image Alt & Caption (e.g. Rooftop I-Beam Load Spreader Diagram)"
                        value={pendingImageCaption}
                        onChange={(e) => setPendingImageCaption(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-[11px]"
                      />
                      <button
                        type="button"
                        disabled={!pendingImageUrl.trim()}
                        onClick={() => {
                          if (!pendingImageUrl.trim()) return;
                          setEditImages((prev) => [
                            ...prev,
                            {
                              url: pendingImageUrl.trim(),
                              alt: pendingImageCaption.trim() || editTitle,
                              caption: pendingImageCaption.trim() || undefined,
                            },
                          ]);
                          setPendingImageUrl("");
                          setPendingImageCaption("");
                        }}
                        className="w-full py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold text-[11px] disabled:opacity-40"
                      >
                        + Attach Visual to Guide
                      </button>
                    </div>
                  </div>
                  {editImages.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {editImages.map((img, idx) => (
                        <div key={idx} className="flex items-center space-x-2 p-1.5 rounded-lg bg-slate-900 border border-slate-700 text-[10px]">
                          <img src={img.url} alt={img.alt} className="w-10 h-8 rounded object-cover" />
                          <span className="max-w-[140px] truncate text-slate-300">{img.caption || img.alt}</span>
                          <button
                            type="button"
                            onClick={() => setEditImages((prev) => prev.filter((_, i) => i !== idx))}
                            className="text-red-300 px-1"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">Ranking &amp; Commercial Sponsorship Disclosure (E-E-A-T)</label>
                  <textarea
                    rows={2}
                    value={editSponsorship}
                    onChange={(e) => setEditSponsorship(e.target.value)}
                    className="w-full p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 text-[11px]"
                  />
                </div>
              </div>

              {/* Section-by-Section HITL Editor + Unlimited Append */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
                  {editSections.map((sec, idx) => (
                    <button
                      key={sec.id}
                      type="button"
                      onClick={() => setActiveSectionId(sec.id)}
                      className={`w-full p-2 rounded-xl text-left text-[11px] border transition ${
                        activeSection?.id === sec.id
                          ? "bg-emerald-500/15 border-emerald-500/40 text-white font-semibold"
                          : "bg-slate-950 border-slate-800 text-slate-300"
                      }`}
                    >
                      <div className="truncate">{idx + 1}. {sec.heading}</div>
                      <div className="text-[9px] text-slate-400 font-mono">{sec.wordCount} words</div>
                    </button>
                  ))}
                  <button
                    type="button"
                    disabled={generating}
                    onClick={handleAppendDeepSection}
                    className="w-full py-2 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 font-bold text-[11px] flex items-center justify-center space-x-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Append Deep Section (+700w)</span>
                  </button>
                </div>

                {activeSection && (
                  <div className="md:col-span-2 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <input
                        type="text"
                        value={activeSection.heading}
                        onChange={(e) => {
                          setEditSections((prev) =>
                            prev.map((s) => (s.id === activeSection.id ? { ...s, heading: e.target.value } : s))
                          );
                        }}
                        className="flex-1 px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white font-semibold"
                      />
                      <button
                        type="button"
                        disabled={generating}
                        onClick={() => handleRegenSection(activeSection.id)}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 font-semibold flex items-center space-x-1 shrink-0"
                      >
                        <RefreshCw className={`w-3 h-3 ${generating ? "animate-spin" : ""}`} />
                        <span>AI Rewrite H2</span>
                      </button>
                    </div>
                    <textarea
                      rows={9}
                      value={activeSection.markdown}
                      onChange={(e) => {
                        const val = e.target.value;
                        setEditSections((prev) =>
                          prev.map((s) => (s.id === activeSection.id ? { ...s, markdown: val } : s))
                        );
                      }}
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 font-mono text-[11px]"
                    />
                  </div>
                )}
              </div>

              {/* HITL Sign-off & Push to Live */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-emerald-500/30 space-y-3">
                <div className="flex items-center space-x-2 font-bold text-emerald-300">
                  <ShieldCheck className="w-4 h-4" />
                  <span>HITL Engineering Review Sign-Off &amp; Push to Live (myprefabroom.com)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Reviewer Full Name * (e.g. Er. Vikram Deshmukh)"
                    value={editReviewer}
                    onChange={(e) => setEditReviewer(e.target.value)}
                    className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500"
                  />
                  <input
                    type="text"
                    placeholder="Credentials (e.g. B.E. Civil, Modular Consultant)"
                    value={editReviewerCreds}
                    onChange={(e) => setEditReviewerCreds(e.target.value)}
                    className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
                  <input
                    type="text"
                    placeholder="Optional Remote Webhook URL (https://myprefabroom.com/api/guides/sync)"
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 font-mono text-[11px]"
                  />
                  <label className="flex items-center space-x-2 text-slate-300 px-2">
                    <input
                      type="checkbox"
                      checked={gitPushEnabled}
                      onChange={(e) => setGitPushEnabled(e.target.checked)}
                      className="accent-emerald-500"
                    />
                    <span>Commit &amp; push to git</span>
                  </label>
                  <label className="flex items-center space-x-2 text-emerald-300 px-2">
                    <input
                      type="checkbox"
                      checked={pingIndexersOnPush}
                      onChange={(e) => setPingIndexersOnPush(e.target.checked)}
                      className="accent-emerald-500"
                    />
                    <span>Ping IndexNow + Google Indexing</span>
                  </label>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleSaveHitl(false)}
                      className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center space-x-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Save HITL Changes</span>
                    </button>
                    {selectedPost.status === "PUBLISHED" && (
                      <Link
                        href={`/guides/${selectedPost.slug}`}
                        target="_blank"
                        className="px-3 py-2 rounded-xl bg-slate-800 text-emerald-300 font-semibold inline-flex items-center space-x-1"
                      >
                        <span>View Live /guides/{selectedPost.slug}</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    )}
                  </div>

                  <button
                    type="button"
                    disabled={pushing}
                    onClick={handlePushToLive}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-extrabold flex items-center space-x-2 hover:from-emerald-400 hover:to-cyan-400 disabled:opacity-50"
                  >
                    {pushing ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                    <span>Approve &amp; Push to Live</span>
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
