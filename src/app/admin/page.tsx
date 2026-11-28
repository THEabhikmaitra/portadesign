"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import {
  Cpu,
  ArrowLeft,
  ShieldCheck,
  Users,
  Building2,
  Sparkles,
  Box,
  Layers,
  Sliders,
  Lock,
  CheckCircle2,
  XCircle,
  Ban,
  LogOut,
  Plus,
  Trash2,
  BarChart3,
  MessageSquare,
  FileText,
} from "lucide-react";
import {
  AdminElementsPanel,
  AdminAttributesPanel,
  AdminPresetsAndRatesPanel,
} from "@/components/admin/AdminCatalogPanels";
import { AdminSeoEnginePanel } from "@/components/admin/AdminSeoEnginePanel";

type AdminTab = "overview" | "vendors" | "ads" | "users" | "elements" | "attributes" | "presets" | "seo";

export default function AdminPortalPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [authError, setAuthError] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const [overview, setOverview] = useState<any>(null);
  const [vendors, setVendors] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [elements, setElements] = useState<any[]>([]);
  const [attributes, setAttributes] = useState<any[]>([]);
  const [presets, setPresets] = useState<any[]>([]);
  const [challenges, setChallenges] = useState<any[]>([]);
  const [logisticsDefaults, setLogisticsDefaults] = useState<any>(null);
  const [quotes, setQuotes] = useState<any[]>([]);

  // Inline Create Vendor / User Modals
  const [newVendor, setNewVendor] = useState({
    email: "",
    password: "",
    companyName: "",
    city: "",
    phone: "",
    gstin: "",
  });
  const [newUser, setNewUser] = useState({
    email: "",
    password: "",
    name: "",
    role: "BUYER",
  });

  const loadAllAdminData = useCallback(async () => {
    try {
      setAuthError(null);
      const ovRes = await fetch("/api/admin/overview", { cache: "no-store" });
      if (ovRes.status === 401 || ovRes.status === 403) {
        const err = await ovRes.json().catch(() => ({}));
        setAuthError(err.error || "Platform Admin authentication required.");
        return;
      }

      const [ov, vRes, uRes, eRes, aRes, pRes, cRes, dRes, qRes] = await Promise.all([
        ovRes.json(),
        fetch("/api/admin/vendors").then((r) => r.json()),
        fetch("/api/admin/users").then((r) => r.json()),
        fetch("/api/admin/elements").then((r) => r.json()),
        fetch("/api/admin/attributes").then((r) => r.json()),
        fetch("/api/admin/presets").then((r) => r.json()),
        fetch("/api/admin/challenges").then((r) => r.json()),
        fetch("/api/admin/logistics-defaults").then((r) => r.json()),
        fetch("/api/admin/quotes").then((r) => r.json()),
      ]);

      setOverview(ov);
      setVendors(vRes.vendors || []);
      setUsers(uRes.users || []);
      setElements(eRes.elements || []);
      setAttributes(aRes.attributes || []);
      setPresets(pRes.presets || []);
      setChallenges(cRes.challenges || []);
      setLogisticsDefaults(dRes.defaults || null);
      setQuotes(qRes.quotes || []);
    } catch (err: any) {
      setStatusMsg(`Load error: ${err.message}`);
    }
  }, []);

  useEffect(() => {
    loadAllAdminData();
  }, [loadAllAdminData]);

  const patchVendor = async (id: string, data: any) => {
    const res = await fetch("/api/admin/vendors", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...data }),
    });
    if (res.ok) {
      setStatusMsg("Vendor updated live.");
      loadAllAdminData();
    }
  };

  const patchUser = async (id: string, data: any) => {
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...data }),
    });
    const j = await res.json();
    if (!res.ok) setStatusMsg(`Error: ${j.error}`);
    else {
      setStatusMsg("User updated.");
      loadAllAdminData();
    }
  };

  if (authError) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full p-6 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="text-lg font-bold text-white">Platform Admin Control Center</h1>
          <p className="text-xs text-slate-400">{authError}</p>
          <div className="flex justify-center gap-2 pt-2">
            <Link
              href="/auth/signin"
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 font-bold text-xs"
            >
              Sign In / Initialize Admin
            </Link>
            <Link href="/" className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-200 text-xs font-semibold">
              3D Studio
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const stats = overview?.stats || {};
  const ollama = overview?.ollama || {};

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-16">
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <Link
              href="/"
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              title="Back to 3D Studio"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="flex items-center space-x-2">
              <Cpu className="w-5 h-5 text-cyan-400" />
              <div>
                <h1 className="text-sm sm:text-base font-bold text-white">Platform Admin E2E Console</h1>
                <div className="text-[10px] text-slate-400 hidden sm:block">
                  Vendors • Users • Ads • Dynamic 3D Modules • AI Generator • Zero Demo Data
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span
              className={`hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-slate-800 border text-[11px] font-mono ${
                ollama.online ? "border-emerald-500/40 text-emerald-300" : "border-slate-700 text-slate-400"
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${ollama.online ? "bg-emerald-400" : "bg-amber-400"}`} />
              <span>Ollama: {ollama.configuredModel || "qwen2.5"}</span>
            </span>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/auth/signin" })}
              className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {statusMsg && (
          <div className="p-3 rounded-2xl bg-slate-900 border border-emerald-500/50 text-xs text-emerald-300 flex items-center justify-between">
            <span>{statusMsg}</span>
            <button onClick={() => setStatusMsg(null)} className="px-2 text-slate-400 hover:text-white">
              ×
            </button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {(
            [
              ["overview", "Overview & Deals", BarChart3],
              ["vendors", `Vendors (${vendors.length})`, Building2],
              ["ads", "Ads & Sponsored", Sparkles],
              ["users", `Users (${users.length})`, Users],
              ["elements", `Modules + AI (${elements.length})`, Box],
              ["attributes", `Attributes + Shaders (${attributes.length})`, Layers],
              ["presets", "Presets, Missions & Rates", Sliders],
              ["seo", "SEO Content Engine (5k+ HITL)", FileText],
            ] as const
          ).map(([id, label, Icon]) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                activeTab === id
                  ? "bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 shadow-lg"
                  : "bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* TAB 1: OVERVIEW + DEALS MEDIATION + AUDIT LOG */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 text-xs">
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                <div className="text-slate-400">Vendors (Approved / Pending)</div>
                <div className="text-2xl font-black font-mono text-white mt-1">
                  {stats.vendorsApproved || 0}{" "}
                  <span className="text-sm text-amber-400">/ {stats.vendorsPending || 0} pending</span>
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                <div className="text-slate-400">Active Catalog Items</div>
                <div className="text-2xl font-black font-mono text-cyan-400 mt-1">
                  {stats.elementsActive || 0} Modules • {stats.attributesActive || 0} Attrs
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                <div className="text-slate-400">Sponsored Ads Performance</div>
                <div className="text-2xl font-black font-mono text-amber-400 mt-1">
                  {stats.totalImpressions || 0} Impr / {stats.totalClicks || 0} Clicks ({stats.adCtrPct || 0}%)
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                <div className="text-slate-400">Quote Pipeline GMV</div>
                <div className="text-2xl font-black font-mono text-emerald-400 mt-1">
                  ₹{((stats.quotesGmv || 0) / 100000).toFixed(2)}L ({quotes.length} deals)
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
              {/* All Deals / Quotes Mediation */}
              <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <MessageSquare className="w-4 h-4 text-emerald-400" />
                  <span>Buyer ↔ Maker Quote Deals ({quotes.length})</span>
                </h3>
                {quotes.length === 0 ? (
                  <p className="text-slate-400 py-8 text-center">No buyer quotes submitted yet.</p>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {quotes.map((q) => (
                      <div key={q.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="font-bold text-white">
                            {q.design?.title || "Room Inquiry"} → {q.vendor?.companyName}
                          </div>
                          <span className="font-mono font-bold text-emerald-400">
                            ₹{Number(q.negotiatedTotal || 0).toLocaleString("en-IN")}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Buyer: {q.buyer?.name} ({q.buyer?.email}) • Status: <strong className="text-white">{q.status}</strong>
                        </div>
                        <div className="flex space-x-1.5">
                          {["PENDING", "NEGOTIATING", "ACCEPTED", "REJECTED"].map((st) => (
                            <button
                              key={st}
                              onClick={async () => {
                                await fetch("/api/admin/quotes", {
                                  method: "PATCH",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ id: q.id, status: st }),
                                });
                                loadAllAdminData();
                              }}
                              className={`px-2 py-1 rounded text-[10px] font-bold ${
                                q.status === st ? "bg-emerald-500 text-slate-950" : "bg-slate-800 text-slate-300"
                              }`}
                            >
                              {st}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Admin Audit Log */}
              <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-cyan-400" />
                  <span>Admin Audit Trail</span>
                </h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {(overview?.recentAuditLogs || []).map((log: any) => (
                    <div key={log.id} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px]">
                      <div className="flex justify-between">
                        <span className="font-mono font-bold text-cyan-300">{log.action}</span>
                        <span className="text-slate-500">{new Date(log.createdAt).toLocaleString()}</span>
                      </div>
                      <div className="text-slate-400 mt-0.5">
                        {log.actor?.email} • {log.targetType} {log.diffJson ? `• ${log.diffJson}` : ""}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: VENDORS APPROVAL & ONBOARDING */}
        {activeTab === "vendors" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-xs">
            <div className="lg:col-span-8 p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
              <h3 className="text-sm font-bold text-white">Registered Makers & KYC Approval ({vendors.length})</h3>
              {vendors.length === 0 ? (
                <p className="text-slate-400 py-8 text-center">No makers onboarded yet. Create one on the right or wait for /auth/signin partner signups.</p>
              ) : (
                <div className="space-y-3">
                  {vendors.map((v) => (
                    <div key={v.id} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <div className="text-sm font-bold text-white">{v.companyName}</div>
                          <div className="text-slate-400">
                            {v.city} • {v.contactEmail} • {v.phone || "No phone"} {v.gstin ? `• GSTIN: ${v.gstin}` : ""}
                          </div>
                          <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                            Lead: {v.leadDays}d • Warranty: {v.warrantyYears}y • Rating: ★{v.rating} • RateCards: {v.rateCards?.length || 0} • Quotes: {v._count?.quotesReceived || 0}
                          </div>
                        </div>
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            v.approvalStatus === "APPROVED"
                              ? "bg-emerald-500/20 text-emerald-300"
                              : v.approvalStatus === "PENDING"
                              ? "bg-amber-500/20 text-amber-300"
                              : "bg-red-500/20 text-red-300"
                          }`}
                        >
                          {v.approvalStatus}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800">
                        <button
                          onClick={() => patchVendor(v.id, { approvalStatus: "APPROVED" })}
                          className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Approve</span>
                        </button>
                        <button
                          onClick={() => patchVendor(v.id, { approvalStatus: "SUSPENDED" })}
                          className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold"
                        >
                          <Ban className="w-3.5 h-3.5" />
                          <span>Suspend</span>
                        </button>
                        <button
                          onClick={() => patchVendor(v.id, { approvalStatus: "REJECTED" })}
                          className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-red-500/20 border border-red-500/40 text-red-300 font-bold"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>
                        <label className="ml-auto flex items-center space-x-1 text-slate-400">
                          <span>Rating:</span>
                          <input
                            type="number"
                            step="0.1"
                            min="1"
                            max="5"
                            defaultValue={v.rating}
                            onBlur={(e) => patchVendor(v.id, { rating: Number(e.target.value) })}
                            className="w-16 px-2 py-1 bg-slate-900 border border-slate-700 rounded text-white font-mono"
                          />
                        </label>
                        <button
                          onClick={async () => {
                            if (!confirm(`Delete ${v.companyName}?`)) return;
                            await fetch(`/api/admin/vendors?id=${v.id}`, { method: "DELETE" });
                            loadAllAdminData();
                          }}
                          className="p-1.5 rounded-lg bg-red-500/15 text-red-300"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Direct Admin Vendor Onboard */}
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const res = await fetch("/api/admin/vendors", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ ...newVendor, approvalStatus: "APPROVED" }),
                });
                const j = await res.json();
                if (!res.ok) setStatusMsg(`Error: ${j.error}`);
                else {
                  setStatusMsg(`Onboarded verified vendor ${newVendor.companyName}`);
                  setNewVendor({ email: "", password: "", companyName: "", city: "", phone: "", gstin: "" });
                  loadAllAdminData();
                }
              }}
              className="lg:col-span-4 p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-3 h-fit"
            >
              <h3 className="text-sm font-bold text-white flex items-center space-x-1.5">
                <Plus className="w-4 h-4 text-amber-400" />
                <span>Onboard Approved Maker</span>
              </h3>
              <input
                type="text"
                required
                placeholder="Company Name *"
                value={newVendor.companyName}
                onChange={(e) => setNewVendor({ ...newVendor, companyName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
              />
              <input
                type="text"
                required
                placeholder="City / Hub *"
                value={newVendor.city}
                onChange={(e) => setNewVendor({ ...newVendor, city: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
              />
              <input
                type="email"
                required
                placeholder="Login Email *"
                value={newVendor.email}
                onChange={(e) => setNewVendor({ ...newVendor, email: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
              />
              <input
                type="password"
                required
                minLength={6}
                placeholder="Temp Password (6+ chars) *"
                value={newVendor.password}
                onChange={(e) => setNewVendor({ ...newVendor, password: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
              />
              <input
                type="text"
                placeholder="Phone / WhatsApp"
                value={newVendor.phone}
                onChange={(e) => setNewVendor({ ...newVendor, phone: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
              />
              <input
                type="text"
                placeholder="GSTIN"
                value={newVendor.gstin}
                onChange={(e) => setNewVendor({ ...newVendor, gstin: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl font-mono text-white"
              />
              <button type="submit" className="w-full py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold">
                Create & Approve Maker
              </button>
            </form>
          </div>
        )}

        {/* TAB 3: SPONSORED ADS NETWORK CONTROL */}
        {activeTab === "ads" && (
          <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 text-xs">
            <div>
              <h3 className="text-sm font-bold text-white">Sponsored Partner Ads, Bids & Budget Caps</h3>
              <p className="text-slate-400 mt-0.5">
                Approved makers with Active ads rank first in Buyer Quotes Drawer; clicks bill bid amounts against daily caps.
              </p>
            </div>
            <div className="space-y-3">
              {vendors.map((v) => {
                const ctr = v.adImpressions > 0 ? ((v.adClicks / v.adImpressions) * 100).toFixed(1) : "0.0";
                return (
                  <div key={v.id} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 grid grid-cols-1 lg:grid-cols-12 gap-3 items-center">
                    <div className="lg:col-span-4">
                      <div className="font-bold text-white">{v.companyName} ({v.approvalStatus})</div>
                      <div className="text-[11px] font-mono text-slate-400">
                        Impr: {v.adImpressions} • Clicks: {v.adClicks} ({ctr}% CTR) • Spend: ₹{v.adSpentMonth}
                      </div>
                    </div>
                    <div className="lg:col-span-3">
                      <label className="block text-[10px] text-slate-400 mb-0.5">Promo Headline</label>
                      <input
                        type="text"
                        defaultValue={v.adHeadline || ""}
                        placeholder="e.g. Zero Cost Site Visit"
                        onBlur={(e) => patchVendor(v.id, { adHeadline: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-white"
                      />
                    </div>
                    <div className="lg:col-span-2">
                      <label className="block text-[10px] text-slate-400 mb-0.5">Bid ₹ / Click</label>
                      <input
                        type="number"
                        defaultValue={v.sponsoredBidAmt}
                        onBlur={(e) => patchVendor(v.id, { sponsoredBidAmt: Number(e.target.value) })}
                        className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg font-mono text-amber-300"
                      />
                    </div>
                    <div className="lg:col-span-1">
                      <label className="block text-[10px] text-slate-400 mb-0.5">Cap ₹/d</label>
                      <input
                        type="number"
                        defaultValue={v.adDailyCap}
                        onBlur={(e) => patchVendor(v.id, { adDailyCap: Number(e.target.value) })}
                        className="w-full px-2 py-1.5 bg-slate-900 border border-slate-800 rounded-lg font-mono text-white"
                      />
                    </div>
                    <div className="lg:col-span-2 flex items-center justify-end space-x-2">
                      <button
                        onClick={() =>
                          patchVendor(v.id, {
                            isSponsored: !v.isSponsored,
                            adStatus: !v.isSponsored ? "ACTIVE" : "PAUSED",
                          })
                        }
                        className={`px-3 py-1.5 rounded-lg font-bold ${
                          v.isSponsored && v.adStatus === "ACTIVE"
                            ? "bg-amber-500 text-slate-950"
                            : "bg-slate-800 text-slate-300"
                        }`}
                      >
                        {v.isSponsored && v.adStatus === "ACTIVE" ? "Ad LIVE" : "Paused"}
                      </button>
                      <button
                        onClick={() => patchVendor(v.id, { adSpentMonth: 0, adStatus: "ACTIVE" })}
                        className="px-2 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-[10px]"
                        title="Reset spend"
                      >
                        Reset
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 4: USERS, ROLES, XP & MODERATION */}
        {activeTab === "users" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-xs">
            <div className="lg:col-span-8 p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
              <h3 className="text-sm font-bold text-white">All Users, Roles, XP & Access Control ({users.length})</h3>
              <div className="space-y-2.5">
                {users.map((u) => (
                  <div key={u.id} className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="font-bold text-white">
                        {u.name || u.email} <span className="font-mono text-[10px] text-slate-400">({u.email})</span>
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Designs: {u._count?.designs || 0} • Quotes: {u._count?.quotesSent || 0} • Status:{" "}
                        <strong className={u.status === "ACTIVE" ? "text-emerald-400" : "text-red-400"}>{u.status}</strong>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        value={u.role}
                        onChange={(e) => patchUser(u.id, { role: e.target.value })}
                        className="px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono"
                      >
                        <option value="BUYER">BUYER</option>
                        <option value="VENDOR">VENDOR</option>
                        <option value="ADMIN">ADMIN</option>
                      </select>
                      <input
                        type="number"
                        defaultValue={u.xp}
                        onBlur={(e) => patchUser(u.id, { xp: Number(e.target.value) })}
                        className="w-20 px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg font-mono text-emerald-400"
                        title="XP"
                      />
                      <button
                        onClick={() =>
                          patchUser(u.id, {
                            status: u.status === "ACTIVE" ? "BANNED" : "ACTIVE",
                            banReason: u.status === "ACTIVE" ? "Disabled by Admin" : null,
                          })
                        }
                        className={`px-2.5 py-1 rounded-lg font-bold ${
                          u.status === "ACTIVE" ? "bg-red-500/20 text-red-300" : "bg-emerald-500/20 text-emerald-300"
                        }`}
                      >
                        {u.status === "ACTIVE" ? "Ban" : "Restore"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const res = await fetch("/api/admin/users", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(newUser),
                });
                const j = await res.json();
                if (!res.ok) setStatusMsg(`Error: ${j.error}`);
                else {
                  setStatusMsg(`Created user ${newUser.email}`);
                  setNewUser({ email: "", password: "", name: "", role: "BUYER" });
                  loadAllAdminData();
                }
              }}
              className="lg:col-span-4 p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-3 h-fit"
            >
              <h3 className="text-sm font-bold text-white">+ Create Account</h3>
              <input
                type="text"
                required
                placeholder="Full Name"
                value={newUser.name}
                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
              />
              <input
                type="email"
                required
                placeholder="Email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
              />
              <input
                type="password"
                required
                minLength={6}
                placeholder="Password (6+ chars)"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
              />
              <select
                value={newUser.role}
                onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
              >
                <option value="BUYER">BUYER</option>
                <option value="ADMIN">ADMIN</option>
              </select>
              <button type="submit" className="w-full py-2.5 rounded-xl bg-cyan-500 text-slate-950 font-bold">
                Create User
              </button>
            </form>
          </div>
        )}

        {/* TAB 5: ELEMENTS + AI GENERATOR + IMAGE UPLOAD */}
        {activeTab === "elements" && (
          <AdminElementsPanel
            elements={elements}
            ollamaOnline={Boolean(ollama.online)}
            onRefresh={loadAllAdminData}
            onNotify={setStatusMsg}
          />
        )}

        {/* TAB 6: DESIGN ATTRIBUTES & SHADERS */}
        {activeTab === "attributes" && (
          <AdminAttributesPanel
            attributes={attributes}
            onRefresh={loadAllAdminData}
            onNotify={setStatusMsg}
          />
        )}

        {/* TAB 7: PRESETS, MISSIONS & GLOBAL RATES */}
        {activeTab === "presets" && (
          <AdminPresetsAndRatesPanel
            presets={presets}
            challenges={challenges}
            logisticsDefaults={logisticsDefaults}
            onRefresh={loadAllAdminData}
            onNotify={setStatusMsg}
          />
        )}

        {/* TAB 8: LOCAL 5,000+ WORD SEO ENGINE + HITL + PUSH LIVE */}
        {activeTab === "seo" && <AdminSeoEnginePanel onNotify={setStatusMsg} />}
      </main>
    </div>
  );
}
