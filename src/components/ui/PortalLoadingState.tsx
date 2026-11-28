"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Box, BookOpen, Wifi, ArrowRight, Loader2 } from "lucide-react";

export const PortalLoadingState: React.FC = () => {
  const [elapsedMs, setElapsedMs] = useState(0);
  const [netLabel, setNetLabel] = useState<string | null>(null);
  const [isSlowNet, setIsSlowNet] = useState(false);

  useEffect(() => {
    const navConn = (navigator as any)?.connection;
    const eff = String(navConn?.effectiveType || "").toLowerCase();
    const saveData = Boolean(navConn?.saveData);
    if (eff === "slow-2g" || eff === "2g" || eff === "3g" || saveData) {
      setIsSlowNet(true);
      setNetLabel(saveData ? "Data Saver On" : `${eff.toUpperCase()} connection`);
    }

    const start = Date.now();
    const timer = window.setInterval(() => {
      const diff = Date.now() - start;
      setElapsedMs(diff);
      if (diff >= 2200) setIsSlowNet(true);
    }, 350);

    return () => window.clearInterval(timer);
  }, []);

  const pct = Math.min(92, Math.max(18, Math.round(elapsedMs / 35)));

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading 3D Prefab Room Studio"
      className="fixed inset-0 z-20 flex flex-col items-center justify-center bg-slate-950 px-4 py-6 text-slate-100"
    >
      <div className="w-full max-w-sm rounded-3xl border border-slate-800 bg-slate-900/90 p-6 shadow-2xl space-y-5 text-center">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-400 to-cyan-400 flex items-center justify-center text-slate-950 shadow-lg">
          <Box className="w-7 h-7 animate-pulse motion-reduce:animate-none" />
        </div>

        <div className="space-y-1.5">
          <h2 className="text-base sm:text-lg font-extrabold text-white">
            Loading 3D Prefab Studio
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Preparing interactive structural frames, turnkey pricing, and mobile touch controls.
          </p>
        </div>

        {/* Accessible Progress Bar */}
        <div className="space-y-1.5">
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span className="inline-flex items-center space-x-1">
              <Loader2 className="w-3 h-3 animate-spin motion-reduce:animate-none text-emerald-400" />
              <span>Initializing WebGL...</span>
            </span>
            <span>{pct}%</span>
          </div>
        </div>

        {/* Slow Internet / Small Screen Fallback Controls */}
        {(isSlowNet || netLabel) && (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-left space-y-2.5">
            <div className="flex items-center space-x-1.5 text-[11px] font-bold text-amber-300">
              <Wifi className="w-3.5 h-3.5 shrink-0" />
              <span>{netLabel ? `${netLabel} detected` : "Slower connection detected"}</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              The 3D scene continues loading in the background. On mobile data or small screens, you can browse fast text buyer guides immediately:
            </p>
            <Link
              href="/guides"
              className="w-full min-h-[40px] px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-between transition"
            >
              <span className="inline-flex items-center space-x-1.5">
                <BookOpen className="w-3.5 h-3.5" />
                <span>Open Fast Lite Guides (/guides)</span>
              </span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        <div className="pt-1 flex items-center justify-center space-x-4 text-[11px] text-slate-400">
          <Link href="/guides" className="hover:text-emerald-300 underline-offset-4 hover:underline">
            Buyer Guides
          </Link>
          <span>•</span>
          <Link href="/about" className="hover:text-emerald-300 underline-offset-4 hover:underline">
            Methodology
          </Link>
          <span>•</span>
          <Link href="/privacy" className="hover:text-emerald-300 underline-offset-4 hover:underline">
            Privacy
          </Link>
        </div>
      </div>
    </div>
  );
};
