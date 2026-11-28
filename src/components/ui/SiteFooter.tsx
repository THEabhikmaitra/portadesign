import React from "react";
import Link from "next/link";

export const SiteFooter: React.FC = () => {
  return (
    <footer className="border-t border-slate-800 bg-slate-900/50 py-8 mt-10 text-xs text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-wrap items-center justify-between gap-4">
        <span>© {new Date().getFullYear()} MyPrefabRoom.</span>
        <div className="flex flex-wrap items-center gap-4">
          <Link href="/" className="hover:text-white transition">
            3D Configurator
          </Link>
          <Link href="/guides" className="hover:text-white transition">
            Guides
          </Link>
          <Link href="/about" className="hover:text-white transition">
            About
          </Link>
          <Link href="/contact" className="hover:text-white transition">
            Contact
          </Link>
          <Link href="/privacy" className="hover:text-white transition">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-white transition">
            Terms
          </Link>
        </div>
      </div>
    </footer>
  );
};
