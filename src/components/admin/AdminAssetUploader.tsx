"use client";

import React, { useState, useRef } from "react";
import { Upload, X, Loader2, Image as ImageIcon } from "lucide-react";

interface AdminAssetUploaderProps {
  label: string;
  bucket: "icons" | "photos" | "textures" | "presets" | "badges";
  value: string;
  onChange: (url: string) => void;
}

export const AdminAssetUploader: React.FC<AdminAssetUploaderProps> = ({
  label,
  bucket,
  value,
  onChange,
}) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleFile = async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("bucket", bucket);

      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      onChange(data.url);
    } catch (err: any) {
      setError(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-1.5">
      <label className="block text-[11px] font-medium text-slate-400">{label}</label>
      <div className="flex items-center space-x-2">
        <div className="w-11 h-11 rounded-xl border border-slate-700 bg-slate-950 flex items-center justify-center overflow-hidden shrink-0">
          {value ? (
            <img src={value} alt={label} className="w-full h-full object-cover" />
          ) : (
            <ImageIcon className="w-4 h-4 text-slate-600" />
          )}
        </div>

        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center space-x-1.5">
            <input
              ref={inputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
            />
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[11px] font-semibold text-white transition disabled:opacity-50"
            >
              {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3 text-cyan-400" />}
              <span>{uploading ? "Uploading..." : "Upload Image"}</span>
            </button>

            {value && (
              <button
                type="button"
                onClick={() => onChange("")}
                className="p-1.5 rounded-lg bg-red-500/15 hover:bg-red-500/25 text-red-300"
                title="Clear image"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <input
            type="text"
            placeholder="or paste /uploads/catalog/... URL"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-2.5 py-1 bg-slate-950 border border-slate-800 rounded-lg text-[10px] font-mono text-slate-300"
          />
        </div>
      </div>
      {error && <div className="text-[10px] text-red-400">{error}</div>}
    </div>
  );
};
