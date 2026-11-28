"use client";

import React, { useState, useEffect } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, LogOut, ShieldCheck } from "lucide-react";
import { SiteHeader } from "@/components/ui/SiteHeader";
import { SiteFooter } from "@/components/ui/SiteFooter";

export default function SignInPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const currentUser =
    (session?.user as {
      name?: string;
      email?: string;
      role?: string;
      image?: string;
    } | undefined) || null;
  const [callbackUrl, setCallbackUrl] = useState("/");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const cb = params.get("callbackUrl");
    const tab = params.get("tab");
    const err = params.get("error");

    if (cb) setCallbackUrl(cb);
    else if (tab === "vendor") setCallbackUrl("/vendor");
    else if (tab === "admin") setCallbackUrl("/admin");

    if (err) {
      setError(
        err === "AccessDenied"
          ? "Account suspended or not permitted."
          : `Google sign-in failed (${err}).`
      );
    }
  }, []);

  const redirectForRole = (role?: string) => {
    if (role === "ADMIN") router.push("/admin");
    else if (role === "VENDOR") router.push("/vendor");
    else router.push("/");
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    await signIn("google", { callbackUrl });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <SiteHeader />
      <main className="flex-1 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6">
        <div>
          <Link
            href="/"
            className="inline-flex items-center space-x-1.5 text-xs text-slate-400 hover:text-white mb-4 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-emerald-400" />
            <span>Back to 3D Studio</span>
          </Link>
          <h1 className="text-xl font-bold text-white tracking-tight">MyPrefabRoom Sign In</h1>
          <p className="text-xs text-slate-400 mt-1">
            Single Google account sign-in for Buyers, Verified Makers &amp; Platform Admin.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-950/50 border border-red-800 text-xs text-red-300">
            {error}
          </div>
        )}

        {currentUser ? (
          <div className="p-4 rounded-2xl bg-slate-950 border border-emerald-500/30 space-y-3 text-xs">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="font-bold text-white truncate">
                  {currentUser.name || currentUser.email}
                </div>
                <div className="text-[11px] text-slate-400 truncate">{currentUser.email}</div>
                <div className="text-[11px] text-emerald-400 font-mono mt-0.5 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{currentUser.role}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => redirectForRole(currentUser.role)}
                className="flex-1 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition"
              >
                Open Portal
              </button>
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/auth/signin" })}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 inline-flex items-center gap-1.5 transition"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <button
              type="button"
              disabled={loading}
              onClick={handleGoogleSignIn}
              className="w-full py-3 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-sm flex items-center justify-center space-x-3 border border-slate-200 shadow-lg transition disabled:opacity-60"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin text-slate-700" />
              ) : (
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
                  />
                </svg>
              )}
              <span>Continue with Google</span>
            </button>

            <p className="text-[11px] text-center text-slate-500 leading-relaxed">
              By signing in, you agree to our{" "}
              <Link href="/terms" className="text-emerald-400 hover:underline">
                Terms
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="text-emerald-400 hover:underline">
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        )}
      </div>
      </main>
      <SiteFooter />
    </div>
  );
}
