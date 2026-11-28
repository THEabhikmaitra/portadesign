"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

const CONSENT_KEY = "mpr_cookie_consent_v1";

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(CONSENT_KEY);
      if (!saved) setVisible(true);
    } catch {
      setVisible(false);
    }
  }, []);

  const choose = (choice: "accepted" | "essential") => {
    try {
      window.localStorage.setItem(CONSENT_KEY, JSON.stringify({ choice, ts: Date.now() }));
    } catch {}
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <aside
      aria-label="Cookie consent"
      className="fixed bottom-3 left-3 right-3 sm:left-auto sm:right-4 sm:max-w-md z-50 rounded-2xl bg-slate-900/95 backdrop-blur-md border border-slate-700 p-4 shadow-2xl text-xs text-slate-300 space-y-3"
    >
      <p className="leading-relaxed">
        We use essential cookies for sign-in and optional cookies (including Google AdSense on guide pages) to fund free 3D tools. See our{" "}
        <Link href="/privacy" className="text-emerald-400 hover:underline">
          Privacy Policy
        </Link>{" "}
        and{" "}
        <Link href="/terms" className="text-emerald-400 hover:underline">
          Terms
        </Link>
        .
      </p>
      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => choose("essential")}
          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition"
        >
          Essential Only
        </button>
        <button
          type="button"
          onClick={() => choose("accepted")}
          className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition"
        >
          Accept All
        </button>
      </div>
    </aside>
  );
}
