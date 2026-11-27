import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/authGuard";

export async function POST(req: NextRequest) {
  try {
    const auth = await requireRole(["ADMIN"]);
    if (auth.error) return auth.error;

    const body = await req.json();
    const {
      prompt = "",
      target = "ELEMENT", // ELEMENT | ATTRIBUTE
      category = "EQUIPMENT",
      count = 3,
      modelOverride,
    } = body;

    if (!String(prompt).trim()) {
      return NextResponse.json({ error: "Describe what modules or attributes AI should generate" }, { status: 400 });
    }

    const OLLAMA_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
    const OLLAMA_MODEL = modelOverride || process.env.OLLAMA_MODEL || "qwen2.5";
    const safeCount = Math.min(8, Math.max(1, Number(count) || 3));

    const systemPrompt =
      target === "ATTRIBUTE"
        ? `You are a Three.js Material & Indian Construction Engineer. Generate exactly ${safeCount} real-world catalog attributes as a JSON array under {"items": [...]}.
Each item schema:
{
  "category": "${category}", // WALL_FINISH | GLASS_TYPE | FRAME_MATERIAL | BRAND | INSULATION
  "code": "UPPERCASE_CODE_WITH_UNDERSCORES",
  "name": "Full technical name",
  "friendlyName": "Simple 2-3 word label",
  "brand": "Manufacturer name",
  "costModifier": 4500,
  "specs": { "note": "short key spec" },
  "shader": {
    "color": "#hex",
    "roughness": 0.35,
    "metalness": 0.2,
    "transmission": 0.0,
    "ior": 1.5,
    "clearcoat": 0.2,
    "transparent": false,
    "opacity": 1.0
  }
}
Return valid JSON only.`
        : `You are a 3D Three.js Modular Architecture Designer. Generate exactly ${safeCount} modular container room elements/utilities as JSON {"items": [...]}.
Each item schema:
{
  "category": "${category}", // EQUIPMENT | POD | STAIRS | DOOR | WINDOW | CABIN
  "subCategory": "INTERIOR | HVAC | SOLAR | PLUMBING | LIGHTING | SECURITY | ACCESS",
  "code": "UPPERCASE_UNIQUE_CODE",
  "name": "Technical Catalog Name",
  "friendlyName": "Simple Customer Name",
  "description": "1 concise sentence",
  "mountZone": "FLOOR_INTERIOR | WALL_INTERIOR | WALL_EXTERIOR | ROOF_TOP | PERIMETER_EDGE",
  "dimensions": { "width": 1.2, "height": 1.0, "depth": 0.6, "weightKg": 45 },
  "baseCost": 28000,
  "options": {
    "spotLabel": "Auto-fits inside room",
    "brands": [{ "name": "Brand A", "modifier": 0, "description": "Standard model" }, { "name": "Brand B", "modifier": 3500, "description": "Heavy duty" }],
    "capacities": [{ "label": "Standard", "modifier": 0, "multiplier": 1.0 }, { "label": "Pro", "modifier": 6000, "multiplier": 1.3 }],
    "finishes": [{ "label": "Matte White", "color": "#f8fafc", "modifier": 0 }]
  },
  "threeConfig": {
    "primitives": [
      { "shape": "box", "args": [1.2, 0.8, 0.6], "position": [0, 0.4, 0], "rotation": [0,0,0], "color": "#cbd5e1", "roughness": 0.4, "metalness": 0.3 },
      { "shape": "cylinder", "args": [0.05, 0.05, 0.4, 16], "position": [0.4, 0.2, 0.2], "rotation": [0,0,0], "color": "#1e293b", "roughness": 0.3, "metalness": 0.8 }
    ]
  }
}
Make primitive shapes realistic and centered near origin [0, y, 0] with y >= 0 for floor items. Return valid JSON only.`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 35000);

    let res: Response;
    try {
      res = await fetch(`${OLLAMA_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: OLLAMA_MODEL,
          format: "json",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: String(prompt) },
          ],
          stream: false,
        }),
        signal: controller.signal,
      });
    } catch (fetchErr: any) {
      clearTimeout(timeoutId);
      return NextResponse.json(
        {
          error: `Local Ollama server unreachable at ${OLLAMA_URL} (${fetchErr?.message || "timeout"}). Start Ollama with 'ollama run ${OLLAMA_MODEL}' or add items manually.`,
          ollamaOffline: true,
        },
        { status: 503 }
      );
    }

    clearTimeout(timeoutId);

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      return NextResponse.json(
        {
          error: `Ollama returned ${res.status}: ${errText || "Model error"}. Check installed model with 'ollama list'.`,
          ollamaOffline: true,
        },
        { status: 503 }
      );
    }

    const data = await res.json();
    const content = data?.message?.content || "";
    const cleaned = content.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(cleaned);
    const items = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.items) ? parsed.items : [];

    if (!items.length) {
      return NextResponse.json(
        { error: "AI returned empty catalog items. Refine prompt and try again." },
        { status: 422 }
      );
    }

    return NextResponse.json({
      success: true,
      engine: `ollama_${OLLAMA_MODEL}`,
      target,
      items,
    });
  } catch (error: any) {
    console.error("POST /api/admin/ai-generate error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
