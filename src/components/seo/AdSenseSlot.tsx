"use client";

import React, { useEffect } from "react";
import { useSession } from "next-auth/react";

interface AdSenseSlotProps {
  slotId?: string;
  label?: string;
}

export const AdSenseSlot: React.FC<AdSenseSlotProps> = ({ slotId = "auto", label = "Sponsored" }) => {
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
  const { data: session } = useSession();
  const isAdmin = (session?.user as { role?: string } | undefined)?.role === "ADMIN";

  useEffect(() => {
    if (!client) return;
    try {
      ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
    } catch {
      // AdSense script not yet initialized or blocked by browser extension
    }
  }, [client]);

  if (!client) {
    if (process.env.NODE_ENV === "production" || !isAdmin) return null;
    return (
      <div className="my-6 py-3 px-4 rounded-xl border border-dashed border-slate-700 bg-slate-900/60 text-center text-[10px] text-slate-400 font-mono">
        AdSense Responsive In-Article Slot ({label} • set NEXT_PUBLIC_ADSENSE_CLIENT in env when approved)
      </div>
    );
  }

  return (
    <div className="my-6 overflow-hidden rounded-xl border border-slate-700/70 bg-slate-900/50 p-2">
      <div className="text-[9px] uppercase tracking-wider text-slate-400 text-center mb-1">{label}</div>
      <ins
        className="adsbygoogle block"
        style={{ display: "block", textAlign: "center" }}
        data-ad-client={client}
        data-ad-slot={slotId}
        data-ad-format="fluid"
        data-ad-layout="in-article"
        data-full-width-responsive="true"
      />
    </div>
  );
};
