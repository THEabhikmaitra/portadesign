"use client";

import React, { useState, useEffect } from "react";
import { useStudioStore } from "@/store/useStudioStore";
import {
  X,
  Tag,
  Star,
  Clock,
  Shield,
  MessageSquare,
  Sparkles,
  ArrowUpDown,
  Send,
  Building2,
  Check,
} from "lucide-react";

interface VendorQuote {
  vendorId: string;
  companyName: string;
  city: string;
  rating: number;
  leadDays: number;
  warrantyYears: number;
  isSponsored: boolean;
  sponsoredBidAmt: number;
  totalCost: number;
  savingsVsBase: number;
  features: string[];
}

export const LiveBrandQuoteDrawer: React.FC = () => {
  const activeDrawer = useStudioStore((state) => state.activeDrawer);
  const setActiveDrawer = useStudioStore((state) => state.setActiveDrawer);
  const getBom = useStudioStore((state) => state.getBom);

  const bom = getBom();

  const [sortBy, setSortBy] = useState<"price" | "timeline" | "warranty">("price");
  const [activeNegotiationVendor, setActiveNegotiationVendor] = useState<VendorQuote | null>(null);
  const [chatMessages, setChatMessages] = useState<Array<{ sender: "buyer" | "vendor"; text: string; time: string; offer?: number }>>([]);
  const [inputText, setInputText] = useState("");
  const [offerInput, setOfferInput] = useState("");

  // Calculate live quotes for the 4 verified vendors from the seed
  const vendorQuotes: VendorQuote[] = [
    {
      vendorId: "v-quickcabin",
      companyName: "QuickCabin Modular Systems",
      city: "Pune / Mumbai Hub",
      rating: 4.9,
      leadDays: 10,
      warrantyYears: 5,
      isSponsored: true,
      sponsoredBidAmt: 45.0,
      totalCost: Math.round(bom.totalCost * 0.96),
      savingsVsBase: Math.round(bom.totalCost * 0.04),
      features: ["5-Yr Structural & Seal Warranty", "Express 10-day dispatch", "Crane offload assistance"],
    },
    {
      vendorId: "v-zenith",
      companyName: "Zenith Smart Pods & Living",
      city: "Bengaluru Tech Park",
      rating: 4.7,
      leadDays: 12,
      warrantyYears: 5,
      isSponsored: true,
      sponsoredBidAmt: 35.0,
      totalCost: Math.round(bom.totalCost * 1.02),
      savingsVsBase: -Math.round(bom.totalCost * 0.02),
      features: ["Integrated Smart IoT Sensors", "Acoustic insulation certificate", "5-Yr support hotline"],
    },
    {
      vendorId: "v-ecosteel",
      companyName: "EcoSteel Prefab Works",
      city: "Ahmedabad, Gujarat",
      rating: 4.8,
      leadDays: 14,
      warrantyYears: 7,
      isSponsored: false,
      sponsoredBidAmt: 20.0,
      totalCost: Math.round(bom.totalCost * 0.92),
      savingsVsBase: Math.round(bom.totalCost * 0.08),
      features: ["7-Yr Heavy Steel Guarantee", "Green Building GRIHA Certified", "Factory pre-wired"],
    },
    {
      vendorId: "v-bharatmod",
      companyName: "Bharat Modular Infra",
      city: "Gurugram / NCR",
      rating: 4.6,
      leadDays: 18,
      warrantyYears: 3,
      isSponsored: false,
      sponsoredBidAmt: 10.0,
      totalCost: Math.round(bom.totalCost * 0.88),
      savingsVsBase: Math.round(bom.totalCost * 0.12),
      features: ["Best Value Economy Build", "IS 2062 Grade Steel", "Direct factory dispatch"],
    },
  ];

  // Sort logic: Sponsored always stays top unless sorted specifically, or highlighted
  const sortedQuotes = [...vendorQuotes].sort((a, b) => {
    // Keep sponsored elevated
    if (a.isSponsored && !b.isSponsored) return -1;
    if (!a.isSponsored && b.isSponsored) return 1;

    if (sortBy === "price") return a.totalCost - b.totalCost;
    if (sortBy === "timeline") return a.leadDays - b.leadDays;
    if (sortBy === "warranty") return b.warrantyYears - a.warrantyYears;
    return 0;
  });

  const handleStartNegotiate = (vendor: VendorQuote) => {
    setActiveNegotiationVendor(vendor);
    setChatMessages([
      {
        sender: "vendor",
        text: `Hello! I'm the sales director at ${vendor.companyName}. We saw your 3D BOM configuration (Total: ₹${vendor.totalCost.toLocaleString("en-IN")}). Would you like to lock in this price or discuss custom delivery timelines?`,
        time: "Just now",
      },
    ]);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() && !offerInput) return;

    const offerVal = offerInput ? parseInt(offerInput.replace(/\D/g, ""), 10) : undefined;
    const newMsg = {
      sender: "buyer" as const,
      text: inputText.trim() || `Offer submitted: ₹${offerVal?.toLocaleString("en-IN")}`,
      time: "Just now",
      offer: offerVal,
    };

    setChatMessages((prev) => [...prev, newMsg]);
    setInputText("");
    setOfferInput("");

    // Simulated vendor counter-response
    setTimeout(() => {
      setChatMessages((prev) => [
        ...prev,
        {
          sender: "vendor",
          text: offerVal
            ? `Thank you for your offer of ₹${offerVal.toLocaleString("en-IN")}! We can accept this if you confirm delivery within 14 days with standard foundation preparation.`
            : "Understood! Our technical drafting team will review the 3D specifications and attach a formal invoice.",
          time: "Just now",
        },
      ]);
    }, 1000);
  };

  if (activeDrawer !== "quotes") return null;

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full sm:w-[480px] bg-slate-900/95 backdrop-blur-xl border-l border-slate-700/80 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/60">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <Tag className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Compare Brand Quotes</h2>
            <div className="text-xs text-slate-400">
              Live pricing from certified manufacturers for your exact 3D BOM
            </div>
          </div>
        </div>
        <button
          onClick={() => setActiveDrawer(null)}
          className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {activeNegotiationVendor ? (
        // Negotiation & Quote Chat Drawer
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="p-4 bg-slate-800/60 border-b border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-xs text-emerald-400 font-medium">Negotiating with</div>
              <div className="font-bold text-white text-sm">{activeNegotiationVendor.companyName}</div>
              <div className="text-[11px] text-slate-400 font-mono">
                Quote: ₹{activeNegotiationVendor.totalCost.toLocaleString("en-IN")}
              </div>
            </div>
            <button
              onClick={() => setActiveNegotiationVendor(null)}
              className="text-xs text-slate-400 hover:text-white px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 transition"
            >
              ← Back to Quotes
            </button>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {chatMessages.map((m, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${m.sender === "buyer" ? "items-end" : "items-start"}`}
              >
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
                      Proposed Price: ₹{m.offer.toLocaleString("en-IN")}
                    </div>
                  )}
                </div>
                <span className="text-[10px] text-slate-500 mt-0.5 px-1">{m.time}</span>
              </div>
            ))}
          </div>

          {/* Input Box */}
          <form onSubmit={handleSendMessage} className="p-4 bg-slate-950/60 border-t border-slate-800 space-y-2">
            <div className="flex items-center space-x-2">
              <input
                type="text"
                placeholder="Counter-offer amount (e.g. 410000)"
                value={offerInput}
                onChange={(e) => setOfferInput(e.target.value)}
                className="w-1/2 px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-emerald-500"
              />
              <span className="text-[11px] text-slate-400 font-mono">INR</span>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                placeholder="Type your message or query..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="flex-1 px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                className="p-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition font-medium"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      ) : (
        // Vendor List View
        <>
          {/* Sorting Controls */}
          <div className="p-4 border-b border-slate-800/80 bg-slate-900/40 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-1.5 text-slate-400">
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span>Sort quotes:</span>
            </div>
            <div className="flex items-center space-x-1 bg-slate-800/80 p-0.5 rounded-xl border border-slate-700/60">
              <button
                onClick={() => setSortBy("price")}
                className={`px-2.5 py-1 rounded-lg transition ${
                  sortBy === "price" ? "bg-emerald-500 text-slate-950 font-bold" : "text-slate-300 hover:text-white"
                }`}
              >
                Price
              </button>
              <button
                onClick={() => setSortBy("timeline")}
                className={`px-2.5 py-1 rounded-lg transition ${
                  sortBy === "timeline" ? "bg-emerald-500 text-slate-950 font-bold" : "text-slate-300 hover:text-white"
                }`}
              >
                Speed
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

          {/* Quotes List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
            {sortedQuotes.map((q) => (
              <div
                key={q.vendorId}
                className={`p-4 rounded-2xl border transition-all ${
                  q.isSponsored
                    ? "border-amber-500/50 bg-gradient-to-br from-slate-900 to-amber-950/20 shadow-xl"
                    : "border-slate-800 bg-slate-850/60 hover:border-slate-700"
                }`}
              >
                {/* Top Badge Line */}
                <div className="flex items-center justify-between mb-2">
                  {q.isSponsored ? (
                    <span className="flex items-center space-x-1 px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-[10px] font-bold text-amber-300">
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      <span>SPONSORED VERIFIED PARTNER</span>
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono text-slate-400">
                      DIRECT MANUFACTURER
                    </span>
                  )}
                  <div className="flex items-center space-x-1 text-amber-400 text-xs font-semibold">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <span>{q.rating}</span>
                  </div>
                </div>

                {/* Company Name & Location */}
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white">{q.companyName}</h3>
                    <div className="flex items-center space-x-1 text-xs text-slate-400 mt-0.5">
                      <Building2 className="w-3.5 h-3.5" />
                      <span>{q.city}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold font-mono text-emerald-400">
                      ₹{q.totalCost.toLocaleString("en-IN")}
                    </div>
                    {q.savingsVsBase > 0 && (
                      <div className="text-[10px] text-emerald-300 font-medium">
                        Save ₹{q.savingsVsBase.toLocaleString("en-IN")}
                      </div>
                    )}
                  </div>
                </div>

                {/* Lead time & Warranty metrics */}
                <div className="grid grid-cols-2 gap-2 my-3 py-2 px-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
                  <div className="flex items-center space-x-1.5 text-slate-300">
                    <Clock className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Lead Time: <strong>{q.leadDays} Days</strong></span>
                  </div>
                  <div className="flex items-center space-x-1.5 text-slate-300">
                    <Shield className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Warranty: <strong>{q.warrantyYears} Years</strong></span>
                  </div>
                </div>

                {/* Features Bullets */}
                <div className="space-y-1 mb-3.5 text-[11px] text-slate-300">
                  {q.features.map((f, idx) => (
                    <div key={idx} className="flex items-center space-x-1.5">
                      <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>

                {/* Action Button */}
                <button
                  onClick={() => handleStartNegotiate(q)}
                  className="w-full flex items-center justify-center space-x-2 py-2 px-4 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 font-semibold text-xs transition"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Request Quote & Negotiate</span>
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
