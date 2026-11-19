import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PORTADESIGN 3D - Gamified Modular Portacabin Configurator & Marketplace",
  description:
    "100% Offline-Capable Photorealistic 3D Portacabin & Prefab Modular Configurator, Multi-Vendor Live Quotes, and AI-Assisted Catalog Platform.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
