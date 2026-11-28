"use client";

import React, { useState } from "react";
import { Check, Copy, Eye, Share2, Star } from "lucide-react";

interface PostEngagementBarProps {
  title: string;
  url: string;
  viewsCount: number;
  ratingValue: number;
  reviewCount: number;
  initialShareCount: number;
}

export const PostEngagementBar: React.FC<PostEngagementBarProps> = ({
  title,
  url,
  viewsCount,
  ratingValue,
  reviewCount,
  initialShareCount,
}) => {
  const [copied, setCopied] = useState(false);
  const [shares, setShares] = useState(initialShareCount);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setShares((s) => s + 1);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // ignore clipboard errors
    }
  };

  const openShare = (shareUrl: string) => {
    setShares((s) => s + 1);
    window.open(shareUrl, "_blank", "noopener,noreferrer");
  };

  const encUrl = encodeURIComponent(url);
  const encTitle = encodeURIComponent(title);

  return (
    <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
      <div className="flex flex-wrap items-center gap-4">
        <div className="inline-flex items-center space-x-1.5 text-slate-200 font-mono">
          <Eye className="w-4 h-4 text-emerald-400" />
          <span className="font-bold">{viewsCount.toLocaleString()}</span>
          <span className="text-slate-400">views</span>
        </div>

        <div className="inline-flex items-center space-x-1.5 text-slate-200 font-mono">
          <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
          <span className="font-bold">{ratingValue.toFixed(1)}</span>
          <span className="text-slate-400">({reviewCount} reviews)</span>
        </div>

        <div className="inline-flex items-center space-x-1.5 text-slate-300 font-mono">
          <Share2 className="w-3.5 h-3.5 text-cyan-400" />
          <span>{shares.toLocaleString()} shares</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => openShare(`https://twitter.com/intent/tweet?text=${encTitle}&url=${encUrl}`)}
          className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition"
        >
          Share X
        </button>
        <button
          type="button"
          onClick={() => openShare(`https://www.linkedin.com/sharing/share-offsite/?url=${encUrl}`)}
          className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition"
        >
          LinkedIn
        </button>
        <button
          type="button"
          onClick={() => openShare(`https://wa.me/?text=${encTitle}%20${encUrl}`)}
          className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition"
        >
          WhatsApp
        </button>
        <button
          type="button"
          onClick={handleCopy}
          className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold inline-flex items-center space-x-1.5 transition"
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? "Copied!" : "Copy Link"}</span>
        </button>
      </div>
    </div>
  );
};
