import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Manufacturer Partner Console",
  description: "Manage factory rate cards, crane & delivery zones, lead quotes, and prefabricated room specifications.",
  robots: { index: false, follow: false },
};

export default function VendorLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
