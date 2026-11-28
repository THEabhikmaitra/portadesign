import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://myprefabroom.com"),
  title: {
    default: "MyPrefabRoom — 3D Prefab Room Designer, Cost Calculator & Buyer Guides",
    template: "%s | MyPrefabRoom",
  },
  description:
    "Design your prefab room, backyard office pod, ADU, or terrace studio in interactive 3D. Compare local manufacturer quotes, crane & freight costs, permits, and E-E-A-T cost guides.",
  openGraph: {
    siteName: "MyPrefabRoom",
    type: "website",
  },
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
