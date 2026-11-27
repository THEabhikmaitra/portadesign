import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { requireRole } from "@/lib/authGuard";

const ALLOWED_BUCKETS = new Set(["icons", "photos", "textures", "presets", "badges", "kyc"]);
const MAX_BYTES = 2 * 1024 * 1024; // 2 MB

function detectSafeExtension(buf: Buffer, mimeType: string, origName: string): string | null {
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buf.length >= 8 &&
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47
  ) {
    return "png";
  }

  // JPEG: FF D8 FF
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return "jpg";
  }

  // WEBP: RIFF....WEBP
  if (
    buf.length >= 12 &&
    buf.toString("ascii", 0, 4) === "RIFF" &&
    buf.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "webp";
  }

  // SVG (only if explicitly image/svg+xml or .svg and contains <svg)
  const ext = path.extname(origName || "").toLowerCase();
  if (mimeType === "image/svg+xml" || ext === ".svg") {
    const head = buf.toString("utf8", 0, Math.min(buf.length, 4096)).toLowerCase();
    if (head.includes("<svg")) {
      return "svg";
    }
  }

  return null;
}

function sanitizeSvg(svgRaw: string): string {
  return svgRaw
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<foreignObject[\s\S]*?<\/foreignObject>/gi, "")
    .replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/javascript:/gi, "");
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireRole(["ADMIN", "VENDOR"]);
    if (auth.error) return auth.error;

    const formData = await req.formData();
    const file = formData.get("file");
    const rawBucket = String(formData.get("bucket") || "photos").toLowerCase();
    const bucket = ALLOWED_BUCKETS.has(rawBucket) ? rawBucket : "photos";

    // Vendors may only upload into kyc
    if (auth.actor.role !== "ADMIN" && bucket !== "kyc") {
      return NextResponse.json({ error: "Only Admins can upload catalog assets" }, { status: 403 });
    }

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Missing file field" }, { status: 400 });
    }

    if (file.size === 0 || file.size > MAX_BYTES) {
      return NextResponse.json({ error: "File must be between 1 byte and 2 MB" }, { status: 400 });
    }

    const arrayBuf = await file.arrayBuffer();
    let buffer = Buffer.from(arrayBuf);
    const safeExt = detectSafeExtension(buffer, file.type, file.name);

    if (!safeExt) {
      return NextResponse.json(
        { error: "Unsupported image format. Upload valid PNG, JPG, WEBP, or SVG." },
        { status: 400 }
      );
    }

    if (safeExt === "svg") {
      buffer = Buffer.from(sanitizeSvg(buffer.toString("utf8")), "utf8");
    }

    const uploadDir = path.join(process.cwd(), "public", "uploads", "catalog", bucket);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filename = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${safeExt}`;
    const fullPath = path.join(uploadDir, filename);
    fs.writeFileSync(fullPath, buffer);

    const url = `/uploads/catalog/${bucket}/${filename}`;
    return NextResponse.json({ success: true, url, ext: safeExt, size: buffer.length });
  } catch (error: any) {
    console.error("POST /api/admin/upload error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
