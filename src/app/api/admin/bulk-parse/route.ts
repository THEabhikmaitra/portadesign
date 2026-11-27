import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, logAdminAction } from "@/lib/authGuard";

interface ParsedItem {
  category: string;
  code: string;
  name: string;
  friendlyName?: string;
  brand?: string;
  mountZone?: string;
  costModifier?: number;
  baseCost?: number;
  specsJson?: any;
  dimensionsJson?: any;
  shaderJson?: {
    color: string;
    roughness: number;
    metalness: number;
    transmission?: number;
    ior?: number;
    clearcoat?: number;
  };
}

const ELEMENT_CATEGORIES = new Set(["CABIN", "DOOR", "WINDOW", "EQUIPMENT", "STAIRS", "POD"]);

export async function POST(req: NextRequest) {
  try {
    const auth = await requireRole(["ADMIN"]);
    if (auth.error) return auth.error;

    const body = await req.json();
    const { rawText, autoCommit = false } = body;

    if (!rawText || !rawText.trim()) {
      return NextResponse.json({ error: "Catalog content is required" }, { status: 400 });
    }

    let parsedItems: ParsedItem[] = [];
    let parserEngineUsed = "deterministic_parser";

    const OLLAMA_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
    const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "qwen2.5";

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const prompt = `You are a 3D WebGL Portacabin Architectural Data Engineer. Parse the following catalog lines into a JSON array.
Each object must include:
- category: one of ["CABIN","DOOR","WINDOW","EQUIPMENT","STAIRS","POD","GLASS_TYPE","FRAME_MATERIAL","WALL_FINISH","BRAND","INSULATION"]
- code: unique uppercase identifier with underscores
- name: clear title
- friendlyName: simple plain name
- brand: brand string
- mountZone: for elements one of ["WALL_EXTERIOR","WALL_INTERIOR","ROOF_TOP","FLOOR_INTERIOR","PERIMETER_EDGE"]
- baseCost: number in INR
- costModifier: number in INR
- shaderJson: { color, roughness, metalness, transmission?, ior?, clearcoat? }

Return ONLY valid JSON array with no markdown or extra commentary.

Text:
${rawText}`;

      const ollamaRes = await fetch(`${OLLAMA_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: OLLAMA_MODEL,
          messages: [{ role: "user", content: prompt }],
          stream: false,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (ollamaRes.ok) {
        const ollamaJson = await ollamaRes.json();
        const content = ollamaJson.message?.content || "";
        const cleanJson = content.replace(/```json/g, "").replace(/```/g, "").trim();
        const candidate = JSON.parse(cleanJson);
        if (Array.isArray(candidate) && candidate.length > 0) {
          parsedItems = candidate;
          parserEngineUsed = `ollama_${OLLAMA_MODEL}`;
        }
      }
    } catch {
      // Fall back cleanly to CSV/text parser
    }

    if (!parsedItems || parsedItems.length === 0) {
      parserEngineUsed = "deterministic_parser";
      parsedItems = parseCatalogDeterministically(rawText);
    }

    if (autoCommit && parsedItems.length > 0) {
      for (const item of parsedItems) {
        const cat = String(item.category || "EQUIPMENT").toUpperCase();
        if (ELEMENT_CATEGORIES.has(cat)) {
          await prisma.masterElement.upsert({
            where: { code: item.code },
            update: {
              name: item.name,
              friendlyName: item.friendlyName || item.name,
              category: cat,
              mountZone: item.mountZone || (cat === "CABIN" ? "FLOOR_INTERIOR" : "ROOF_TOP"),
              baseCost: Number(item.baseCost) || 15000,
              isActive: true,
            },
            create: {
              category: cat,
              code: item.code,
              name: item.name,
              friendlyName: item.friendlyName || item.name,
              dimensionsJson: JSON.stringify(
                item.dimensionsJson || { width: 1.2, height: 1.2, depth: 0.8 }
              ),
              baseCost: Number(item.baseCost) || 15000,
              mountZone: item.mountZone || (cat === "CABIN" ? "FLOOR_INTERIOR" : "ROOF_TOP"),
              optionsJson: JSON.stringify({
                spotLabel: `Auto-fits on ${(item.mountZone || "FLOOR_INTERIOR").toLowerCase().replace("_", " ")}`,
                brands: item.brand ? [{ name: item.brand, modifier: 0, description: item.name }] : [],
                capacities: [{ label: "Standard", modifier: 0, multiplier: 1 }],
              }),
              threeConfigJson: JSON.stringify({
                primitives: [
                  {
                    shape: "box",
                    args: [1.0, 0.8, 0.6],
                    position: [0, 0.4, 0],
                    color: item.shaderJson?.color || "#64748b",
                    roughness: 0.4,
                    metalness: 0.4,
                  },
                ],
              }),
            },
          });
        } else {
          await prisma.masterAttribute.upsert({
            where: { code: item.code },
            update: {
              name: item.name,
              friendlyName: item.friendlyName || item.name,
              category: cat,
              brand: item.brand || null,
              costModifier: Number(item.costModifier) || 0,
              shaderJson: JSON.stringify(
                item.shaderJson || { color: "#475569", roughness: 0.35, metalness: 0.25 }
              ),
              isActive: true,
            },
            create: {
              category: cat,
              code: item.code,
              name: item.name,
              friendlyName: item.friendlyName || item.name,
              brand: item.brand || null,
              costModifier: Number(item.costModifier) || 0,
              shaderJson: JSON.stringify(
                item.shaderJson || { color: "#475569", roughness: 0.35, metalness: 0.25 }
              ),
            },
          });
        }
      }

      await logAdminAction(auth.actor.id, "BULK_PARSE_COMMIT", "Catalog", undefined, {
        count: parsedItems.length,
        engine: parserEngineUsed,
      });
    }

    return NextResponse.json({
      success: true,
      engine: parserEngineUsed,
      count: parsedItems.length,
      items: parsedItems,
    });
  } catch (error: any) {
    console.error("POST /api/admin/bulk-parse error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function parseCatalogDeterministically(rawText: string): ParsedItem[] {
  const items: ParsedItem[] = [];
  const lines = rawText.split(/\r?\n/).filter((l) => l.trim().length > 0);

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("#") || trimmed.startsWith("//")) continue;

    if (trimmed.includes(",") || trimmed.includes("\t")) {
      const parts = (trimmed.includes("\t") ? trimmed.split("\t") : trimmed.split(",")).map((p) =>
        p.replace(/^["']|["']$/g, "").trim()
      );

      if (parts.length >= 3) {
        const cat = inferCategory(parts[0]);
        const name = parts[1];
        const cost = parseFloat(parts[2].replace(/[^\d.]/g, "")) || 0;
        const brand = parts[3] || inferBrand(name);
        const code = generateCode(cat, name);

        items.push({
          category: cat,
          code,
          name,
          friendlyName: name,
          brand,
          baseCost: cost,
          costModifier: cost,
          shaderJson: inferShader(cat, name),
        });
        continue;
      }
    }

    const cat = inferCategory(trimmed);
    const brand = inferBrand(trimmed);
    const costMatch = trimmed.match(/(?:₹|INR|Rs\.?)\s*([\d,]+)/i);
    const cost = costMatch ? parseInt(costMatch[1].replace(/,/g, ""), 10) : 18000;
    const code = generateCode(cat, trimmed);

    items.push({
      category: cat,
      code,
      name: trimmed.substring(0, 60),
      friendlyName: trimmed.substring(0, 40),
      brand,
      baseCost: cost,
      costModifier: cost,
      shaderJson: inferShader(cat, trimmed),
    });
  }

  return items;
}

function inferCategory(text: string): string {
  const lower = text.toLowerCase();
  if (lower.includes("glass") || lower.includes("glazing") || lower.includes("tint")) return "GLASS_TYPE";
  if (lower.includes("frame") || lower.includes("alum") || lower.includes("upvc")) return "FRAME_MATERIAL";
  if (lower.includes("paint") || lower.includes("finish") || lower.includes("coating")) return "WALL_FINISH";
  if (lower.includes("cabin") || lower.includes("container")) return "CABIN";
  if (lower.includes("door")) return "DOOR";
  if (lower.includes("window")) return "WINDOW";
  if (lower.includes("stair")) return "STAIRS";
  if (lower.includes("pod") || lower.includes("bath") || lower.includes("kitchen")) return "POD";
  return "EQUIPMENT";
}

function inferBrand(text: string): string {
  const lower = text.toLowerCase();
  if (lower.includes("saint-gobain") || lower.includes("saint gobain")) return "Saint-Gobain";
  if (lower.includes("ais") || lower.includes("asahi")) return "AIS Glass";
  if (lower.includes("daikin")) return "Daikin";
  if (lower.includes("voltas")) return "Voltas";
  if (lower.includes("tata")) return "Tata";
  if (lower.includes("jindal")) return "Jindal";
  if (lower.includes("fenesta")) return "Fenesta";
  if (lower.includes("godrej")) return "Godrej Interio";
  if (lower.includes("sintex")) return "Sintex";
  return "Standard";
}

function generateCode(category: string, name: string): string {
  const clean = name
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .substring(0, 20);
  return `${category}_${clean}`;
}

function inferShader(category: string, name: string): any {
  const lower = name.toLowerCase();
  if (category === "GLASS_TYPE") {
    if (lower.includes("tint") || lower.includes("black") || lower.includes("dark")) {
      return { color: "#1a2228", roughness: 0.08, metalness: 0.25, transmission: 0.45, ior: 1.52, clearcoat: 1.0 };
    }
    if (lower.includes("bronze") || lower.includes("gold")) {
      return { color: "#6e4a29", roughness: 0.12, metalness: 0.45, transmission: 0.4, ior: 1.54, clearcoat: 1.0 };
    }
    if (lower.includes("frost") || lower.includes("satin")) {
      return { color: "#eef2f6", roughness: 0.65, metalness: 0.05, transmission: 0.6, ior: 1.48 };
    }
    return { color: "#ffffff", roughness: 0.02, metalness: 0.05, transmission: 0.94, ior: 1.5, clearcoat: 1.0 };
  }
  if (category === "FRAME_MATERIAL") {
    if (lower.includes("alum") || lower.includes("charcoal")) return { color: "#2b3038", roughness: 0.3, metalness: 0.85 };
    if (lower.includes("upvc") || lower.includes("white")) return { color: "#f8f9fa", roughness: 0.2, metalness: 0.05 };
    return { color: "#3d454f", roughness: 0.35, metalness: 0.9 };
  }
  return { color: "#475569", roughness: 0.45, metalness: 0.2 };
}
