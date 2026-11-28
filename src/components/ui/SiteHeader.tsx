import React from "react";
import Link from "next/link";
import { Box } from "lucide-react";
import { HeaderProfileButton } from "@/components/ui/HeaderProfileButton";

export const SiteHeader: React.FC = () => {
  return (
    <header className="border-b border-slate-800 bg-slate-900/85 backdrop-blur-md sticky top-0 z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center space-x-6">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-emerald-400 to-cyan-400 flex items-center justify-center text-slate-950 font-black text-sm">
              M
            </div>
            <span className="font-extrabold text-sm sm:text-base text-white">
              MyPrefab<span className="text-emerald-400">Room</span>
            </span>
          </Link>
          <nav aria-label="Main navigation" className="hidden md:flex items-center space-x-5 text-xs font-medium text-slate-300">
            <Link href="/guides" className="hover:text-white transition">
              Guides
            </Link>
            <Link href="/about" className="hover:text-white transition">
              About
            </Link>
            <Link href="/contact" className="hover:text-white transition">
              Contact
            </Link>
          </nav>
        </div>

        <div className="flex items-center space-x-2.5 text-xs">
          <HeaderProfileButton />
          <Link
            href="/"
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-bold inline-flex items-center space-x-1.5"
          >
            <Box className="w-3.5 h-3.5" />
            <span>Open 3D Designer</span>
          </Link>
        </div>
      </div>
    </header>
  );
};
