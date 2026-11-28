import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Local Studio Admin Console",
  description: "Local-only workstation administration for catalog modules, SEO guide generation, HITL review, and indexing.",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
