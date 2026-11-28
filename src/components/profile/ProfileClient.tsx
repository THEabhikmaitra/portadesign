"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  Box,
  Check,
  Copy,
  Download,
  Eye,
  GitFork,
  Globe,
  Loader2,
  Lock,
  Save,
  Share2,
  Trash2,
  User as UserIcon,
} from "lucide-react";

interface DesignItem {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  isPublic: boolean;
  previewImage: string | null;
  viewCount: number;
  shareCount: number;
  remixCount: number;
  updatedAt: string;
  versions: Array<{
    versionNumber: number;
    bomJson: string;
    sceneJson: string;
  }>;
}

interface UserProfile {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  role: string;
  xp: number;
  createdAt: string;
  designs: DesignItem[];
  _count?: { quotesSent: number };
}

function parseBom(bomJson?: string) {
  try {
    return bomJson ? JSON.parse(bomJson) : null;
  } catch {
    return null;
  }
}

function downloadDesignPdf(design: DesignItem, ownerName: string) {
  const bom = parseBom(design.versions?.[0]?.bomJson);
  const items: any[] = bom?.items || [];
  const rowsHtml = items
    .map(
      (it) => `
      <tr>
        <td style="padding:8px;border-bottom:1px solid #e2e8f0;font-family:monospace;">${it.code || ""}</td>
        <td style="padding:8px;border-bottom:1px solid #e2e8f0;">${it.name || ""}</td>
        <td style="padding:8px;border-bottom:1px solid #e2e8f0;text-align:center;">${it.count || 1}</td>
        <td style="padding:8px;border-bottom:1px solid #e2e8f0;text-align:right;">₹${Number(it.unitPrice || 0).toLocaleString("en-IN")}</td>
        <td style="padding:8px;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:700;">₹${Number(it.total || 0).toLocaleString("en-IN")}</td>
      </tr>`
    )
    .join("");

  const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${design.title} - MyPrefabRoom Spec</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; color: #0f172a; padding: 32px; max-width: 820px; margin: 0 auto; }
    h1 { margin: 0 0 6px; font-size: 22px; }
    .meta { color: #475569; font-size: 12px; margin-bottom: 20px; }
    img { max-width: 100%; max-height: 280px; border-radius: 12px; border: 1px solid #cbd5e1; margin-bottom: 20px; object-fit: cover; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 12px; }
    th { text-align: left; background: #f1f5f9; padding: 8px; border-bottom: 2px solid #cbd5e1; }
    .totals { margin-top: 18px; margin-left: auto; width: 280px; font-size: 13px; }
    .totals div { display: flex; justify-content: space-between; padding: 4px 0; }
    .grand { border-top: 2px solid #0f172a; font-weight: 800; font-size: 15px; padding-top: 8px !important; }
    @media print { body { padding: 12px; } }
  </style>
</head>
<body>
  <h1>${design.title}</h1>
  <div class="meta">Creator: ${ownerName} | Updated: ${new Date(design.updatedAt).toLocaleDateString()} | Views: ${design.viewCount} | Shares: ${design.shareCount} | Remixes: ${design.remixCount}</div>
  ${design.description ? `<p style="font-size:13px;color:#334155;">${design.description}</p>` : ""}
  ${design.previewImage ? `<img src="${design.previewImage}" alt="${design.title}" />` : ""}
  <h2 style="font-size:15px;margin:16px 0 6px;">Bill of Materials &amp; Cost Estimate</h2>
  <table>
    <thead>
      <tr>
        <th>Code</th><th>Item</th><th style="text-align:center;">Qty</th><th style="text-align:right;">Unit Rate</th><th style="text-align:right;">Total</th>
      </tr>
    </thead>
    <tbody>${rowsHtml || '<tr><td colspan="5" style="padding:10px;color:#64748b;">No BOM line items saved.</td></tr>'}</tbody>
  </table>
  ${
    bom
      ? `<div class="totals">
          <div><span>Subtotal</span><span>₹${Number(bom.subtotal || 0).toLocaleString("en-IN")}</span></div>
          <div><span>GST (18%)</span><span>₹${Number(bom.tax || 0).toLocaleString("en-IN")}</span></div>
          <div class="grand"><span>Estimated Total</span><span>₹${Number(bom.totalCost || 0).toLocaleString("en-IN")}</span></div>
        </div>`
      : ""
  }
  <script>window.onload = () => { window.print(); };</script>
</body>
</html>`;

  const w = window.open("", "_blank", "width=900,height=700");
  if (!w) return;
  w.document.open();
  w.document.write(html);
  w.document.close();
}

export const ProfileClient: React.FC<{
  initialProfile?: UserProfile | null;
}> = ({ initialProfile = null }) => {
  const { data: session } = useSession();
  const sessionUser =
    (session?.user as {
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: string | null;
    } | undefined) || null;

  const [profile, setProfile] = useState<UserProfile | null>(initialProfile);
  const [loading, setLoading] = useState(!initialProfile);
  const [unauth, setUnauth] = useState(false);

  const [editName, setEditName] = useState(initialProfile?.name || "");
  const [editPhone, setEditPhone] = useState(initialProfile?.phone || "");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<string | null>(null);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  const loadProfile = async () => {
    if (!profile) setLoading(true);
    try {
      const res = await fetch("/api/profile", { cache: "no-store" });
      if (res.status === 401) {
        setUnauth(true);
        return;
      }
      const data = await res.json();
      if (data.user) {
        setProfile(data.user);
        setEditName(data.user.name || "");
        setEditPhone(data.user.phone || "");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!initialProfile) {
      loadProfile();
    }
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMsg(null);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName, phone: editPhone }),
      });
      const data = await res.json();
      if (res.ok && data.user) {
        setProfile((prev) => (prev ? { ...prev, ...data.user } : prev));
        setProfileMsg("Profile updated");
      } else {
        setProfileMsg(data.error || "Update failed");
      }
    } finally {
      setSavingProfile(false);
    }
  };

  const handleToggleVisibility = async (design: DesignItem) => {
    const nextPublic = !design.isPublic;
    setProfile((prev) =>
      prev
        ? {
            ...prev,
            designs: prev.designs.map((d) =>
              d.id === design.id ? { ...d, isPublic: nextPublic } : d
            ),
          }
        : prev
    );
    await fetch(`/api/designs/${design.slug}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPublic: nextPublic }),
    });
  };

  const handleShare = async (design: DesignItem) => {
    const shareUrl = `${window.location.origin}/design/${design.slug}`;
    await navigator.clipboard.writeText(shareUrl).catch(() => {});
    setCopiedSlug(design.slug);
    setTimeout(() => setCopiedSlug(null), 2000);

    const res = await fetch(`/api/designs/${design.slug}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "increment_share" }),
    });
    if (res.ok) {
      const data = await res.json();
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              designs: prev.designs.map((d) =>
                d.slug === design.slug ? { ...d, shareCount: data.design.shareCount } : d
              ),
            }
          : prev
      );
    }
  };

  const handleDelete = async (design: DesignItem) => {
    if (!confirm(`Delete "${design.title}"?`)) return;
    const res = await fetch(`/api/designs/${design.slug}`, { method: "DELETE" });
    if (res.ok) {
      setProfile((prev) =>
        prev ? { ...prev, designs: prev.designs.filter((d) => d.id !== design.id) } : prev
      );
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex items-center justify-center text-slate-400">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
      </div>
    );
  }

  if (unauth || !profile) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-4">
        <UserIcon className="w-10 h-10 text-emerald-400 mx-auto" />
        <h1 className="text-xl font-bold text-white">Sign in to view your profile</h1>
        <p className="text-xs text-slate-400">
          Access saved 3D designs, download PDF spec sheets, and manage public visibility.
        </p>
        <Link
          href="/auth/signin?callbackUrl=/profile"
          className="inline-flex items-center px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-bold text-xs"
        >
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Profile Header & Basic Edit */}
      <section className="p-6 rounded-3xl bg-slate-900 border border-slate-800 grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            {sessionUser?.image ? (
              <img
                src={sessionUser.image}
                alt={profile.name || sessionUser.name || "Profile"}
                referrerPolicy="no-referrer"
                className="w-12 h-12 rounded-2xl object-cover border-2 border-emerald-400 shrink-0"
              />
            ) : (
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-300 font-black text-lg shrink-0">
                {(profile.name || profile.email)[0].toUpperCase()}
              </div>
            )}
            <div>
              <h1 className="text-xl font-extrabold text-white">{profile.name || "My Profile"}</h1>
              <div className="text-xs text-slate-400">{profile.email}</div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 text-[11px] font-mono">
            <span className="px-2.5 py-1 rounded-full bg-slate-950 border border-slate-800 text-emerald-300">
              {profile.designs.length} Designs
            </span>
            <span className="px-2.5 py-1 rounded-full bg-slate-950 border border-slate-800 text-cyan-300">
              {profile.xp} XP
            </span>
            {profile.role === "VENDOR" && (
              <Link href="/vendor" className="px-2.5 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 hover:underline">
                Vendor Portal
              </Link>
            )}
            {profile.role === "ADMIN" && (
              <Link href="/admin" className="px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 hover:underline">
                Admin Console
              </Link>
            )}
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Display Name</label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Your name"
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white"
            />
          </div>
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Phone</label>
            <input
              type="text"
              value={editPhone}
              onChange={(e) => setEditPhone(e.target.value)}
              placeholder="+91 ..."
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white"
            />
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="submit"
              disabled={savingProfile}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs inline-flex items-center justify-center space-x-1.5 disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{savingProfile ? "Saving..." : "Save Profile"}</span>
            </button>
            {profileMsg && <span className="text-xs text-emerald-400">{profileMsg}</span>}
          </div>
        </form>
      </section>

      {/* Saved Designs List */}
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-extrabold text-white">Saved Designs ({profile.designs.length})</h2>
          <Link
            href="/"
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-bold text-xs inline-flex items-center space-x-1.5"
          >
            <Box className="w-3.5 h-3.5" />
            <span>New 3D Design</span>
          </Link>
        </div>

        {profile.designs.length === 0 ? (
          <div className="p-10 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-3">
            <p className="text-sm text-slate-300">No saved designs yet.</p>
            <Link
              href="/"
              className="inline-flex items-center px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs"
            >
              Create Your First Room
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {profile.designs.map((design) => {
              const bom = parseBom(design.versions?.[0]?.bomJson);
              return (
                <div
                  key={design.id}
                  className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden flex flex-col justify-between"
                >
                  <div>
                    <div className="relative h-40 bg-slate-950 border-b border-slate-800 flex items-center justify-center">
                      {design.previewImage ? (
                        <img
                          src={design.previewImage}
                          alt={design.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Box className="w-10 h-10 text-slate-700" />
                      )}
                      <button
                        type="button"
                        onClick={() => handleToggleVisibility(design)}
                        title="Toggle Public / Private"
                        className={`absolute top-2.5 right-2.5 px-2.5 py-1 rounded-full text-[11px] font-bold inline-flex items-center space-x-1 border backdrop-blur-md transition ${
                          design.isPublic
                            ? "bg-emerald-500/20 border-emerald-400/50 text-emerald-200"
                            : "bg-slate-900/90 border-slate-700 text-slate-300"
                        }`}
                      >
                        {design.isPublic ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                        <span>{design.isPublic ? "Public" : "Private"}</span>
                      </button>
                    </div>

                    <div className="p-4 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-white text-sm line-clamp-1">{design.title}</h3>
                        {bom?.totalCost && (
                          <span className="text-xs font-mono font-bold text-emerald-400 shrink-0">
                            ₹{Number(bom.totalCost).toLocaleString("en-IN")}
                          </span>
                        )}
                      </div>
                      {design.description && (
                        <p className="text-xs text-slate-400 line-clamp-2">{design.description}</p>
                      )}

                      <div className="flex items-center gap-4 pt-1 text-[11px] font-mono text-slate-400">
                        <span className="inline-flex items-center space-x-1" title="Views">
                          <Eye className="w-3.5 h-3.5 text-cyan-400" />
                          <span>{design.viewCount}</span>
                        </span>
                        <span className="inline-flex items-center space-x-1" title="Shares">
                          <Share2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{design.shareCount}</span>
                        </span>
                        <span className="inline-flex items-center space-x-1" title="Remixes">
                          <GitFork className="w-3.5 h-3.5 text-amber-400" />
                          <span>{design.remixCount}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="px-4 py-3 bg-slate-950/60 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                    <div className="flex items-center space-x-1.5">
                      <Link
                        href={`/?design=${encodeURIComponent(design.slug)}`}
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold"
                      >
                        Open 3D
                      </Link>
                      <button
                        type="button"
                        onClick={() => downloadDesignPdf(design, profile.name || profile.email)}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold inline-flex items-center space-x-1"
                        title="Download PDF Spec"
                      >
                        <Download className="w-3 h-3" />
                        <span>PDF</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleShare(design)}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold inline-flex items-center space-x-1"
                        title="Copy Share Link"
                      >
                        {copiedSlug === design.slug ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedSlug === design.slug ? "Copied" : "Share"}</span>
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDelete(design)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10"
                      title="Delete design"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
