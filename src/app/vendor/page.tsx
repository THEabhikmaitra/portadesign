"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Building2,
  DollarSign,
  Clock,
  Shield,
  Sparkles,
  Save,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Sliders,
  TrendingUp,
} from "lucide-react";

export default function VendorPortalPage() {
  const [profile, setProfile] = useState<any>(null);
  const [masterElements, setMasterElements] = useState<any[]>([]);
  const [masterAttributes, setMasterAttributes] = useState<any[]>([]);
  const [rateCards, setRateCards] = useState<Record<string, number>>({});
  const [attributeMods, setAttributeMods] = useState<Record<string, number>>({});

  const [leadDays, setLeadDays] = useState(12);
  const [warrantyYears, setWarrantyYears] = useState(5);
  const [isSponsored, setIsSponsored] = useState(true);
  const [sponsoredBidAmt, setSponsoredBidAmt] = useState(45.0);

  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchVendorData();
  }, []);

  const fetchVendorData = async () => {
    try {
      const res = await fetch("/api/vendor/rate-cards");
      const data = await res.json();
      if (data.profile) {
        setProfile(data.profile);
        setLeadDays(data.profile.leadDays || 12);
        setWarrantyYears(data.profile.warrantyYears || 5);
        setIsSponsored(data.profile.isSponsored || false);
        setSponsoredBidAmt(data.profile.sponsoredBidAmt || 35.0);

        const cardMap: Record<string, number> = {};
        const modMap: Record<string, number> = {};

        data.profile.rateCards?.forEach((rc: any) => {
          cardMap[rc.elementCode] = rc.baseUnitPrice;
          try {
            const mods = JSON.parse(rc.attributeModifiersJson || "{}");
            Object.assign(modMap, mods);
          } catch (e) {}
        });

        setRateCards(cardMap);
        setAttributeMods(modMap);
      }
      setMasterElements(data.masterElements || []);
      setMasterAttributes(data.masterAttributes || []);
    } catch (err) {
      console.error("Error loading vendor data:", err);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setStatusMessage(null);

    try {
      const rateCardUpdates = masterElements.map((el) => ({
        elementCode: el.code,
        baseUnitPrice: rateCards[el.code] !== undefined ? rateCards[el.code] : el.baseCost,
        attributeModifiersJson: JSON.stringify(attributeMods),
        leadTimeDays: leadDays,
        warrantyNotes: `${warrantyYears}-Year Manufacturer Comprehensive Warranty`,
      }));

      const res = await fetch("/api/vendor/rate-cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileUpdates: {
            leadDays,
            warrantyYears,
            isSponsored,
            sponsoredBidAmt,
          },
          rateCardUpdates,
        }),
      });

      if (res.ok) {
        setStatusMessage("✅ Rates, modifiers, and sponsored bids saved successfully!");
      } else {
        setStatusMessage("❌ Failed to save vendor settings");
      }
    } catch (err: any) {
      setStatusMessage(`❌ Error: ${err.message}`);
    } finally {
      setIsSaving(false);
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
              <Building2 className="w-5 h-5 text-amber-400" />
              <h1 className="text-base font-bold text-white">Vendor Manufacturer Portal</h1>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-400 font-mono">
              Vendor: <strong className="text-white">{profile?.companyName || "QuickCabin Modular"}</strong>
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 space-y-8">
        {statusMessage && (
          <div className="p-4 rounded-2xl bg-slate-900 border border-emerald-500/50 text-xs text-emerald-300 font-medium">
            {statusMessage}
          </div>
        )}

        <form onSubmit={handleSaveSettings} className="space-y-8">
          {/* 1. Commercial Terms & Sponsored Bidding Card */}
          <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-6">
            <div className="flex items-center space-x-2.5 border-b border-slate-800 pb-4">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <div>
                <h2 className="text-base font-bold text-white">
                  Sponsored Placement & Commercial Guarantee Terms
                </h2>
                <p className="text-xs text-slate-400">
                  Boost your position in live 3D quote comparisons and configure delivery SLA
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Sponsored Toggle */}
              <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/60 flex flex-col justify-between">
                <div>
                  <div className="text-xs font-semibold text-white">Sponsored Ad Status</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Pin your brand to top of 3D quote drawer
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <span className={`text-xs font-bold ${isSponsored ? "text-amber-400" : "text-slate-500"}`}>
                    {isSponsored ? "ACTIVE BOOST" : "INACTIVE"}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsSponsored(!isSponsored)}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                      isSponsored ? "bg-amber-500" : "bg-slate-700"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        isSponsored ? "translate-x-4" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Sponsored CPC Bid Amt */}
              <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/60">
                <label className="block text-xs font-semibold text-white mb-1">
                  Sponsored Bid Score (₹ / Lead)
                </label>
                <div className="text-[11px] text-slate-400 mb-2">
                  Higher bids grant primary featured badge
                </div>
                <input
                  type="number"
                  value={sponsoredBidAmt}
                  onChange={(e) => setSponsoredBidAmt(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-amber-300 font-mono font-bold focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Lead Days */}
              <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/60">
                <label className="block text-xs font-semibold text-white mb-1">
                  Delivery Lead Time (Days)
                </label>
                <div className="text-[11px] text-slate-400 mb-2">
                  Fabrication & site dispatch turnaround
                </div>
                <input
                  type="number"
                  value={leadDays}
                  onChange={(e) => setLeadDays(parseInt(e.target.value, 10) || 10)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-cyan-300 font-mono font-bold focus:outline-none focus:border-cyan-400"
                />
              </div>

              {/* Warranty Years */}
              <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/60">
                <label className="block text-xs font-semibold text-white mb-1">
                  Warranty Coverage (Years)
                </label>
                <div className="text-[11px] text-slate-400 mb-2">
                  Structural integrity and seal guarantee
                </div>
                <input
                  type="number"
                  value={warrantyYears}
                  onChange={(e) => setWarrantyYears(parseInt(e.target.value, 10) || 5)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-emerald-300 font-mono font-bold focus:outline-none focus:border-emerald-400"
                />
              </div>
            </div>
          </div>

          {/* 2. Base Element Rate Cards */}
          <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-6">
            <div className="flex items-center space-x-2.5 border-b border-slate-800 pb-4">
              <DollarSign className="w-5 h-5 text-emerald-400" />
              <div>
                <h2 className="text-base font-bold text-white">Container & Equipment Base Rate Cards</h2>
                <p className="text-xs text-slate-400">
                  Override default platform unit pricing for your factory line
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {masterElements.map((el) => {
                const currentPrice = rateCards[el.code] !== undefined ? rateCards[el.code] : el.baseCost;

                return (
                  <div
                    key={el.id}
                    className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/60 flex items-center justify-between"
                  >
                    <div>
                      <div className="text-xs font-bold text-white">{el.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {el.code} • Default: ₹{el.baseCost.toLocaleString("en-IN")}
                      </div>
                    </div>
                    <div className="flex items-center space-x-1.5 w-36">
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
                        className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono font-bold text-emerald-400 text-right focus:outline-none focus:border-emerald-400"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. Attribute & Brand Modifiers (Glass, Finish, Frames) */}
          <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-6">
            <div className="flex items-center space-x-2.5 border-b border-slate-800 pb-4">
              <Sliders className="w-5 h-5 text-cyan-400" />
              <div>
                <h2 className="text-base font-bold text-white">Attribute & Glazing Upcharge Modifiers</h2>
                <p className="text-xs text-slate-400">
                  Define exact surcharges for tinted glass, architectural paint, and brand options
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {masterAttributes.map((attr) => {
                const currentMod = attributeMods[attr.code] !== undefined ? attributeMods[attr.code] : attr.costModifier;

                return (
                  <div
                    key={attr.id}
                    className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/60 flex items-center justify-between"
                  >
                    <div>
                      <div className="text-xs font-bold text-white">{attr.name}</div>
                      <div className="text-[10px] text-slate-400">
                        {attr.category} {attr.brand && `• ${attr.brand}`}
                      </div>
                    </div>
                    <div className="flex items-center space-x-1.5 w-32">
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
                        className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono font-bold text-cyan-400 text-right focus:outline-none focus:border-cyan-400"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center space-x-2 py-3 px-8 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-bold text-sm transition shadow-xl disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? "Saving Rate Cards..." : "Save All Rate Cards & Commercial Settings"}</span>
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
