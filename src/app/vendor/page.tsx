"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import {
  Building2,
  DollarSign,
  Sparkles,
  Save,
  ArrowLeft,
  Sliders,
  Inbox,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Send,
  ExternalLink,
  Clock,
  Shield,
  MessageSquare,
  Percent,
  Truck,
  Recycle,
  Lock,
  AlertTriangle,
  LogOut,
} from "lucide-react";
import { DEFAULT_VENDOR_LOGISTICS } from "@/lib/logisticsEngine";
import { VendorLogisticsSettings } from "@/types";

type VendorTab = "leads" | "rates" | "factory";

export default function VendorPortalPage() {
  const [activeTab, setActiveTab] = useState<VendorTab>("leads");
  const [authError, setAuthError] = useState<string | null>(null);
  const [selectedVendorId, setSelectedVendorId] = useState<string>("");
  const [allVendors, setAllVendors] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [masterElements, setMasterElements] = useState<any[]>([]);
  const [masterAttributes, setMasterAttributes] = useState<any[]>([]);
  const [rateCards, setRateCards] = useState<Record<string, number>>({});
  const [attributeMods, setAttributeMods] = useState<Record<string, number>>({});

  // Factory Profile Fields
  const [companyName, setCompanyName] = useState("");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [leadDays, setLeadDays] = useState(10);
  const [warrantyYears, setWarrantyYears] = useState(5);
  const [isSponsored, setIsSponsored] = useState(true);
  const [sponsoredBidAmt, setSponsoredBidAmt] = useState(45.0);
  const [logisticsSettings, setLogisticsSettings] = useState<VendorLogisticsSettings>(DEFAULT_VENDOR_LOGISTICS);

  // Leads & Quote Inbox
  const [quotes, setQuotes] = useState<any[]>([]);
  const [activeQuote, setActiveQuote] = useState<any>(null);
  const [replyText, setReplyText] = useState("");
  const [counterOffer, setCounterOffer] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const fetchVendorData = useCallback(async (vendorIdOverride?: string) => {
    try {
      setAuthError(null);
      const qs = vendorIdOverride ? `?vendorId=${vendorIdOverride}` : "";
      const [rateRes, quotesRes] = await Promise.all([
        fetch(`/api/vendor/rate-cards${qs}`),
        fetch(`/api/quotes${qs}`),
      ]);

      if (rateRes.status === 401 || rateRes.status === 403) {
        const errBody = await rateRes.json().catch(() => ({}));
        setAuthError(errBody.error || "Sign in with a Maker / Vendor or Admin account to open this console.");
        return;
      }

      const data = await rateRes.json();
      const qData = await quotesRes.json();

      if (data.allVendors) setAllVendors(data.allVendors);

      if (data.profile) {
        setProfile(data.profile);
        setSelectedVendorId(data.profile.id);
        setCompanyName(data.profile.companyName || "");
        setCity(data.profile.city || "");
        setPhone(data.profile.phone || "");
        setContactEmail(data.profile.contactEmail || "");
        setLeadDays(data.profile.leadDays || 12);
        setWarrantyYears(data.profile.warrantyYears || 5);
        setIsSponsored(Boolean(data.profile.isSponsored));
        setSponsoredBidAmt(data.profile.sponsoredBidAmt || 0);

        const cardMap: Record<string, number> = {};
        const modMap: Record<string, number> = {};
        data.profile.rateCards?.forEach((rc: any) => {
          if (rc.elementCode === "__VENDOR_LOGISTICS__") return;
          cardMap[rc.elementCode] = rc.baseUnitPrice;
          try {
            Object.assign(modMap, JSON.parse(rc.attributeModifiersJson || "{}"));
          } catch {}
        });

        setRateCards(cardMap);
        setAttributeMods(modMap);
      }

      if (data.logisticsSettings) {
        setLogisticsSettings({ ...DEFAULT_VENDOR_LOGISTICS, ...data.logisticsSettings });
      }

      setMasterElements(data.masterElements || []);
      setMasterAttributes(data.masterAttributes || []);

      const loadedQuotes = qData.quotes || [];
      setQuotes(loadedQuotes);
      if (loadedQuotes.length > 0) {
        setActiveQuote((prev: any) =>
          prev ? loadedQuotes.find((q: any) => q.id === prev.id) || loadedQuotes[0] : loadedQuotes[0]
        );
      } else {
        setActiveQuote(null);
      }
    } catch (err) {
      console.error("Error loading vendor data:", err);
    }
  }, []);

  useEffect(() => {
    fetchVendorData();
  }, [fetchVendorData]);

  const handleVendorSwitch = (newVendorId: string) => {
    setStatusMessage(null);
    setActiveQuote(null);
    fetchVendorData(newVendorId);
  };

  // Bulk Margin / Market Steel Adjuster (Real Fabricator Tool)
  const applyBulkMargin = (pctDelta: number) => {
    const multiplier = 1 + pctDelta / 100;
    const updated: Record<string, number> = {};
    masterElements.forEach((el) => {
      const curr = rateCards[el.code] !== undefined ? rateCards[el.code] : el.baseCost;
      updated[el.code] = Math.round((curr * multiplier) / 100) * 100;
    });
    setRateCards(updated);
    setStatusMessage(`Adjusted all unit rates by ${pctDelta > 0 ? "+" : ""}${pctDelta}%. Click Save to publish.`);
  };

  const handleSaveSettings = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    setStatusMessage(null);

    try {
      const rateCardUpdates = masterElements.map((el) => ({
        elementCode: el.code,
        baseUnitPrice: rateCards[el.code] !== undefined ? rateCards[el.code] : el.baseCost,
        attributeModifiersJson: JSON.stringify(attributeMods),
        leadTimeDays: leadDays,
        warrantyNotes: `${warrantyYears}-Yr Structural & Leak Warranty`,
      }));

      const res = await fetch("/api/vendor/rate-cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendorId: profile?.id,
          profileUpdates: {
            companyName,
            city,
            phone,
            contactEmail,
            leadDays,
            warrantyYears,
            isSponsored,
            sponsoredBidAmt,
          },
          rateCardUpdates,
          logisticsSettings,
        }),
      });

      if (res.ok) {
        setStatusMessage("Saved & live! Buyers comparing quotes in 3D Studio now see your updated prices.");
        await fetchVendorData(profile?.id);
      } else {
        setStatusMessage("Failed to save vendor settings.");
      }
    } catch (err: any) {
      setStatusMessage(`Error: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleQuoteAction = async (status?: string, quickText?: string) => {
    if (!activeQuote) return;
    const msg = quickText ?? replyText.trim();
    const offerNum = counterOffer ? parseInt(counterOffer.replace(/\D/g, ""), 10) : undefined;

    if (!msg && !offerNum && !status) return;

    try {
      const res = await fetch("/api/quotes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quoteId: activeQuote.id,
          sender: "VENDOR",
          messageText:
            msg ||
            (status === "ACCEPTED"
              ? `Offer accepted at ₹${activeQuote.negotiatedTotal.toLocaleString("en-IN")}! Ready for dispatch.`
              : status === "REJECTED"
              ? "Unable to fulfill at this target budget. Please revise."
              : `Revised quote: ₹${offerNum?.toLocaleString("en-IN")}`),
          offerAmount: offerNum,
          status,
        }),
      });
      const data = await res.json();
      if (data.quote) {
        setReplyText("");
        setCounterOffer("");
        await fetchVendorData(profile?.id);
      }
    } catch (err) {
      console.error("Failed to update quote:", err);
    }
  };

  // Sample 20ft Terrace Room Live Preview Price (20ft cabin + sliding door + panoramic window + Split AC + 18% GST)
  const samplePrice = Math.round(
    ((rateCards["CABIN_20FT"] ?? 185000) +
      (rateCards["DOOR_SLIDING_GLASS"] ?? 28000) +
      (rateCards["WINDOW_PANORAMIC"] ?? 21000) +
      (rateCards["AC_SPLIT_INVERTER"] ?? 38500) +
      (attributeMods["FINISH_DESERT_BEIGE"] ?? 2500)) *
      1.18
  );

  // Compute live ad rank among all vendors
  const rankedVendors = [...allVendors].sort((a, b) => {
    const aSp = a.id === profile?.id ? isSponsored : a.isSponsored;
    const bSp = b.id === profile?.id ? isSponsored : b.isSponsored;
    const aBid = a.id === profile?.id ? sponsoredBidAmt : a.sponsoredBidAmt;
    const bBid = b.id === profile?.id ? sponsoredBidAmt : b.sponsoredBidAmt;
    if (aSp && !bSp) return -1;
    if (!aSp && bSp) return 1;
    return bBid - aBid;
  });
  const myRank = rankedVendors.findIndex((v) => v.id === profile?.id) + 1;

  const pendingLeadCount = quotes.filter((q) => q.status === "PENDING" || q.status === "NEGOTIATING").length;
  const pipelineTotal = quotes.reduce((sum, q) => sum + (q.negotiatedTotal || 0), 0);

  let activeMessages: any[] = [];
  if (activeQuote?.messagesJson) {
    try {
      activeMessages = JSON.parse(activeQuote.messagesJson);
    } catch {}
  }
  const activeSiteSheet = activeMessages.find((m) => m.siteSheet)?.siteSheet || null;

  // Dynamic Grouping by MasterElement category (Admin additions appear immediately!)
  const elementGroups = [
    {
      label: "Cabins & Containers",
      items: masterElements.filter((el) => el.category === "CABIN"),
    },
    {
      label: "Doors & Windows",
      items: masterElements.filter((el) => el.category === "DOOR" || el.category === "WINDOW"),
    },
    {
      label: "AC, Solar, Bath, Stairs & Interiors",
      items: masterElements.filter((el) =>
        ["EQUIPMENT", "POD", "STAIRS"].includes(el.category)
      ),
    },
  ];

  if (authError) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full p-6 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="text-lg font-bold text-white">Maker / Vendor Portal</h1>
          <p className="text-xs text-slate-400">{authError}</p>
          <div className="flex justify-center gap-2 pt-2">
            <Link
              href="/auth/signin?tab=vendor"
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold text-xs"
            >
              Sign In / Apply as Maker
            </Link>
            <Link
              href="/"
              className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-200 text-xs font-semibold"
            >
              3D Studio
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-16">
      {/* Top Bar */}
      <header className="border-b border-slate-800 bg-slate-900/85 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <a
              href="/"
              className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white transition"
              title="Back to 3D Studio"
            >
              <ArrowLeft className="w-4 h-4" />
            </a>
            <div className="flex items-center space-x-2">
              <Building2 className="w-5 h-5 text-amber-400" />
              <div>
                <h1 className="text-sm sm:text-base font-bold text-white leading-tight">
                  {companyName || "Maker & Vendor Console"}
                </h1>
                <div className="text-[10px] text-slate-400 hidden sm:block">
                  Manage live buyer quotes, factory pricing & featured ad rank
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {allVendors.length > 1 && profile && (
              <select
                aria-label="Select vendor account"
                value={selectedVendorId}
                onChange={(e) => handleVendorSwitch(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white font-semibold focus:outline-none focus:border-amber-400"
              >
                {allVendors.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.companyName} ({v.city.split("/")[0].trim()})
                  </option>
                ))}
              </select>
            )}

            <button
              type="button"
              onClick={() => handleSaveSettings()}
              disabled={isSaving || !profile}
              className="hidden sm:flex items-center space-x-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-bold text-xs transition shadow-md disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? "Saving..." : "Publish Rates"}</span>
            </button>
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
        {profile && profile.approvalStatus !== "APPROVED" && (
          <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/40 text-xs text-amber-200 flex items-center space-x-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>Account Status: {profile.approvalStatus}.</strong> You can pre-configure your rate cards and logistics now. Buyers will see your quotes once Admin approves your factory.
              {profile.approvalNotes ? ` Note: ${profile.approvalNotes}` : ""}
            </span>
          </div>
        )}
        {statusMessage && (
          <div className="p-3.5 rounded-2xl bg-slate-900 border border-emerald-500/50 text-xs text-emerald-300 font-medium flex items-center justify-between">
            <span>{statusMessage}</span>
            <button onClick={() => setStatusMessage(null)} className="text-slate-400 hover:text-white px-2">
              ×
            </button>
          </div>
        )}

        {/* Top Fabricator KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
            <div className="text-[11px] text-slate-400 font-medium">Open Customer Leads</div>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-2xl font-black font-mono text-emerald-400">{pendingLeadCount}</span>
              <span className="text-[11px] text-slate-400 font-mono">
                ₹{(pipelineTotal / 100000).toFixed(1)}L pipeline
              </span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
            <div className="text-[11px] text-slate-400 font-medium">Sample 160 sq.ft Room Quote</div>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-2xl font-black font-mono text-white">
                ₹{samplePrice.toLocaleString("en-IN")}
              </span>
              <span className="text-[10px] text-slate-400">incl. GST</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
            <div className="text-[11px] text-slate-400 font-medium">Quote Drawer Rank</div>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-2xl font-black font-mono text-amber-400">
                #{myRank || 1} <span className="text-xs font-normal text-slate-400">of {allVendors.length || 4}</span>
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isSponsored ? "bg-amber-500/20 text-amber-300" : "bg-slate-800 text-slate-400"}`}>
                {isSponsored ? "FEATURED" : "ORGANIC"}
              </span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
            <div className="text-[11px] text-slate-400 font-medium">Dispatch SLA & Warranty</div>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-xl font-black font-mono text-cyan-400">{leadDays} Days</span>
              <span className="text-xs font-semibold text-emerald-400">{warrantyYears} Yr Warranty</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
          <button
            onClick={() => setActiveTab("leads")}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === "leads"
                ? "bg-emerald-500 text-slate-950 shadow-lg"
                : "bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800"
            }`}
          >
            <Inbox className="w-4 h-4" />
            <span>Leads & Quotes ({quotes.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("rates")}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === "rates"
                ? "bg-emerald-500 text-slate-950 shadow-lg"
                : "bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800"
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>Rate Cards & Margin</span>
          </button>

          <button
            onClick={() => setActiveTab("factory")}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === "factory"
                ? "bg-emerald-500 text-slate-950 shadow-lg"
                : "bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800"
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Factory Profile & Ad Boost</span>
          </button>
        </div>

        {/* TAB 1: CUSTOMER LEADS & NEGOTIATION INBOX */}
        {activeTab === "leads" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Lead List */}
            <div className="space-y-3">
              {quotes.length === 0 ? (
                <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 text-center text-xs text-slate-400">
                  No quote requests for this maker yet. Buyers requesting callbacks in 3D Studio appear here!
                </div>
              ) : (
                quotes.map((q) => (
                  <button
                    key={q.id}
                    onClick={() => setActiveQuote(q)}
                    className={`w-full text-left p-4 rounded-2xl border transition ${
                      activeQuote?.id === q.id
                        ? "border-emerald-400 bg-emerald-950/20 shadow-lg"
                        : "border-slate-800 bg-slate-900 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-white truncate">
                        {q.buyer?.name || "Home Buyer"}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          q.status === "ACCEPTED"
                            ? "bg-emerald-500/20 text-emerald-300"
                            : q.status === "REJECTED"
                            ? "bg-red-500/20 text-red-300"
                            : q.status === "NEGOTIATING"
                            ? "bg-amber-500/20 text-amber-300"
                            : "bg-cyan-500/20 text-cyan-300"
                        }`}
                      >
                        {q.status}
                      </span>
                    </div>
                    <div className="text-xs text-slate-300 truncate">{q.design?.title || "Custom Room"}</div>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/80 text-xs">
                      <span className="font-mono font-bold text-emerald-400">
                        ₹{(q.negotiatedTotal || 0).toLocaleString("en-IN")}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {new Date(q.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>

            {/* Right Active Deal Room */}
            <div className="lg:col-span-2">
              {activeQuote ? (
                <div className="rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden flex flex-col h-[560px]">
                  <div className="p-4 border-b border-slate-800 bg-slate-900/60 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="text-sm font-bold text-white">{activeQuote.design?.title}</h3>
                        {activeQuote.design?.slug && (
                          <a
                            href={`/design/${activeQuote.design.slug}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center space-x-1 text-[11px] px-2 py-0.5 rounded-lg bg-cyan-500/15 text-cyan-300 hover:bg-cyan-500/25 transition"
                          >
                            <span>Inspect 3D Spec</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        Buyer: <strong className="text-slate-200">{activeQuote.buyer?.name}</strong> • Target:{" "}
                        <strong className="text-emerald-400 font-mono">
                          ₹{(activeQuote.negotiatedTotal || 0).toLocaleString("en-IN")}
                        </strong>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => handleQuoteAction("ACCEPTED")}
                        className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Accept Deal</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuoteAction("REJECTED")}
                        className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-red-950/60 hover:bg-red-900 border border-red-800 text-red-200 font-semibold text-xs transition"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Decline</span>
                      </button>
                    </div>
                  </div>

                  {/* Customer Contact & Site Delivery Sheet (when submitted) */}
                  {activeSiteSheet && (
                    <div className="px-4 py-3 bg-slate-950/80 border-b border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="space-y-1">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                          Customer Contact
                        </div>
                        <div className="font-bold text-white">
                          {activeSiteSheet.customerContact?.fullName || activeQuote.buyer?.name}
                        </div>
                        <div className="flex items-center space-x-2 font-mono text-cyan-300">
                          {activeSiteSheet.customerContact?.phone && (
                            <>
                              <a
                                href={`tel:${activeSiteSheet.customerContact.phone}`}
                                className="underline hover:text-white"
                              >
                                {activeSiteSheet.customerContact.phone}
                              </a>
                              <span>•</span>
                              <a
                                href={`https://wa.me/91${activeSiteSheet.customerContact.phone.replace(/\D/g, "")}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-emerald-400 underline hover:text-emerald-300"
                              >
                                WhatsApp
                              </a>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                            {activeSiteSheet.logistics?.deliveryMode === "SELF_PICKUP"
                              ? "SELF-PICKUP AT YARD"
                              : "DELIVERY LOCATION"}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                            {activeSiteSheet.logistics?.condition || "NEW"}
                          </span>
                        </div>
                        {activeSiteSheet.logistics?.deliveryMode === "SELF_PICKUP" ? (
                          <div className="text-slate-300 text-[11px]">
                            Customer will bring own trailer to factory yard (₹0 freight/crane)
                          </div>
                        ) : (
                          <>
                            <div className="text-white text-[11px] truncate">
                              {activeSiteSheet.customerContact?.addressLine},{" "}
                              {activeSiteSheet.customerContact?.city} -{" "}
                              <span className="font-mono">{activeSiteSheet.customerContact?.pincode}</span>
                            </div>
                            <div className="text-[10px] text-slate-400">
                              Floor: <strong className="text-slate-200">{activeSiteSheet.logistics?.placementLevel}</strong> •{" "}
                              Road: <strong className="text-slate-200">{activeSiteSheet.logistics?.roadWidth}</strong> •{" "}
                              Method: <strong className="text-slate-200">{activeSiteSheet.logistics?.deliveryMode}</strong>
                            </div>
                            {typeof activeSiteSheet.customerContact?.latitude === "number" &&
                              typeof activeSiteSheet.customerContact?.longitude === "number" && (
                                <div className="flex flex-wrap items-center gap-2 pt-0.5 text-[10px]">
                                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 font-mono text-emerald-300">
                                    GPS: {activeSiteSheet.customerContact.latitude.toFixed(5)},{" "}
                                    {activeSiteSheet.customerContact.longitude.toFixed(5)}
                                    {activeSiteSheet.customerContact.locationAccuracyM
                                      ? ` (±${activeSiteSheet.customerContact.locationAccuracyM}m)`
                                      : ""}
                                  </span>
                                  <a
                                    href={`https://maps.google.com/?q=${activeSiteSheet.customerContact.latitude},${activeSiteSheet.customerContact.longitude}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-1.5 py-0.5 rounded bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/25 font-semibold"
                                  >
                                    Open Pin ↗
                                  </a>
                                </div>
                              )}
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Conversation History */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {activeMessages.length === 0 ? (
                      <div className="text-center text-xs text-slate-500 py-8">
                        Customer requested callback. Send your opening offer below.
                      </div>
                    ) : (
                      activeMessages.map((m, idx) => (
                        <div
                          key={idx}
                          className={`flex flex-col ${m.sender === "VENDOR" ? "items-end" : "items-start"}`}
                        >
                          <div
                            className={`max-w-[80%] p-3 rounded-2xl text-xs leading-relaxed ${
                              m.sender === "VENDOR"
                                ? "bg-amber-500 text-slate-950 font-medium rounded-tr-none"
                                : "bg-slate-800 text-slate-100 rounded-tl-none border border-slate-700"
                            }`}
                          >
                            {m.text}
                            {m.offerAmount && (
                              <div className="mt-1 pt-1 border-t border-black/20 font-mono font-bold">
                                Offer: ₹{Number(m.offerAmount).toLocaleString("en-IN")}
                              </div>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-500 mt-0.5 px-1">
                            {m.sender} • {new Date(m.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Quick Vendor Templates + Reply Form */}
                  <div className="p-4 border-t border-slate-800 bg-slate-950/60 space-y-2.5">
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        "We can deliver in 10 days with free crane offload",
                        "Please share your site pin code for free visit",
                        "5-Yr leakproof & heat insulation warranty included",
                      ].map((tpl) => (
                        <button
                          key={tpl}
                          type="button"
                          onClick={() => handleQuoteAction("NEGOTIATING", tpl)}
                          className="text-[11px] px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 transition"
                        >
                          + {tpl}
                        </button>
                      ))}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        placeholder="Counter-offer ₹ (e.g. 345000)"
                        value={counterOffer}
                        onChange={(e) => setCounterOffer(e.target.value)}
                        className="sm:w-48 px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-amber-400"
                      />
                      <input
                        type="text"
                        placeholder="Write reply to customer..."
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                      />
                      <button
                        type="button"
                        onClick={() => handleQuoteAction("NEGOTIATING")}
                        className="flex items-center justify-center space-x-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Send</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-[400px] rounded-3xl bg-slate-900 border border-slate-800 flex flex-col items-center justify-center text-slate-500 text-xs space-y-2">
                  <MessageSquare className="w-8 h-8 text-slate-700" />
                  <span>Select a customer inquiry on the left to inspect & quote</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: RATE CARDS & QUICK MARGIN CONTROLS */}
        {activeTab === "rates" && (
          <div className="space-y-6">
            {/* Bulk Steel / Margin Bar */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center space-x-2 text-xs">
                <Percent className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-white">Bulk Steel & Margin Adjuster:</span>
                <span className="text-slate-400 hidden sm:inline">Update all element rates in 1 click</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => applyBulkMargin(-10)}
                  className="px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-bold transition"
                >
                  -10% Festive Offer
                </button>
                <button
                  type="button"
                  onClick={() => applyBulkMargin(-5)}
                  className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 text-xs font-semibold transition"
                >
                  -5% Competitive
                </button>
                <button
                  type="button"
                  onClick={() => applyBulkMargin(5)}
                  className="px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-semibold transition"
                >
                  +5% Steel Surge
                </button>
              </div>
            </div>

            {/* Grouped Element Rates */}
            {elementGroups.map((group) => {
              const groupEls = group.items;
              if (groupEls.length === 0) return null;

              return (
                <div key={group.label} className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
                  <h2 className="text-sm font-bold text-white border-b border-slate-800 pb-2">
                    {group.label}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {groupEls.map((el) => {
                      const currentPrice = rateCards[el.code] !== undefined ? rateCards[el.code] : el.baseCost;
                      return (
                        <div
                          key={el.id}
                          className="p-3.5 rounded-2xl bg-slate-800/40 border border-slate-700/60 flex items-center justify-between gap-2"
                        >
                          <div className="overflow-hidden">
                            <div className="text-xs font-bold text-white truncate">{el.name}</div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              Market Base: ₹{el.baseCost.toLocaleString("en-IN")}
                            </div>
                          </div>
                          <div className="flex items-center space-x-1.5 w-32 shrink-0">
                            <span className="text-xs text-slate-400">₹</span>
                            <input
                              type="number"
                              value={currentPrice}
                              onChange={(e) =>
                                setRateCards({
                                  ...rateCards,
                                  [el.code]: parseFloat(e.target.value) || 0,
                                })
                              }
                              className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono font-bold text-emerald-400 text-right focus:outline-none focus:border-emerald-400"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Attribute Upcharge Modifiers */}
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex items-center space-x-2 border-b border-slate-800 pb-2">
                <Sliders className="w-4 h-4 text-cyan-400" />
                <h2 className="text-sm font-bold text-white">Glass, Frame & Paint Upcharges</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {masterAttributes.map((attr) => {
                  const currentMod =
                    attributeMods[attr.code] !== undefined ? attributeMods[attr.code] : attr.costModifier;
                  return (
                    <div
                      key={attr.id}
                      className="p-3.5 rounded-2xl bg-slate-800/40 border border-slate-700/60 flex items-center justify-between gap-2"
                    >
                      <div className="overflow-hidden">
                        <div className="text-xs font-bold text-white truncate">{attr.name}</div>
                        <div className="text-[10px] text-slate-400">
                          {attr.category.replace("_", " ")} {attr.brand && `• ${attr.brand}`}
                        </div>
                      </div>
                      <div className="flex items-center space-x-1 w-28 shrink-0">
                        <span className="text-xs text-slate-400">+₹</span>
                        <input
                          type="number"
                          value={currentMod}
                          onChange={(e) =>
                            setAttributeMods({
                              ...attributeMods,
                              [attr.code]: parseFloat(e.target.value) || 0,
                            })
                          }
                          className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono font-bold text-cyan-400 text-right focus:outline-none focus:border-cyan-400"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => handleSaveSettings()}
                disabled={isSaving}
                className="flex items-center space-x-2 py-3 px-8 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-bold text-sm transition shadow-xl disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? "Saving..." : "Save & Publish Rate Cards"}</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: FACTORY PROFILE & SPONSORED AD LEADERBOARD */}
        {activeTab === "factory" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-5">
              <h2 className="text-sm font-bold text-white border-b border-slate-800 pb-3">
                Factory Details & Delivery SLA
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Company / Factory Name</label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-400"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Delivery Hub / City</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-400"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Phone / WhatsApp Number</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-emerald-400"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Sales Email</label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-400"
                  />
                </div>
                <div>
                  <label className="flex items-center space-x-1 text-xs text-slate-400 mb-1">
                    <Clock className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Delivery Lead Time (Days)</span>
                  </label>
                  <input
                    type="number"
                    value={leadDays}
                    onChange={(e) => setLeadDays(parseInt(e.target.value, 10) || 10)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-cyan-300 font-mono font-bold focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="flex items-center space-x-1 text-xs text-slate-400 mb-1">
                    <Shield className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Warranty (Years)</span>
                  </label>
                  <input
                    type="number"
                    value={warrantyYears}
                    onChange={(e) => setWarrantyYears(parseInt(e.target.value, 10) || 5)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-emerald-300 font-mono font-bold focus:outline-none focus:border-emerald-400"
                  />
                </div>
              </div>

              {/* Sponsored Ad Controls */}
              <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/30 grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-amber-300 flex items-center space-x-1.5">
                      <Sparkles className="w-4 h-4" />
                      <span>Featured Partner Ad Boost</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Pin your factory at top of buyer quote drawer
                    </div>
                  </div>
                  <button
                    type="button"
                    aria-label="Toggle Featured Partner Boost"
                    onClick={() => setIsSponsored(!isSponsored)}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                      isSponsored ? "bg-amber-500" : "bg-slate-700"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg transition ${
                        isSponsored ? "translate-x-4" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                <div>
                  <label className="block text-xs text-amber-200 mb-1">Bid Amount (₹ / Lead)</label>
                  <input
                    type="number"
                    value={sponsoredBidAmt}
                    onChange={(e) => setSponsoredBidAmt(parseFloat(e.target.value) || 0)}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-amber-500/40 rounded-xl text-xs text-amber-300 font-mono font-bold focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {/* Transport, Crane & Knock-Down Flat-Pack Rates */}
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center space-x-2 text-xs font-bold text-cyan-300">
                    <Truck className="w-4 h-4" />
                    <span>Transport, Crane & Narrow-Lane Flat-Pack Rates</span>
                  </div>
                  <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={logisticsSettings.knockDownSupported}
                      onChange={(e) =>
                        setLogisticsSettings({ ...logisticsSettings, knockDownSupported: e.target.checked })
                      }
                      className="rounded border-slate-700 bg-slate-900 text-cyan-500"
                    />
                    <span>Supports Knock-Down Flat-Pack</span>
                  </label>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">20ft Trailer (₹/km)</label>
                    <input
                      type="number"
                      value={logisticsSettings.transportPerKm20ft}
                      onChange={(e) =>
                        setLogisticsSettings({
                          ...logisticsSettings,
                          transportPerKm20ft: Number(e.target.value) || 0,
                        })
                      }
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl font-mono text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">40ft Trailer (₹/km)</label>
                    <input
                      type="number"
                      value={logisticsSettings.transportPerKm40ft}
                      onChange={(e) =>
                        setLogisticsSettings({
                          ...logisticsSettings,
                          transportPerKm40ft: Number(e.target.value) || 0,
                        })
                      }
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl font-mono text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Ground Hydra Crane (₹)</label>
                    <input
                      type="number"
                      value={logisticsSettings.craneGroundFee}
                      onChange={(e) =>
                        setLogisticsSettings({
                          ...logisticsSettings,
                          craneGroundFee: Number(e.target.value) || 0,
                        })
                      }
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl font-mono text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Terrace 20T Crane (₹)</label>
                    <input
                      type="number"
                      value={logisticsSettings.craneTerraceFee}
                      onChange={(e) =>
                        setLogisticsSettings({
                          ...logisticsSettings,
                          craneTerraceFee: Number(e.target.value) || 0,
                        })
                      }
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl font-mono text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Flat-Pack Pickup (₹/km)</label>
                    <input
                      type="number"
                      value={logisticsSettings.knockDownPerKm}
                      onChange={(e) =>
                        setLogisticsSettings({
                          ...logisticsSettings,
                          knockDownPerKm: Number(e.target.value) || 0,
                        })
                      }
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl font-mono text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">On-Site Bolt Assembly (₹)</label>
                    <input
                      type="number"
                      value={logisticsSettings.knockDownAssemblyFee}
                      onChange={(e) =>
                        setLogisticsSettings({
                          ...logisticsSettings,
                          knockDownAssemblyFee: Number(e.target.value) || 0,
                        })
                      }
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl font-mono text-white"
                    />
                  </div>
                </div>
              </div>

              {/* 2nd Hand / Refurbished Yard Stock */}
              <div className="p-4 rounded-2xl bg-emerald-950/15 border border-emerald-500/30 space-y-4">
                <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2">
                  <div className="flex items-center space-x-2 text-xs font-bold text-emerald-300">
                    <Recycle className="w-4 h-4" />
                    <span>2nd Hand / Refurbished Yard Stock</span>
                  </div>
                  <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={logisticsSettings.sellsRefurbished}
                      onChange={(e) =>
                        setLogisticsSettings({ ...logisticsSettings, sellsRefurbished: e.target.checked })
                      }
                      className="rounded border-slate-700 bg-slate-900 text-emerald-500"
                    />
                    <span>Sells Refurbished / Used</span>
                  </label>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Refurbished Off (%)</label>
                    <input
                      type="number"
                      value={logisticsSettings.refurbDiscountPct}
                      onChange={(e) =>
                        setLogisticsSettings({
                          ...logisticsSettings,
                          refurbDiscountPct: Number(e.target.value) || 0,
                        })
                      }
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl font-mono text-emerald-300"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Used WWT Off (%)</label>
                    <input
                      type="number"
                      value={logisticsSettings.usedWwtDiscountPct}
                      onChange={(e) =>
                        setLogisticsSettings({
                          ...logisticsSettings,
                          usedWwtDiscountPct: Number(e.target.value) || 0,
                        })
                      }
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl font-mono text-emerald-300"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Used Yard Stock (Qty)</label>
                    <input
                      type="number"
                      value={logisticsSettings.refurbStockCount}
                      onChange={(e) =>
                        setLogisticsSettings({
                          ...logisticsSettings,
                          refurbStockCount: Number(e.target.value) || 0,
                        })
                      }
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl font-mono text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Used Warranty (Yrs)</label>
                    <input
                      type="number"
                      value={logisticsSettings.refurbWarrantyYears}
                      onChange={(e) =>
                        setLogisticsSettings({
                          ...logisticsSettings,
                          refurbWarrantyYears: Number(e.target.value) || 0,
                        })
                      }
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl font-mono text-white"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => handleSaveSettings()}
                  disabled={isSaving}
                  className="flex items-center space-x-2 py-2.5 px-6 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-bold text-xs transition"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? "Saving..." : "Save Profile & Boost"}</span>
                </button>
              </div>
            </div>

            {/* Live Competitor Bid Leaderboard */}
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-3">
                Live Ad Rank Leaderboard
              </h3>
              <div className="space-y-2.5">
                {rankedVendors.map((v, idx) => {
                  const isMe = v.id === profile?.id;
                  const sp = isMe ? isSponsored : v.isSponsored;
                  const bid = isMe ? sponsoredBidAmt : v.sponsoredBidAmt;
                  return (
                    <div
                      key={v.id}
                      className={`p-3 rounded-2xl border flex items-center justify-between text-xs ${
                        isMe ? "border-amber-400/60 bg-amber-500/10" : "border-slate-800 bg-slate-950/50"
                      }`}
                    >
                      <div>
                        <div className="font-bold text-white flex items-center space-x-1.5">
                          <span className="font-mono text-amber-400">#{idx + 1}</span>
                          <span>{v.companyName}</span>
                          {isMe && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                              YOU
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {sp ? "Featured Ad Active" : "Organic Listing"}
                        </div>
                      </div>
                      <div className="font-mono font-bold text-amber-300">₹{bid}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
