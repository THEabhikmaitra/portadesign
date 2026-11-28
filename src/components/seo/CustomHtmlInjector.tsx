"use client";

import React, { useEffect, useRef } from "react";

/**
 * Safely mounts custom body/footer HTML snippets and executes embedded <script> tags
 * once on client navigation while preserving initial SSR output for crawlers.
 */
export const CustomBodyHtmlSlot: React.FC<{
  html: string;
  slotName: "body-top" | "footer";
}> = ({ html, slotName }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !html?.trim()) return;

    const scripts = Array.from(el.querySelectorAll("script"));
    for (const oldScript of scripts) {
      if (oldScript.dataset.executed === "1") continue;
      oldScript.dataset.executed = "1";
      const fresh = document.createElement("script");
      for (const attr of Array.from(oldScript.attributes)) {
        if (attr.name !== "data-executed") {
          fresh.setAttribute(attr.name, attr.value);
        }
      }
      fresh.dataset.executed = "1";
      if (!oldScript.src && oldScript.textContent) {
        fresh.textContent = oldScript.textContent;
      }
      oldScript.parentNode?.replaceChild(fresh, oldScript);
    }
  }, [html]);

  if (!html?.trim()) return null;

  return (
    <div
      ref={containerRef}
      data-custom-slot={slotName}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};
