import { LlmProviderType, LlmRuntimeConfig } from "./types";

export interface ProviderDetectionResult {
  localEngineAllowed: boolean;
  ollama: {
    online: boolean;
    baseUrl: string;
    configuredModel: string;
    installedModels: string[];
  };
  envKeys: {
    nvidiaNim: boolean;
    gemini: boolean;
    openrouter: boolean;
    groq: boolean;
  };
}

export interface LlmCallResult {
  ok: boolean;
  engineUsed: string;
  text: string;
  error?: string;
}

export function isLocalSeoEngineAllowed(): boolean {
  if (process.env.ALLOW_LOCAL_SEO_ENGINE === "true") return true;
  if (process.env.ALLOW_LOCAL_SEO_ENGINE === "false") return false;
  return process.env.NODE_ENV !== "production";
}

export async function detectLlmProviders(): Promise<ProviderDetectionResult> {
  const baseUrl = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
  const configuredModel = process.env.OLLAMA_MODEL || "qwen2.5:3b";
  let ollamaOnline = false;
  let installedModels: string[] = [];

  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 2000);
    const res = await fetch(`${baseUrl}/api/tags`, { signal: ctrl.signal, cache: "no-store" });
    clearTimeout(t);
    if (res.ok) {
      const data = await res.json();
      ollamaOnline = true;
      installedModels = Array.isArray(data?.models) ? data.models.map((m: any) => String(m.name)) : [];
    }
  } catch {
    ollamaOnline = false;
  }

  return {
    localEngineAllowed: isLocalSeoEngineAllowed(),
    ollama: {
      online: ollamaOnline,
      baseUrl,
      configuredModel,
      installedModels,
    },
    envKeys: {
      nvidiaNim: Boolean(process.env.NVIDIA_NIM_API_KEY?.trim()),
      gemini: Boolean(process.env.GEMINI_API_KEY?.trim()),
      openrouter: Boolean(process.env.OPENROUTER_API_KEY?.trim()),
      groq: Boolean(process.env.GROQ_API_KEY?.trim()),
    },
  };
}

async function callOpenAiCompatible(
  endpoint: string,
  apiKey: string,
  model: string,
  system: string,
  user: string,
  timeoutMs = 95000,
  extraHeaders?: Record<string, string>
): Promise<string> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        ...(extraHeaders || {}),
      },
      body: JSON.stringify({
        model,
        temperature: 0.55,
        max_tokens: 4096,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
      signal: ctrl.signal,
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      throw new Error(`HTTP ${res.status}: ${errText.slice(0, 180)}`);
    }
    const data = await res.json();
    return String(data?.choices?.[0]?.message?.content || "").trim();
  } finally {
    clearTimeout(timer);
  }
}

