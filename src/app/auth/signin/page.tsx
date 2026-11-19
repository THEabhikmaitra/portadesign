"use client";

import React, { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Building2, User, ShieldCheck, Lock, ArrowLeft, Loader2 } from "lucide-react";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (res?.error) {
      setError(res.error);
      setLoading(false);
    } else {
      router.push("/");
    }
  };

  const handleQuickLogin = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    signIn("credentials", {
      email: demoEmail,
      password: demoPass,
      redirect: false,
    }).then((res) => {
      if (res?.ok) {
        router.push("/");
      }
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6">
        <div>
          <Link
            href="/"
            className="inline-flex items-center space-x-1.5 text-xs text-slate-400 hover:text-white mb-4 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-emerald-400" />
            <span>Back to 3D Studio</span>
          </Link>
          <h1 className="text-xl font-bold text-white tracking-tight">Sign In to PORTADESIGN</h1>
          <p className="text-xs text-slate-400 mt-1">
            Access your 3D container projects, vendor dashboard, or admin tools
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-950/50 border border-red-800 text-xs text-red-300">
            {error}
          </div>
        )}

        {/* 1-Click Demo Accounts */}
        <div className="space-y-2">
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Quick 1-Click Demo Logins
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin("buyer@porta.local", "buyer123")}
              className="p-2.5 rounded-xl border border-slate-800 bg-slate-800/40 hover:border-emerald-500/50 hover:bg-slate-800/80 transition text-left"
            >
              <User className="w-4 h-4 text-emerald-400 mb-1" />
              <div className="text-xs font-bold text-white">Buyer</div>
              <div className="text-[10px] text-slate-400">Architect</div>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin("vendor1@quickcabin.in", "vendor123")}
              className="p-2.5 rounded-xl border border-slate-800 bg-slate-800/40 hover:border-amber-500/50 hover:bg-slate-800/80 transition text-left"
            >
              <Building2 className="w-4 h-4 text-amber-400 mb-1" />
              <div className="text-xs font-bold text-white">Vendor</div>
              <div className="text-[10px] text-slate-400">QuickCabin</div>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin("admin@porta.local", "admin123")}
              className="p-2.5 rounded-xl border border-slate-800 bg-slate-800/40 hover:border-cyan-500/50 hover:bg-slate-800/80 transition text-left"
            >
              <ShieldCheck className="w-4 h-4 text-cyan-400 mb-1" />
              <div className="text-xs font-bold text-white">Admin</div>
              <div className="text-[10px] text-slate-400">Platform</div>
            </button>
          </div>
        </div>

        <div className="relative flex items-center justify-center">
          <div className="border-t border-slate-800 w-full" />
          <span className="bg-slate-900 px-3 text-[11px] text-slate-500 uppercase tracking-wider absolute">
            or credentials
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@porta.local"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-bold text-xs transition shadow-lg disabled:opacity-50"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>{loading ? "Signing in..." : "Sign In"}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
