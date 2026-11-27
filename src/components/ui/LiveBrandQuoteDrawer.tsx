"use client";

import { ExactLocationPicker } from "./ExactLocationPicker";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useStudioStore } from "@/store/useStudioStore";
import {
  X,
  Tag,
  Star,
  Clock,
  Shield,
  Sparkles,
  ArrowUpDown,
  Send,
  Building2,
  Check,
  PhoneCall,
  Loader2,
  MapPin,
  User,
  Truck,
} from "lucide-react";

interface VendorQuote {
  vendorId: string;
  companyName: string;
  city: string;
  phone?: string;
  rating: number;
  leadDays: number;
  warrantyYears: number;
  isSponsored: boolean;
  sponsoredBidAmt?: number;
  adHeadline?: string | null;
  subtotal?: number;
  tax?: number;
  transportCost?: number;
  craneOrAssemblyCost?: number;
  totalCost: number;
  savingsVsBase: number;
  knockDownSupported?: boolean;
  sellsRefurbished?: boolean;
  refurbStockCount?: number;
  features: string[];
}

export const LiveBrandQuoteDrawer: React.FC = () => {
  const activeDrawer = useStudioStore((state) => state.activeDrawer);
  const setActiveDrawer = useStudioStore((state) => state.setActiveDrawer);
  const cabins = useStudioStore((state) => state.cabins);
  const equipment = useStudioStore((state) => state.equipment);
  const environment = useStudioStore((state) => state.environment);
  const dayNight = useStudioStore((state) => state.dayNight);
  const logistics = useStudioStore((state) => state.logistics);
  const updateLogistics = useStudioStore((state) => state.updateLogistics);
  const customerContact = useStudioStore((state) => state.customerContact);
  const updateCustomerContact = useStudioStore((state) => state.updateCustomerContact);
  const getBom = useStudioStore((state) => state.getBom);

  const bom = getBom();

  const [vendorQuotes, setVendorQuotes] = useState<VendorQuote[]>([]);
  const [isLoadingQuotes, setIsLoadingQuotes] = useState(false);
  const [sortBy, setSortBy] = useState<"price" | "timeline" | "warranty">("price");
  const [activeVendorId, setActiveVendorId] = useState<string | null>(null);
  const [activeQuoteId, setActiveQuoteId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<
    Array<{ sender: "buyer" | "vendor"; text: string; time: string; offer?: number }>
  >([]);
  const [inputText, setInputText] = useState("");
  const [offerInput, setOfferInput] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [needsAuth, setNeedsAuth] = useState(false);
  const [accountPassword, setAccountPassword] = useState("");

  // Fetch live SQLite-calculated quotes whenever drawer opens or logistics/scene changes
  useEffect(() => {
    if (activeDrawer !== "quotes") return;

    let cancelled = false;
    setIsLoadingQuotes(true);

    fetch("/api/quotes/compare", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cabins, equipment, logistics }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        const rawQuotes: any[] = data.quotes || [];
        const baseline = bom.totalCost || 1;
        setVendorQuotes(
          rawQuotes.map((q) => ({
            ...q,
            savingsVsBase: baseline - q.totalCost,
          }))
        );
      })
      .catch((err) => console.error("Compare quotes error:", err))
      .finally(() => {
        if (!cancelled) setIsLoadingQuotes(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activeDrawer, cabins, equipment, logistics, bom.totalCost]);

  const activeVendor = vendorQuotes.find((v) => v.vendorId === activeVendorId) || null;

  const sortedQuotes = [...vendorQuotes].sort((a, b) => {
    if (a.isSponsored && !b.isSponsored) return -1;
    if (!a.isSponsored && b.isSponsored) return 1;
    if (a.isSponsored && b.isSponsored && (b.sponsoredBidAmt || 0) !== (a.sponsoredBidAmt || 0)) {
      if (sortBy === "price") {
        return (b.sponsoredBidAmt || 0) - (a.sponsoredBidAmt || 0);
      }
    }
    if (sortBy === "price") return a.totalCost - b.totalCost;
    if (sortBy === "timeline") return a.leadDays - b.leadDays;
    if (sortBy === "warranty") return b.warrantyYears - a.warrantyYears;
    return 0;
  });

  const handleStartInquiry = (vendor: VendorQuote) => {
    setActiveVendorId(vendor.vendorId);
    setActiveQuoteId(null);
    setFormError(null);
    setNeedsAuth(false);
    setChatMessages([]);
    if (vendor.isSponsored) {
      fetch("/api/quotes/track-ad", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vendorId: vendor.vendorId }),
      }).catch(() => {});
    }
  };

  const handleSubmitQuoteForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeVendor) return;
    setFormError(null);

    if (!customerContact.fullName.trim() || !customerContact.phone.trim()) {
      setFormError("Please enter your Name and Phone/WhatsApp number.");
      return;
    }

    if (
      logistics.deliveryMode !== "SELF_PICKUP" &&
      (!customerContact.city.trim() || !customerContact.pincode.trim() || !customerContact.addressLine.trim())
    ) {
      setFormError("Please enter City, PIN Code, and Address for delivery (or choose Self-Pickup).");
      return;
    }

    setIsSending(true);
    const offerVal = offerInput ? parseInt(offerInput.replace(/\D/g, ""), 10) : undefined;
    const isSelfPickup = logistics.deliveryMode === "SELF_PICKUP";
    const floorLabel =
      logistics.placementLevel === "TERRACE"
        ? "Top Terrace"
        : logistics.placementLevel === "MID_FLOOR"
        ? "1st/2nd Floor"
        : "On Ground";

    const gpsNote =
      typeof customerContact.latitude === "number" && typeof customerContact.longitude === "number"
        ? ` [GPS: ${customerContact.latitude.toFixed(5)}, ${customerContact.longitude.toFixed(5)}]`
        : "";

    const summaryText = isSelfPickup
      ? `Actual Quote Request — SELF-PICKUP at yard | Contact: ${customerContact.fullName} (${customerContact.phone})${
          inputText.trim() ? ` | Note: ${inputText.trim()}` : ""
        }`
      : `Actual Quote Request — ${customerContact.addressLine}, ${customerContact.city} - ${customerContact.pincode}${gpsNote} (${floorLabel}, ${
          logistics.roadWidth === "NARROW" ? "<12ft Lane" : "Wide Road"
        }, ${logistics.deliveryMode === "KNOCK_DOWN" ? "Flat-Pack" : "Truck+Crane"}) | Contact: ${
          customerContact.fullName
        } (${customerContact.phone})${inputText.trim() ? ` | Note: ${inputText.trim()}` : ""}`;

    try {
      const payload = {
        vendorId: activeVendor.vendorId,
        negotiatedTotal: offerVal || activeVendor.totalCost,
        offerAmount: offerVal,
        messageText: summaryText,
        designTitle: `${cabins.length || 1}-Module Room (${customerContact.city || "Self-Pickup"})`,
        sceneJson: { environment, dayNight, cabins, equipment, logistics },
        bomJson: bom,
        customerContact,
        logistics,
      };

      let res = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.status === 401) {
        if (!customerContact.email.trim() || accountPassword.length < 6) {
          setNeedsAuth(true);
          throw new Error("Please enter Email and create/enter a 6+ char Password below to submit your inquiry.");
        }
        // Try creating account (ignores 409 conflict if already exists), then signIn
        await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: customerContact.email.trim(),
            password: accountPassword,
            name: customerContact.fullName.trim(),
            phone: customerContact.phone.trim(),
            accountType: "BUYER",
          }),
        });
        const signRes = await signIn("credentials", {
          email: customerContact.email.trim(),
          password: accountPassword,
          redirect: false,
        });
        if (signRes?.error) {
          setNeedsAuth(true);
          throw new Error(signRes.error);
        }
        res = await fetch("/api/quotes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send request");
      setNeedsAuth(false);

      setActiveQuoteId(data.quote.id);
      setChatMessages([
        {
          sender: "buyer",
          text: summaryText,
          time: "Just now",
          offer: offerVal,
        },
        {
          sender: "vendor",
          text: `Thank you ${customerContact.fullName}! ${activeVendor.companyName} received your exact site details. Our engineer will verify access & call ${customerContact.phone} with your final quote.`,
          time: "Just now",
        },
      ]);
      setInputText("");
      setOfferInput("");
    } catch (err: any) {
      setFormError(err.message || "Could not submit quote request");
    } finally {
      setIsSending(false);
    }
  };

  const handleFollowUpMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeQuoteId || !inputText.trim()) return;
    const text = inputText.trim();
    setInputText("");
    setChatMessages((prev) => [...prev, { sender: "buyer", text, time: "Just now" }]);
    setIsSending(true);
    try {
      await fetch("/api/quotes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quoteId: activeQuoteId,
          sender: "BUYER",
          messageText: text,
        }),
      });
    } catch {} finally {
      setIsSending(false);
    }
  };

  if (activeDrawer !== "quotes") return null;

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full sm:w-[480px] bg-slate-900/95 backdrop-blur-xl border-l border-slate-700/80 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
      <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/60">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <Tag className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">
              {activeVendor ? "Get Actual Final Price" : "Compare Local Makers"}
            </h2>
            <div className="text-[11px] text-emerald-300">
              {activeVendor
                ? activeVendor.companyName
                : "Live factory rates • Waterproof • 3–7 Yr Warranty"}
            </div>
          </div>
        </div>
        <button
          onClick={() => setActiveDrawer(null)}
          aria-label="Close quotes drawer"
          className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {activeVendor ? (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top Live Price Banner */}
          <div className="p-3.5 bg-slate-800/60 border-b border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-[11px] text-emerald-400 font-semibold">
                {logistics.deliveryMode === "SELF_PICKUP"
                  ? "Ex-Factory Self-Pickup Price"
                  : `Landed Estimate (${logistics.placementLevel === "TERRACE" ? "Top Terrace" : logistics.placementLevel === "MID_FLOOR" ? "1st/2nd Flr" : "Ground"})`}
              </div>
              <div className="text-lg font-black font-mono text-white">
                ₹{activeVendor.totalCost.toLocaleString("en-IN")}
              </div>
            </div>
            <button
              onClick={() => setActiveVendorId(null)}
              className="text-xs text-slate-300 hover:text-white px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 transition"
            >
              ← All Makers
            </button>
          </div>

          {!activeQuoteId ? (
            // Structured Actual Quote Intake Form
            <form onSubmit={handleSubmitQuoteForm} className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
              {formError && (
                <div className="p-3 rounded-xl bg-red-950/50 border border-red-700 text-red-200 text-xs">
                  {formError}
                </div>
              )}

              {/* 1. Customer Contact */}
              <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2.5">
                <div className="flex items-center space-x-1.5 font-bold text-white">
                  <User className="w-3.5 h-3.5 text-emerald-400" />
                  <span>1. Your Contact Details</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Full Name *"
                    value={customerContact.fullName}
                    onChange={(e) => updateCustomerContact({ fullName: e.target.value })}
                    className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400"
                  />
                  <input
                    type="tel"
                    required
                    placeholder="Mobile / WhatsApp *"
                    value={customerContact.phone}
                    onChange={(e) => updateCustomerContact({ phone: e.target.value })}
                    className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono placeholder-slate-500 focus:outline-none focus:border-emerald-400"
                  />
                </div>
                <input
                  type="email"
                  required={needsAuth}
                  placeholder={needsAuth ? "Email Address (Required to track quote) *" : "Email (for tracking your quote)"}
                  value={customerContact.email}
                  onChange={(e) => updateCustomerContact({ email: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400"
                />
                {needsAuth && (
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="Account Password (6+ chars — signs in or creates account) *"
                    value={accountPassword}
                    onChange={(e) => setAccountPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-emerald-500/60 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400"
                  />
                )}
              </div>

              {/* 2. Delivery vs Self-Pickup */}
              <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2.5">
                <div className="flex items-center space-x-1.5 font-bold text-white">
                  <Truck className="w-3.5 h-3.5 text-cyan-400" />
                  <span>2. Delivery or Self-Pickup</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      updateLogistics({
                        deliveryMode: logistics.deliveryMode === "SELF_PICKUP" ? "READY_BUILT" : logistics.deliveryMode,
                      })
                    }
                    className={`p-2.5 rounded-xl border font-semibold transition text-center ${
                      logistics.deliveryMode !== "SELF_PICKUP"
                        ? "border-cyan-400 bg-cyan-500/15 text-white"
                        : "border-slate-800 bg-slate-900 text-slate-400"
                    }`}
                  >
                    Deliver to My Site
                  </button>
                  <button
                    type="button"
                    onClick={() => updateLogistics({ deliveryMode: "SELF_PICKUP" })}
                    className={`p-2.5 rounded-xl border font-semibold transition text-center ${
                      logistics.deliveryMode === "SELF_PICKUP"
                        ? "border-emerald-400 bg-emerald-500/15 text-emerald-200"
                        : "border-slate-800 bg-slate-900 text-slate-400"
                    }`}
                  >
                    Self-Pickup (₹0 Logistics)
                  </button>
                </div>

                {logistics.deliveryMode === "SELF_PICKUP" && (
                  <div className="p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-[11px] text-emerald-200">
                    Pickup from <strong>{activeVendor.companyName}</strong> yard ({activeVendor.city}). Maker loads onto your truck at factory gate.
                  </div>
                )}
              </div>

              {/* 3. Detailed Delivery Location & Floor Level */}
              {logistics.deliveryMode !== "SELF_PICKUP" && (
                <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2.5">
                  <div className="flex items-center space-x-1.5 font-bold text-white">
                    <MapPin className="w-3.5 h-3.5 text-amber-400" />
                    <span>3. Exact Delivery Location & Floor</span>
                  </div>

                  <ExactLocationPicker
                    vendorCity={activeVendor.city}
                    vendorName={activeVendor.companyName}
                  />

                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      required
                      placeholder="City / Town *"
                      value={customerContact.city}
                      onChange={(e) => updateCustomerContact({ city: e.target.value })}
                      className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                    />
                    <input
                      type="text"
                      required
                      placeholder="6-Digit PIN Code *"
                      value={customerContact.pincode}
                      onChange={(e) => updateCustomerContact({ pincode: e.target.value })}
                      className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono placeholder-slate-500 focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <input
                    type="text"
                    required
                    placeholder="Full Street / House / Plot Address *"
                    value={customerContact.addressLine}
                    onChange={(e) => updateCustomerContact({ addressLine: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />

                  <input
                    type="text"
                    placeholder="Nearby Landmark (optional)"
                    value={customerContact.landmark}
                    onChange={(e) => updateCustomerContact({ landmark: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />

                  <div className="pt-1">
                    <div className="text-[11px] text-slate-400 mb-1">Placement Floor</div>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { id: "GROUND", label: "On Ground" },
                        { id: "MID_FLOOR", label: "1st / 2nd Flr" },
                        { id: "TERRACE", label: "Top Terrace" },
                      ].map((fl) => (
                        <button
                          key={fl.id}
                          type="button"
                          onClick={() => updateLogistics({ placementLevel: fl.id as any })}
                          className={`py-1.5 px-2 rounded-lg border text-[11px] font-semibold transition ${
                            logistics.placementLevel === fl.id
                              ? "border-amber-400 bg-amber-500/20 text-amber-200"
                              : "border-slate-800 bg-slate-900 text-slate-400"
                          }`}
                        >
                          {fl.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => updateLogistics({ roadWidth: "WIDE", deliveryMode: "READY_BUILT" })}
                      className={`py-1.5 px-2 rounded-lg border text-[11px] font-semibold transition ${
                        logistics.roadWidth === "WIDE" && logistics.deliveryMode === "READY_BUILT"
                          ? "border-cyan-400 bg-cyan-500/15 text-cyan-200"
                          : "border-slate-800 bg-slate-900 text-slate-400"
                      }`}
                    >
                      Wide Road (Truck+Crane)
                    </button>
                    <button
                      type="button"
                      onClick={() => updateLogistics({ roadWidth: "NARROW", deliveryMode: "KNOCK_DOWN" })}
                      className={`py-1.5 px-2 rounded-lg border text-[11px] font-semibold transition ${
                        logistics.deliveryMode === "KNOCK_DOWN"
                          ? "border-cyan-400 bg-cyan-500/15 text-cyan-200"
                          : "border-slate-800 bg-slate-900 text-slate-400"
                      }`}
                    >
                      Narrow Lane (Flat-Pack)
                    </button>
                  </div>
                </div>
              )}

              {/* Optional Target Budget / Question */}
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Target Budget ₹ (optional)"
                  value={offerInput}
                  onChange={(e) => setOfferInput(e.target.value)}
                  className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono placeholder-slate-500 focus:outline-none focus:border-emerald-400"
                />
                <input
                  type="text"
                  placeholder="Any question for maker..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400"
                />
              </div>

              <button
                type="submit"
                disabled={isSending}
                className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-bold text-xs transition shadow-lg disabled:opacity-50"
              >
                {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <PhoneCall className="w-4 h-4" />}
                <span>
                  {isSending
                    ? "Sending to Maker..."
                    : `Get Actual Final Quote (Est. ₹${activeVendor.totalCost.toLocaleString("en-IN")})`}
                </span>
              </button>
            </form>
          ) : (
            // Confirmed Lead Chat Thread
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {chatMessages.map((m, idx) => (
                  <div key={idx} className={`flex flex-col ${m.sender === "buyer" ? "items-end" : "items-start"}`}>
                    <div
                      className={`max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed ${
                        m.sender === "buyer"
                          ? "bg-emerald-600 text-slate-950 font-medium rounded-tr-none"
                          : "bg-slate-800 text-slate-100 rounded-tl-none border border-slate-700/60"
                      }`}
                    >
                      {m.text}
                      {m.offer && (
                        <div className="mt-1.5 pt-1.5 border-t border-black/20 text-xs font-bold font-mono">
                          My Target Budget: ₹{m.offer.toLocaleString("en-IN")}
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500 mt-0.5 px-1">{m.time}</span>
                  </div>
                ))}
              </div>

              <form onSubmit={handleFollowUpMessage} className="p-4 bg-slate-950/60 border-t border-slate-800 flex items-center space-x-2">
                <input
                  type="text"
                  placeholder="Write follow-up message..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="flex-1 px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="submit"
                  disabled={isSending}
                  aria-label="Send message"
                  className="p-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          )}
        </div>
      ) : (
        <>
          <div className="p-4 border-b border-slate-800/80 bg-slate-900/40 space-y-2.5 text-xs">
            <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-950/70 border border-slate-800">
              <span className="text-[11px] text-slate-300">
                {logistics.condition === "NEW"
                  ? "New"
                  : logistics.condition === "REFURB_READY"
                  ? "2nd Hand Refurbished"
                  : "Used Shell"}{" "}
                •{" "}
                {logistics.deliveryMode === "SELF_PICKUP"
                  ? "Self-Pickup (₹0 Logistics)"
                  : `${logistics.distanceKm} km • ${
                      logistics.deliveryMode === "KNOCK_DOWN" ? "Flat-Pack" : "Truck+Crane"
                    }`}
              </span>
              <button
                onClick={() => setActiveDrawer("logistics")}
                className="text-[11px] font-bold text-cyan-400 hover:underline"
              >
                Change
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5 text-slate-400">
                <ArrowUpDown className="w-3.5 h-3.5" />
                <span>Sort by:</span>
              </div>
              <div className="flex items-center space-x-1 bg-slate-800/80 p-0.5 rounded-xl border border-slate-700/60">
                <button
                  onClick={() => setSortBy("price")}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    sortBy === "price" ? "bg-emerald-500 text-slate-950 font-bold" : "text-slate-300 hover:text-white"
                  }`}
                >
                  Best Match
                </button>
                <button
                  onClick={() => setSortBy("timeline")}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    sortBy === "timeline" ? "bg-emerald-500 text-slate-950 font-bold" : "text-slate-300 hover:text-white"
                  }`}
                >
                  Fastest
                </button>
                <button
                  onClick={() => setSortBy("warranty")}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    sortBy === "warranty" ? "bg-emerald-500 text-slate-950 font-bold" : "text-slate-300 hover:text-white"
                  }`}
                >
                  Warranty
                </button>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
            {isLoadingQuotes ? (
              <div className="flex items-center justify-center py-12 text-xs text-slate-400 space-x-2">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                <span>Calculating live factory quotes...</span>
              </div>
            ) : sortedQuotes.length === 0 ? (
              <div className="p-6 rounded-2xl border border-slate-800 bg-slate-950/60 text-center space-y-3 text-xs">
                <p className="font-semibold text-white">No approved manufacturers onboarded yet</p>
                <p className="text-slate-400">
                  Fabricators can register via Partner Signup and be approved in Admin Console.
                </p>
                <div className="flex justify-center gap-2">
                  <Link
                    href="/auth/signin?tab=vendor"
                    className="px-3.5 py-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 font-semibold"
                  >
                    Register as Maker
                  </Link>
                  <Link
                    href="/admin"
                    className="px-3.5 py-2 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-semibold"
                  >
                    Open Admin
                  </Link>
                </div>
              </div>
            ) : (
              sortedQuotes.map((q) => (
                <div
                  key={q.vendorId}
                  className={`p-4 rounded-2xl border transition-all ${
                    q.isSponsored
                      ? "border-amber-500/40 bg-gradient-to-br from-slate-900 to-amber-950/20 shadow-xl"
                      : "border-slate-800 bg-slate-850/60 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    {q.isSponsored ? (
                      <span className="flex items-center space-x-1 px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-[10px] font-bold text-amber-300">
                        <Sparkles className="w-3 h-3 text-amber-400" />
                        <span>FEATURED PARTNER</span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono text-slate-400">VERIFIED MAKER</span>
                    )}
                    <div className="flex items-center space-x-1 text-amber-400 text-xs font-semibold">
                      <Star className="w-3.5 h-3.5 fill-amber-400" />
                      <span>{q.rating}</span>
                    </div>
                  </div>

                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-white">{q.companyName}</h3>
                      {q.isSponsored && q.adHeadline && (
                        <div className="text-[11px] text-amber-300 font-medium">{q.adHeadline}</div>
                      )}
                      <div className="flex items-center space-x-1 text-xs text-slate-400 mt-0.5">
                        <Building2 className="w-3.5 h-3.5" />
                        <span>{q.city}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold font-mono text-emerald-400">
                        ₹{q.totalCost.toLocaleString("en-IN")}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {logistics.deliveryMode === "SELF_PICKUP"
                          ? "Ex-Factory Self-Pickup"
                          : `incl. ₹${(((q.transportCost || 0) + (q.craneOrAssemblyCost || 0)) / 1000).toFixed(1)}k logistics`}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 my-3 py-2 px-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
                    <div className="flex items-center space-x-1.5 text-slate-300">
                      <Clock className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Ready in <strong>{q.leadDays} Days</strong></span>
                    </div>
                    <div className="flex items-center space-x-1.5 text-slate-300">
                      <Shield className="w-3.5 h-3.5 text-emerald-400" />
                      <span><strong>{q.warrantyYears} Yr</strong> Warranty</span>
                    </div>
                  </div>

                  <div className="space-y-1 mb-3.5 text-[11px] text-slate-300">
                    {q.features.map((f, idx) => (
                      <div key={idx} className="flex items-center space-x-1.5">
                        <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => handleStartInquiry(q)}
                    className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-200 font-bold text-xs transition"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>Get Actual Final Price</span>
                  </button>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
};