async function callOllama(
  model: string,
  system: string,
  user: string,
  jsonMode = false
): Promise<string> {
  const baseUrl = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 120000);
  try {
    const res = await fetch(`${baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        stream: false,
        ...(jsonMode ? { format: "json" } : {}),
        options: { temperature: 0.55, num_predict: 2048 },
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
      signal: ctrl.signal,
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      throw new Error(`Ollama ${res.status}: ${errText.slice(0, 160)}`);
    }
    const data = await res.json();
    return String(data?.message?.content || "").trim();
  } finally {
    clearTimeout(timer);
  }
}

async function callGeminiFree(apiKey: string, model: string, system: string, user: string): Promise<string> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 95000);
  try {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: "user", parts: [{ text: user }] }],
        generationConfig: { temperature: 0.55, maxOutputTokens: 4096 },
      }),
      signal: ctrl.signal,
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      throw new Error(`Gemini ${res.status}: ${errText.slice(0, 180)}`);
    }
    const data = await res.json();
    const parts = data?.candidates?.[0]?.content?.parts || [];
    return parts.map((p: any) => p.text || "").join("").trim();
  } finally {
    clearTimeout(timer);
  }
}

function resolveCandidateOrder(cfg?: LlmRuntimeConfig): LlmProviderType[] {
  const chosen = cfg?.provider || "auto";
  if (chosen !== "auto") return [chosen];

  const order: LlmProviderType[] = [];
  // Respect local-first when Ollama is default, or use free BYOK key if supplied cleanly
  if (cfg?.apiKey) {
    order.push("nvidia_nim", "gemini", "openrouter", "groq");
  }
  order.push("ollama");
  if (process.env.GEMINI_API_KEY) order.push("gemini");
  if (process.env.NVIDIA_NIM_API_KEY) order.push("nvidia_nim");
  if (process.env.OPENROUTER_API_KEY) order.push("openrouter");
  if (process.env.GROQ_API_KEY) order.push("groq");
  return order;
}

export async function generateWithBestLlm(
  system: string,
  user: string,
  cfg?: LlmRuntimeConfig,
  options?: { jsonMode?: boolean }
): Promise<LlmCallResult> {
  const providers = resolveCandidateOrder(cfg);
  if (providers.includes("deterministic") && providers.length === 1) {
    return { ok: false, engineUsed: "deterministic", text: "" };
  }

  let lastError = "No LLM provider reached";

  for (const p of providers) {
    try {
      if (p === "ollama") {
        const detection = await detectLlmProviders();
        const fallbackModel = detection.ollama.installedModels[0] || detection.ollama.configuredModel;
        const model = cfg?.model || fallbackModel;
        if (!detection.ollama.online) {
          lastError = "Local Ollama offline";
          continue;
        }
        const text = await callOllama(model, system, user, Boolean(options?.jsonMode));
        if (text.length > 40) return { ok: true, engineUsed: `ollama:${model}`, text };
      }

      if (p === "nvidia_nim") {
        const key = cfg?.apiKey || process.env.NVIDIA_NIM_API_KEY || "";
        if (!key) continue;
        const model = cfg?.model || process.env.NVIDIA_NIM_MODEL || "meta/llama-3.3-70b-instruct";
        const text = await callOpenAiCompatible(
          "https://integrate.api.nvidia.com/v1/chat/completions",
          key,
          model,
          system,
          user
        );
        if (text.length > 40) return { ok: true, engineUsed: `nvidia_nim:${model}`, text };
      }

      if (p === "gemini") {
        const key = cfg?.apiKey || process.env.GEMINI_API_KEY || "";
        if (!key) continue;
        const model = cfg?.model || process.env.GEMINI_MODEL || "gemini-2.5-flash";
        const text = await callGeminiFree(key, model, system, user);
        if (text.length > 40) return { ok: true, engineUsed: `gemini:${model}`, text };
      }

      if (p === "openrouter") {
        const key = cfg?.apiKey || process.env.OPENROUTER_API_KEY || "";
        if (!key) continue;
        const model = cfg?.model || process.env.OPENROUTER_MODEL || "meta-llama/llama-3.3-70b-instruct:free";
        const text = await callOpenAiCompatible(
          "https://openrouter.ai/api/v1/chat/completions",
          key,
          model,
          system,
          user,
          95000,
          { "HTTP-Referer": "https://myprefabroom.com", "X-Title": "MyPrefabRoom SEO Studio" }
        );
        if (text.length > 40) return { ok: true, engineUsed: `openrouter:${model}`, text };
      }

      if (p === "groq") {
        const key = cfg?.apiKey || process.env.GROQ_API_KEY || "";
        if (!key) continue;
        const model = cfg?.model || process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
        const text = await callOpenAiCompatible(
          "https://api.groq.com/openai/v1/chat/completions",
          key,
          model,
          system,
          user
        );
        if (text.length > 40) return { ok: true, engineUsed: `groq:${model}`, text };
      }
    } catch (err: any) {
      lastError = err?.message || String(err);
    }
  }

  return { ok: false, engineUsed: "deterministic_grounded", text: "", error: lastError };
}
