"use client";

import React, { useState } from "react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { Box, Building2, LogOut, ShieldCheck, User } from "lucide-react";

interface SessionUser {
  id?: string | null;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string | null;
}

export const HeaderProfileButton: React.FC = () => {
  const { data: session } = useSession();
  const user = (session?.user as SessionUser | undefined) || null;
  const [open, setOpen] = useState(false);

  if (!user) {
    return (
      <Link
        href="/auth/signin"
        title="Sign in or view profile"
        className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold text-xs inline-flex items-center space-x-1.5 transition"
      >
        <User className="w-3.5 h-3.5 text-emerald-400" />
        <span className="hidden sm:inline">Sign In</span>
      </Link>
    );
  }

  const initials = (user.name || user.email || "U")
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");

  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Account Profile"
        title={`Signed in as ${user.name || user.email}`}
        className="px-2 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold text-xs inline-flex items-center space-x-2 transition"
      >
        {user.image ? (
          <img
            src={user.image}
            alt={user.name || "Profile"}
            referrerPolicy="no-referrer"
            className="w-6 h-6 rounded-full object-cover border border-emerald-400"
          />
        ) : (
          <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-emerald-500 to-cyan-500 text-slate-950 text-[10px] font-black flex items-center justify-center">
            {initials || "U"}
          </div>
        )}
        <span className="hidden sm:inline max-w-[100px] truncate">
          {user.name ? user.name.split(" ")[0] : "Profile"}
        </span>
      </button>

      {open && (
        <div className="absolute right-0 top-full pt-1.5 z-50">
          <div className="w-60 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-2 space-y-1 text-xs text-slate-200">
            <div className="px-2.5 py-2 flex items-center gap-2.5 border-b border-slate-800 mb-1">
              {user.image ? (
                <img
                  src={user.image}
                  alt={user.name || "Profile"}
                  referrerPolicy="no-referrer"
                  className="w-9 h-9 rounded-full object-cover border border-emerald-400 shrink-0"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-emerald-500 to-cyan-500 text-slate-950 text-xs font-black flex items-center justify-center shrink-0">
                  {initials || "U"}
                </div>
              )}
              <div className="min-w-0">
                <div className="font-bold text-white truncate">{user.name || user.email}</div>
                {user.email && <div className="text-[10px] text-slate-400 truncate">{user.email}</div>}
                {user.role && <div className="text-[10px] font-mono text-emerald-400">{user.role}</div>}
              </div>
            </div>

            <Link
              href="/profile"
              onClick={() => setOpen(false)}
              className="w-full flex items-center space-x-2 px-2.5 py-2 rounded-xl hover:bg-slate-800 text-emerald-300 font-semibold transition"
            >
              <User className="w-3.5 h-3.5" />
              <span>My Profile</span>
            </Link>

            <Link
              href="/"
              onClick={() => setOpen(false)}
              className="w-full flex items-center space-x-2 px-2.5 py-2 rounded-xl hover:bg-slate-800 transition"
            >
              <Box className="w-3.5 h-3.5 text-cyan-400" />
              <span>3D Studio Portal</span>
            </Link>

            {(user.role === "VENDOR" || user.role === "ADMIN") && (
              <Link
                href="/vendor"
                onClick={() => setOpen(false)}
                className="w-full flex items-center space-x-2 px-2.5 py-2 rounded-xl hover:bg-slate-800 transition"
              >
                <Building2 className="w-3.5 h-3.5 text-amber-400" />
                <span>Maker / Vendor Portal</span>
              </Link>
            )}

            {user.role === "ADMIN" && (
              <Link
                href="/admin"
                onClick={() => setOpen(false)}
                className="w-full flex items-center space-x-2 px-2.5 py-2 rounded-xl hover:bg-slate-800 transition"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Admin Console</span>
              </Link>
            )}

            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/" })}
              className="w-full flex items-center space-x-2 px-2.5 py-2 rounded-xl hover:bg-red-500/10 text-red-400 transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
