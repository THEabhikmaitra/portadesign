"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Code2,
  ExternalLink,
  Gauge,
  Globe,
  KeyRound,
  Loader2,
  RefreshCw,
  Send,
  ShieldCheck,
  Trash2,
} from "lucide-react";

interface SiteSeoConfigState {
  siteUrl: string;
  headerHtml: string;
  bodyTopHtml: string;
  footerHtml: string;
  customGlobalSchemaJson: string;
  indexNowKey: string;
  llmsSummaryNote: string;
}

export const AdminTechSeoPanel: React.FC<{
  onNotify: (msg: string) => void;
}> = ({ onNotify }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [auditing, setAuditing] = useState(false);
  const [submittingIdx, setSubmittingIdx] = useState(false);
  const [runningPsi, setRunningPsi] = useState(false);

  const [cfg, setCfg] = useState<SiteSeoConfigState>({
    siteUrl: "https://myprefabroom.com",
    headerHtml: "",
    bodyTopHtml: "",
    footerHtml: "",
    customGlobalSchemaJson: "",
    indexNowKey: "",
    llmsSummaryNote: "",
  });

  const [hasGoogleKey, setHasGoogleKey] = useState(false);
  const [googleEmail, setGoogleEmail] = useState<string | null>(null);
  const [googleKeyDraft, setGoogleKeyDraft] = useState("");

  const [singleUrl, setSingleUrl] = useState("/");
  const [singleAction, setSingleAction] = useState<"URL_UPDATED" | "URL_DELETED">("URL_UPDATED");
  const [includeGoogle, setIncludeGoogle] = useState(true);
  const [logs, setLogs] = useState<any[]>([]);

  const [auditReport, setAuditReport] = useState<any>(null);
  const [psiTargetUrl, setPsiTargetUrl] = useState("https://myprefabroom.com/");
  const [psiStrategy, setPsiStrategy] = useState<"mobile" | "desktop">("mobile");
  const [psiResult, setPsiResult] = useState<any>(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [cfgRes, logRes] = await Promise.all([
        fetch("/api/admin/seo/site-config", { cache: "no-store" }),
        fetch("/api/admin/seo/index-submit", { cache: "no-store" }),
      ]);
      const cfgData = await cfgRes.json();
      const logData = await logRes.json();

      if (!cfgRes.ok) throw new Error(cfgData.error || "Failed to load Technical SEO config");
      if (cfgData.config) {
        setCfg(cfgData.config);
        setPsiTargetUrl(`${cfgData.config.siteUrl || "https://myprefabroom.com"}/`);
      }
      setHasGoogleKey(Boolean(cfgData.hasGoogleServiceAccount));
      setGoogleEmail(cfgData.googleServiceAccountEmail || null);
      setLogs(logData.logs || []);
    } catch (err: any) {
      onNotify(`Tech SEO Load Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [onNotify]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleSaveConfig = async (clearGoogle = false) => {
    setSaving(true);
    try {
      const payload: Record<string, any> = {
        ...cfg,
        ...(googleKeyDraft.trim() ? { googleServiceAcctJson: googleKeyDraft.trim() } : {}),
        ...(clearGoogle ? { clearGoogleServiceAccount: true } : {}),
      };
      const res = await fetch("/api/admin/seo/site-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");

      setCfg(data.config);
      setHasGoogleKey(Boolean(data.hasGoogleServiceAccount));
      setGoogleEmail(data.googleServiceAccountEmail || null);
      setGoogleKeyDraft("");
      onNotify(`Saved & synced site SEO bundle -> ${data.bundlePath}`);
    } catch (err: any) {
      onNotify(`Save Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleRunLocalAudit = async () => {
    setAuditing(true);
    try {
      const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3010";
      const res = await fetch(`/api/admin/seo/audit?origin=${encodeURIComponent(origin)}`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Audit failed");
      setAuditReport(data);
      onNotify(`ZELMUx Tech SEO Audit completed: Score ${data.score}/100 across ${data.pages?.length || 0} pages`);
    } catch (err: any) {
      onNotify(`Audit Error: ${err.message}`);
    } finally {
      setAuditing(false);
    }
  };

  const handleRunPsi = async () => {
    setRunningPsi(true);
    try {
      const res = await fetch("/api/admin/seo/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUrl: psiTargetUrl, strategy: psiStrategy }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "PageSpeed check failed");
      setPsiResult(data);
      if (data.localOnlySkip) {
        onNotify(data.message);
      } else {
        onNotify(
          `Lighthouse (${psiStrategy}): Perf ${data.scores?.performance} / A11y ${data.scores?.accessibility} / BP ${data.scores?.bestPractices} / SEO ${data.scores?.seo}`
        );
      }
    } catch (err: any) {
      onNotify(`PSI Error: ${err.message}`);
    } finally {
      setRunningPsi(false);
    }
  };

  const handleIndexSubmit = async (mode: "all" | "single") => {
    setSubmittingIdx(true);
    try {
      const res = await fetch("/api/admin/seo/index-submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          url: mode === "single" ? singleUrl : undefined,
          actionType: singleAction,
          includeGoogle,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Indexing failed");
      setLogs(data.logs || []);
      onNotify(`Submitted ${data.submittedUrls?.length || 0} URL(s) to IndexNow + Google Indexing API`);
    } catch (err: any) {
      onNotify(`Indexing Error: ${err.message}`);
    } finally {
      setSubmittingIdx(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 text-center text-slate-400 text-xs">
        Loading Technical SEO, Custom Scripts &amp; Indexing Studio...
      </div>
    );
  }

  return (
    <div className="space-y-6 text-xs">
      {/* Local-Only Security Guard Banner */}
      <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-start space-x-2.5">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold text-white text-xs sm:text-sm">
              Local Workstation Admin Guard Active
            </div>
            <p className="text-[11px] text-slate-300 mt-0.5">
              Custom Header/Body/Footer code, Service Account keys, and Indexing runs are enforced local-only unless{" "}
              <code className="text-emerald-300">ALLOW_REMOTE_ADMIN=true</code>. Public routes read synced{" "}
              <code className="text-cyan-300">src/content/site-seo-config.json</code> (private keys excluded).
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5 text-[11px] font-mono">
          {["/robots.txt", "/sitemap.xml", "/llms.txt", "/ai.txt", "/feed.xml", "/indexnow-key.txt", "/icon.svg"].map(
            (ep) => (
              <a
                key={ep}
                href={ep}
                target="_blank"
                rel="noreferrer"
                className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-cyan-300 hover:border-cyan-400 inline-flex items-center space-x-1"
              >
                <span>{ep}</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            )
          )}
        </div>
      </div>

      {/* 1. Custom Code Injection (Head / Body Top / Footer / Global Schema) */}
      <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <Code2 className="w-5 h-5 text-cyan-400" />
            <div>
              <h2 className="text-sm font-bold text-white">
                Custom HTML &amp; Script Injection Areas + GEO Feeds
              </h2>
              <p className="text-[11px] text-slate-400">
                Inject Search Console verification, GA4/GTM, AdSense Auto Ads, chat widgets, or extra global JSON-LD without editing code.
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={saving}
            onClick={() => handleSaveConfig(false)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-extrabold inline-flex items-center space-x-1.5 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            <span>Save &amp; Sync Public Config</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Canonical Production Site URL</label>
            <input
              type="url"
              value={cfg.siteUrl}
              onChange={(e) => setCfg((p) => ({ ...p, siteUrl: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono"
            />
          </div>
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">llms.txt &amp; Organization Brand Summary</label>
            <input
              type="text"
              value={cfg.llmsSummaryNote}
              onChange={(e) => setCfg((p) => ({ ...p, llmsSummaryNote: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] text-slate-300 font-semibold mb-1">
              Header Code (inside &lt;head&gt;)
            </label>
            <textarea
              rows={6}
              placeholder='<meta name="google-site-verification" content="..." />'
              value={cfg.headerHtml}
              onChange={(e) => setCfg((p) => ({ ...p, headerHtml: e.target.value }))}
              className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-emerald-300 font-mono text-[11px]"
            />
          </div>
          <div>
            <label className="block text-[11px] text-slate-300 font-semibold mb-1">
              Body Top Code (opening &lt;body&gt;)
            </label>
            <textarea
              rows={6}
              placeholder="<noscript><iframe ...></iframe></noscript>"
              value={cfg.bodyTopHtml}
              onChange={(e) => setCfg((p) => ({ ...p, bodyTopHtml: e.target.value }))}
              className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-cyan-300 font-mono text-[11px]"
            />
          </div>
          <div>
            <label className="block text-[11px] text-slate-300 font-semibold mb-1">
              Footer Code (before &lt;/body&gt;)
            </label>
            <textarea
              rows={6}
              placeholder="<script>/* deferred widget */</script>"
              value={cfg.footerHtml}
              onChange={(e) => setCfg((p) => ({ ...p, footerHtml: e.target.value }))}
              className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-amber-200 font-mono text-[11px]"
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] text-slate-300 font-semibold mb-1">
            Extra Global Custom JSON-LD Schema (Optional valid JSON injected in &lt;head&gt;)
          </label>
          <textarea
            rows={4}
            placeholder='{"@context":"https://schema.org","@type":"Organization","name":"MyPrefabRoom"}'
            value={cfg.customGlobalSchemaJson}
            onChange={(e) => setCfg((p) => ({ ...p, customGlobalSchemaJson: e.target.value }))}
            className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 font-mono text-[11px]"
          />
        </div>
      </div>

      {/* 2. Fast Indexing APIs: IndexNow + Google Indexing API */}
      <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <Send className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className="text-sm font-bold text-white">
                Instant Search Indexing (Google Indexing API v3 + IndexNow)
              </h2>
              <p className="text-[11px] text-slate-400">
                Notify Bing, Yandex &amp; IndexNow peers for free, plus Google Indexing API v3 when a Service Account JSON is stored locally.
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={submittingIdx}
            onClick={() => handleIndexSubmit("all")}
            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold inline-flex items-center space-x-1.5 disabled:opacity-50"
          >
            {submittingIdx ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
            <span>Index All Live URLs + Home</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">
                IndexNow Verification Key (served at /indexnow-key.txt)
              </label>
              <input
                type="text"
                value={cfg.indexNowKey}
                onChange={(e) => setCfg((p) => ({ ...p, indexNowKey: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] text-slate-400 inline-flex items-center space-x-1">
                  <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                  <span>Google Indexing Service Account JSON (Local DB Only)</span>
                </span>
                {hasGoogleKey ? (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
                    Configured: {googleEmail || "Service Account"}
                  </span>
                ) : (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                    Not set
                  </span>
                )}
              </div>
              <textarea
                rows={3}
                placeholder='Paste {"client_email":"...","private_key":"-----BEGIN PRIVATE KEY-----..."} to update/set'
                value={googleKeyDraft}
                onChange={(e) => setGoogleKeyDraft(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 font-mono text-[10px]"
              />
              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] text-slate-500">
                  Private key is never exported to git or site-seo-config.json.
                </span>
                {hasGoogleKey && (
                  <button
                    type="button"
                    onClick={() => handleSaveConfig(true)}
                    className="text-[10px] text-red-400 hover:text-red-300 inline-flex items-center space-x-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Clear Saved Key</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="text-[11px] font-bold text-white">Submit Single Path or URL</div>
            <div className="flex flex-wrap gap-2">
              <input
                type="text"
                value={singleUrl}
                onChange={(e) => setSingleUrl(e.target.value)}
                placeholder="/guides/my-guide-slug or https://..."
                className="flex-1 min-w-[180px] px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono"
              />
              <select
                value={singleAction}
                onChange={(e) => setSingleAction(e.target.value as any)}
                className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200"
              >
                <option value="URL_UPDATED">URL_UPDATED</option>
                <option value="URL_DELETED">URL_DELETED</option>
              </select>
            </div>
            <label className="flex items-center space-x-2 text-slate-300">
              <input
                type="checkbox"
                checked={includeGoogle}
                onChange={(e) => setIncludeGoogle(e.target.checked)}
                className="accent-emerald-500"
              />
              <span>Include Google Indexing API call (alongside IndexNow)</span>
            </label>
            <button
              type="button"
              disabled={submittingIdx}
              onClick={() => handleIndexSubmit("single")}
              className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold"
            >
              Ping URL Now
            </button>

            <div className="pt-2 border-t border-slate-800">
              <div className="text-[11px] font-bold text-slate-300 mb-1.5">Recent Indexing Logs ({logs.length})</div>
              <div className="max-h-40 overflow-y-auto space-y-1">
                {logs.length === 0 ? (
                  <p className="text-[11px] text-slate-500">No indexing dispatches recorded yet.</p>
                ) : (
                  logs.map((l) => (
                    <div
                      key={l.id}
                      className="p-2 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between gap-2 text-[10px]"
                    >
                      <div className="truncate">
                        <span className="font-mono text-cyan-300 mr-1.5">[{l.service}]</span>
                        <span className="text-slate-200">{l.url}</span>
                      </div>
                      <span
                        className={`px-1.5 py-0.5 rounded font-mono shrink-0 ${
                          l.status === "SUCCESS"
                            ? "bg-emerald-500/20 text-emerald-300"
                            : l.status === "SKIPPED"
                            ? "bg-amber-500/20 text-amber-300"
                            : "bg-red-500/20 text-red-300"
                        }`}
                      >
                        {l.status} {l.httpCode ? `(${l.httpCode})` : ""}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. ZELMUx E2E Technical & On-Page SEO Audit + Lighthouse PageSpeed */}
      <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-cyan-400" />
            <div>
              <h2 className="text-sm font-bold text-white">
                ZELMUx Technical &amp; On-Page SEO Audit + Lighthouse PageSpeed
              </h2>
              <p className="text-[11px] text-slate-400">
                Audits endpoints, TTFB, DOM node budget (&le;1,400), H1/meta lengths, missing image alt tags, duplicates, and all JSON-LD schemas.
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={auditing}
            onClick={handleRunLocalAudit}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 font-extrabold inline-flex items-center space-x-1.5 disabled:opacity-50"
          >
            {auditing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            <span>{auditing ? "Crawling Local Site..." : "Run Full Local Site Audit"}</span>
          </button>
        </div>

        {/* Live URL Lighthouse PSI Bar */}
        <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-wrap items-center gap-2">
          <Gauge className="w-4 h-4 text-emerald-400 shrink-0" />
          <input
            type="url"
            value={psiTargetUrl}
            onChange={(e) => setPsiTargetUrl(e.target.value)}
            placeholder="https://myprefabroom.com/"
            className="flex-1 min-w-[220px] px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white font-mono"
          />
          <select
            value={psiStrategy}
            onChange={(e) => setPsiStrategy(e.target.value as any)}
            className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-200"
          >
            <option value="mobile">Mobile</option>
            <option value="desktop">Desktop</option>
          </select>
          <button
            type="button"
            disabled={runningPsi}
            onClick={handleRunPsi}
            className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-300 font-bold"
          >
            {runningPsi ? "Checking..." : "Run Lighthouse PSI (Live URL)"}
          </button>
        </div>

        {psiResult && (
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
            {psiResult.localOnlySkip ? (
              <p className="text-amber-300">{psiResult.message}</p>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex gap-3 font-mono">
                  <span className="text-emerald-400">Perf: {psiResult.scores?.performance}</span>
                  <span className="text-cyan-400">A11y: {psiResult.scores?.accessibility}</span>
                  <span className="text-emerald-300">BP: {psiResult.scores?.bestPractices}</span>
                  <span className="text-white">SEO: {psiResult.scores?.seo}</span>
                </div>
                <div className="text-[11px] text-slate-400 font-mono">
                  FCP {psiResult.metrics?.fcp} • LCP {psiResult.metrics?.lcp} • CLS {psiResult.metrics?.cls} • TBT {psiResult.metrics?.tbt}
                </div>
              </div>
            )}
          </div>
        )}

        {auditReport && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                <div className="text-[10px] text-slate-400">Overall Audit Score</div>
                <div className="text-2xl font-black text-emerald-400">{auditReport.score}/100</div>
              </div>
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                <div className="text-[10px] text-slate-400">Sitemap &amp; Feed Items</div>
                <div className="text-base font-bold text-white">
                  {auditReport.endpoints?.sitemapXml?.urlCount || 0} URLs • {auditReport.endpoints?.feedXml?.itemCount || 0} RSS
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                <div className="text-[10px] text-slate-400">AI Discovery (llms / ai.txt)</div>
                <div className="text-base font-bold text-cyan-300">
                  {auditReport.endpoints?.llmsTxt?.ok && auditReport.endpoints?.aiTxt?.ok ? "Active (200 OK)" : "Incomplete"}
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                <div className="text-[10px] text-slate-400">Duplicates Found</div>
                <div className="text-base font-bold text-white">
                  {auditReport.duplicateTitles?.length || 0} Titles / {auditReport.duplicateMetaDescs?.length || 0} Descs
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {(auditReport.allDetectedSchemaTypes || []).map((st: string) => (
                <span
                  key={st}
                  className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-mono text-[10px]"
                >
                  Schema: {st}
                </span>
              ))}
            </div>

            {(auditReport.duplicateTitles?.length > 0 || auditReport.duplicateMetaDescs?.length > 0) && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 space-y-1">
                <div className="font-bold flex items-center space-x-1">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Duplicate Meta Alerts</span>
                </div>
                {auditReport.duplicateTitles?.map((d: string, i: number) => (
                  <div key={i} className="font-mono text-[10px]">Title: {d}</div>
                ))}
                {auditReport.duplicateMetaDescs?.map((d: string, i: number) => (
                  <div key={i} className="font-mono text-[10px]">Desc: {d}</div>
                ))}
              </div>
            )}

            <div className="overflow-x-auto rounded-2xl border border-slate-800">
              <table className="w-full text-left text-[11px]">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="p-2.5">Path</th>
                    <th className="p-2.5">HTTP</th>
                    <th className="p-2.5">TTFB</th>
                    <th className="p-2.5">KB / DOM</th>
                    <th className="p-2.5">Title / Meta</th>
                    <th className="p-2.5">H1 / Alt</th>
                    <th className="p-2.5">Schemas &amp; Issues</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {(auditReport.pages || []).map((p: any) => (
                    <tr key={p.path} className="hover:bg-slate-800/40">
                      <td className="p-2.5 font-mono text-cyan-300">{p.path}</td>
                      <td className="p-2.5 font-mono">
                        <span className={p.status === 200 ? "text-emerald-400" : "text-red-400"}>{p.status}</span>
                      </td>
                      <td className="p-2.5 font-mono">{p.ttfbMs}ms</td>
                      <td className="p-2.5 font-mono">
                        {p.htmlKb}KB / {p.domNodes}
                      </td>
                      <td className="p-2.5 font-mono">
                        {p.titleLen}c / {p.metaDescLen}c
                      </td>
                      <td className="p-2.5 font-mono">
                        H1:{p.h1Count} • missAlt:{p.missingAltCount}
                      </td>
                      <td className="p-2.5 space-y-1">
                        <div className="text-[10px] text-slate-300 font-mono">
                          {p.schemaTypes?.join(", ") || "none"}
                        </div>
                        {p.errors?.map((er: string, i: number) => (
                          <div key={i} className="text-[10px] text-red-400">Err: {er}</div>
                        ))}
                        {p.warnings?.map((w: string, i: number) => (
                          <div key={i} className="text-[10px] text-amber-300">Warn: {w}</div>
                        ))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
