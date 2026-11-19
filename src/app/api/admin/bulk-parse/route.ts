import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface ParsedItem {
  category: string;
  code: string;
  name: string;
  brand?: string;
  costModifier?: number;
  baseCost?: number;
  specsJson?: any;
  shaderJson?: {
    color: string;
    roughness: number;
    metalness: number;
    transmission?: number;
    ior?: number;
    clearcoat?: number;
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { rawText, format = "text", autoCommit = false } = body;

    if (!rawText || !rawText.trim()) {
      return NextResponse.json({ error: "Catalog content is required" }, { status: 400 });
    }

    let parsedItems: ParsedItem[] = [];
    let parserEngineUsed = "deterministic_fallback";

    // 1. Try local Ollama AI first (http://localhost:11434/api/chat)
    const OLLAMA_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
    const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "qwen2.5";

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500); // 3.5s timeout

      const prompt = `You are a 3D WebGL Portacabin Architectural Data Engineer. Parse the following unstructured vendor catalog text into an array of JSON objects.
For each item, output:
- category: one of ["CABIN", "GLASS_TYPE", "FRAME_MATERIAL", "WALL_FINISH", "EQUIPMENT"]
- code: unique uppercase identifier (e.g. GLASS_SOLAR_GREY, AC_VOLTAS_2T)
- name: clear title
- brand: manufacturer brand name
- baseCost: estimated base cost number in INR
- costModifier: price delta modifier number in INR
- shaderJson: Three.js PBR shader values with color (hex), roughness (0-1), metalness (0-1), transmission (0-1 for glass), ior (1.5 for glass)

Return ONLY valid JSON array with no markdown backticks or commentary.

Vendor Catalog Text:
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
        parsedItems = JSON.parse(cleanJson);
        parserEngineUsed = `ollama_${OLLAMA_MODEL}`;
      }
    } catch (ollamaErr) {
      console.log("Ollama offline or timed out; falling back to deterministic parser engine.");
    }

    // 2. Deterministic Regex / CSV Parser Fallback
    if (!parsedItems || parsedItems.length === 0) {
      parserEngineUsed = "deterministic_parser";
      parsedItems = parseCatalogDeterministically(rawText);
    }

    // 3. If autoCommit is requested, save to MasterElement or MasterAttribute in SQLite
    if (autoCommit && parsedItems.length > 0) {
      for (const item of parsedItems) {
        if (item.category === "CABIN" || item.category === "EQUIPMENT") {
          await prisma.masterElement.upsert({
            where: { code: item.code },
            update: {
              name: item.name,
              category: item.category,
              baseCost: item.baseCost || 15000,
            },
            create: {
              category: item.category,
              code: item.code,
              name: item.name,
              dimensionsJson: JSON.stringify({ width: 2.4, height: 2.6, length: 6.0 }),
              baseCost: item.baseCost || 15000,
              mountZone: item.category === "EQUIPMENT" ? "ROOF_TOP" : "FLOOR_INTERIOR",
            },
          });
        } else {
          // Attribute (GLASS_TYPE, FRAME_MATERIAL, WALL_FINISH)
          await prisma.masterAttribute.upsert({
            where: { code: item.code },
            update: {
              name: item.name,
              category: item.category,
              brand: item.brand,
              costModifier: item.costModifier || 0,
              shaderJson: JSON.stringify(item.shaderJson || { color: "#ffffff", roughness: 0.2, metalness: 0.1 }),
            },
            create: {
              category: item.category,
              code: item.code,
              name: item.name,
              brand: item.brand,
              costModifier: item.costModifier || 0,
              shaderJson: JSON.stringify(item.shaderJson || { color: "#ffffff", roughness: 0.2, metalness: 0.1 }),
            },
          });
        }
      }
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

// Deterministic Parser Engine for CSV / Unstructured Text
function parseCatalogDeterministically(rawText: string): ParsedItem[] {
  const items: ParsedItem[] = [];
  const lines = rawText.split(/\r?\n/).filter((l) => l.trim().length > 0);

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("#") || trimmed.startsWith("//")) continue;

    // Check for CSV format (comma or tab separated)
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
          brand,
          baseCost: cost,
          costModifier: cost > 10000 ? cost : 0,
          shaderJson: inferShader(cat, name),
        });
        continue;
      }
    }

    // Unstructured text sentence parsing
    const cat = inferCategory(trimmed);
    const brand = inferBrand(trimmed);
    const costMatch = trimmed.match(/(?:₹|INR|Rs\.?)\s*([\d,]+)/i);
    const cost = costMatch ? parseInt(costMatch[1].replace(/,/g, ""), 10) : 18000;
    const code = generateCode(cat, trimmed);

    items.push({
      category: cat,
      code,
      name: trimmed.substring(0, 50),
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
  if (lower.includes("cabin") || lower.includes("container") || lower.includes("module")) return "CABIN";
  return "EQUIPMENT";
}

function inferBrand(text: string): string {
  const lower = text.toLowerCase();
  if (lower.includes("saint-gobain") || lower.includes("saint gobain")) return "Saint-Gobain";
  if (lower.includes("ais") || lower.includes("asahi")) return "AIS Glass";
  if (lower.includes("daikin")) return "Daikin";
  if (lower.includes("voltas")) return "Voltas";
  if (lower.includes("tata")) return "Tata Steel / Solar";
  if (lower.includes("jindal")) return "Jindal Aluminium";
  if (lower.includes("fenesta")) return "Fenesta";
  if (lower.includes("godrej")) return "Godrej Interio";
  if (lower.includes("sintex")) return "Sintex";
  return "Modular Standard";
}

function generateCode(category: string, name: string): string {
  const clean = name
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "_")
    .replace(/_+/g, "_")
    .substring(0, 16);
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
    if (lower.includes("alum") || lower.includes("charcoal")) {
      return { color: "#2b3038", roughness: 0.3, metalness: 0.85 };
    }
    if (lower.includes("upvc") || lower.includes("white")) {
      return { color: "#f8f9fa", roughness: 0.2, metalness: 0.05 };
    }
    return { color: "#3d454f", roughness: 0.35, metalness: 0.9 };
  }

  return { color: "#475569", roughness: 0.45, metalness: 0.2 };
}
