"use client";

import React, { useState, useEffect } from "react";
import { signIn, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Building2, User, ShieldCheck, ArrowLeft, Loader2, LogOut } from "lucide-react";

type AuthMode = "signin" | "buyer" | "vendor" | "setup-admin";

export default function SignInPage() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("signin");
  const [hasAdmin, setHasAdmin] = useState<boolean>(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [city, setCity] = useState("");
  const [gstin, setGstin] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const tabParam = new URLSearchParams(window.location.search).get("tab");
    if (tabParam === "vendor") setMode("vendor");
    if (tabParam === "buyer") setMode("buyer");

    fetch("/api/auth/setup-status", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        setHasAdmin(Boolean(data.hasAdmin));
        setCurrentUser(data.user || null);
        if (!data.hasAdmin && !tabParam) {
          setMode("setup-admin");
        }
      })
      .catch(() => {});
  }, []);

  const redirectForRole = (role?: string) => {
    if (role === "ADMIN") router.push("/admin");
    else if (role === "VENDOR") router.push("/vendor");
    else router.push("/");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setNotice(null);

    try {
      if (mode === "signin") {
        const res = await signIn("credentials", {
          email: email.trim(),
          password,
          redirect: false,
        });
        if (res?.error) throw new Error(res.error);

        const statusRes = await fetch("/api/auth/setup-status", { cache: "no-store" });
        const statusData = await statusRes.json();
        redirectForRole(statusData?.user?.role);
        return;
      }

      const accountType =
        mode === "setup-admin" ? "FIRST_ADMIN" : mode === "vendor" ? "VENDOR" : "BUYER";

      const regRes = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password,
          name: name.trim(),
          phone: phone.trim(),
          accountType,
          companyName: companyName.trim(),
          city: city.trim(),
          gstin: gstin.trim(),
        }),
      });
      const regData = await regRes.json();
      if (!regRes.ok) throw new Error(regData.error || "Registration failed");

      const signRes = await signIn("credentials", {
        email: email.trim(),
        password,
        redirect: false,
      });
      if (signRes?.error) throw new Error(signRes.error);

      if (accountType === "VENDOR") {
        setNotice("Maker account registered! Opening Vendor Console (Pending Admin verification).");
      }
      redirectForRole(regData.user?.role);
    } catch (err: any) {
      setError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-5">
        <div>
          <Link
            href="/"
            className="inline-flex items-center space-x-1.5 text-xs text-slate-400 hover:text-white mb-4 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-emerald-400" />
            <span>Back to 3D Studio</span>
          </Link>
          <h1 className="text-xl font-bold text-white tracking-tight">MyPrefabRoom Account</h1>
          <p className="text-xs text-slate-400 mt-1">
            Real authentication for Buyers, Verified Makers & Platform Admin
          </p>
        </div>

        {currentUser && (
          <div className="p-3 rounded-2xl bg-slate-950 border border-emerald-500/30 flex items-center justify-between text-xs">
            <div>
              <div className="font-bold text-white">{currentUser.name || currentUser.email}</div>
              <div className="text-[11px] text-emerald-400 font-mono">{currentUser.role}</div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => redirectForRole(currentUser.role)}
                className="px-2.5 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 font-semibold"
              >
                Open Portal
              </button>
              <button
                type="button"
                onClick={() => signOut({ redirect: false }).then(() => setCurrentUser(null))}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
                title="Sign out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {!hasAdmin && (
          <div className="p-3 rounded-2xl bg-cyan-950/40 border border-cyan-500/40 text-xs text-cyan-200">
            <strong>First-Time Setup:</strong> No Admin exists yet. Create your Platform Admin account below.
          </div>
        )}

        {/* Mode Tabs */}
        <div className="grid grid-cols-3 gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-[11px] font-semibold">
          <button
            type="button"
            onClick={() => setMode("signin")}
            className={`py-2 rounded-lg transition ${
              mode === "signin" ? "bg-emerald-500 text-slate-950" : "text-slate-400 hover:text-white"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setMode("buyer")}
            className={`py-2 rounded-lg flex items-center justify-center space-x-1 transition ${
              mode === "buyer" ? "bg-cyan-500 text-slate-950" : "text-slate-400 hover:text-white"
            }`}
          >
            <User className="w-3 h-3" />
            <span>Buyer</span>
          </button>
          <button
            type="button"
            onClick={() => setMode("vendor")}
            className={`py-2 rounded-lg flex items-center justify-center space-x-1 transition ${
              mode === "vendor" ? "bg-amber-500 text-slate-950" : "text-slate-400 hover:text-white"
            }`}
          >
            <Building2 className="w-3 h-3" />
            <span>Maker</span>
          </button>
        </div>

        {!hasAdmin && (
          <button
            type="button"
            onClick={() => setMode("setup-admin")}
            className={`w-full py-2 rounded-xl border text-xs font-bold flex items-center justify-center space-x-1.5 transition ${
              mode === "setup-admin"
                ? "border-cyan-400 bg-cyan-500/20 text-cyan-200"
                : "border-slate-800 bg-slate-950 text-slate-400"
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Initialize First Platform Admin</span>
          </button>
        )}

        {error && (
          <div className="p-3 rounded-xl bg-red-950/50 border border-red-800 text-xs text-red-300">
            {error}
          </div>
        )}
        {notice && (
          <div className="p-3 rounded-xl bg-emerald-950/50 border border-emerald-800 text-xs text-emerald-300">
            {notice}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode !== "signin" && (
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your Name"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">Phone</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 ..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          )}

          {mode === "vendor" && (
            <div className="space-y-2.5 p-3 rounded-2xl bg-slate-950/70 border border-amber-500/25">
              <div className="text-[11px] font-bold text-amber-300">Factory Details</div>
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Company / Fabrication Hub Name *"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="City / Hub *"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                />
                <input
                  type="text"
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value)}
                  placeholder="GSTIN (Optional)"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white uppercase font-mono focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-medium text-slate-300 mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-300 mb-1">Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min 6 characters"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-bold text-xs transition shadow-lg disabled:opacity-50"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>
              {loading
                ? "Please wait..."
                : mode === "signin"
                ? "Sign In"
                : mode === "setup-admin"
                ? "Create Platform Admin"
                : mode === "vendor"
                ? "Submit Maker Application"
                : "Create Buyer Account"}
            </span>
          </button>
        </form>
      </div>
    </div>
  );
}
