"use client";

import React, { Suspense, useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

function TopProgressBarInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  const trickleRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hideRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const safetyRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = () => {
    if (trickleRef.current) clearInterval(trickleRef.current);
    if (hideRef.current) clearTimeout(hideRef.current);
    if (safetyRef.current) clearTimeout(safetyRef.current);
    trickleRef.current = null;
    hideRef.current = null;
    safetyRef.current = null;
  };

  const startBar = () => {
    clearTimers();
    setVisible(true);
    setProgress(18);
    trickleRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 88) return prev;
        const step = prev < 45 ? 10 : prev < 72 ? 5 : 2;
        return Math.min(88, prev + step);
      });
    }, 180);

    safetyRef.current = setTimeout(() => {
      completeBar();
    }, 8000);
  };

  const completeBar = () => {
    clearTimers();
    setProgress(100);
    hideRef.current = setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 280);
  };

  // Finish bar when route/search changes
  useEffect(() => {
    if (visible) {
      completeBar();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams]);

  // Listen to internal link clicks and popstate across entire site
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const anchor = (e.target as HTMLElement | null)?.closest("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;
      if (anchor.target === "_blank" || anchor.hasAttribute("download")) return;

      try {
        const dest = new URL(anchor.href, window.location.href);
        if (dest.origin !== window.location.origin) return;
        if (dest.pathname === window.location.pathname && dest.search === window.location.search) return;
        startBar();
      } catch {
        // ignore invalid URLs
      }
    };

    const onPopState = () => startBar();

    document.addEventListener("click", onClick, true);
    window.addEventListener("popstate", onPopState);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("popstate", onPopState);
      clearTimers();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      aria-hidden="true"
      className="fixed top-0 left-0 right-0 z-[9999] h-[3px] pointer-events-none"
      style={{
        opacity: visible ? 1 : 0,
        transition: "opacity 240ms ease-out",
      }}
    >
      <div
        className="h-full bg-gradient-to-r from-emerald-500 via-cyan-500 to-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.55)]"
        style={{
          width: `${progress}%`,
          transition: progress === 0 ? "none" : "width 220ms cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      />
    </div>
  );
}

export const TopProgressBar: React.FC = () => (
  <Suspense fallback={null}>
    <TopProgressBarInner />
  </Suspense>
);
