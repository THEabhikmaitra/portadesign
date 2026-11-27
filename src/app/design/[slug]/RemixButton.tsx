"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { GitFork, Loader2 } from "lucide-react";

interface RemixButtonProps {
  originalSlug: string;
  originalTitle: string;
  isFullWidth?: boolean;
}

export const RemixButton: React.FC<RemixButtonProps> = ({
  originalSlug,
  originalTitle,
  isFullWidth,
}) => {
  const router = useRouter();
  const [isRemixing, setIsRemixing] = useState(false);

  const handleRemix = async () => {
    setIsRemixing(true);
    try {
      const res = await fetch(`/api/designs/${originalSlug}/remix`, {
        method: "POST",
      });
      if (res.status === 401) {
        router.push("/auth/signin");
        return;
      }
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to remix design");
      }

      const remixedSlug = data.design?.slug || data.slug;
      router.push(`/?remix=${remixedSlug}`);
    } catch (err: any) {
      alert(err.message || "Failed to remix design");
      setIsRemixing(false);
    }
  };

  return (
    <button
      onClick={handleRemix}
      disabled={isRemixing}
      className={`flex items-center justify-center space-x-2 py-3 px-5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-xs transition shadow-lg disabled:opacity-50 ${
        isFullWidth ? "w-full" : ""
      }`}
    >
      {isRemixing ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <GitFork className="w-4 h-4" />
      )}
      <span>{isRemixing ? "Forking Architecture..." : "Customize / Remix This Design"}</span>
    </button>
  );
};
