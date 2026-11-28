import { countWords } from "./complianceScorer";
import { generateWithBestLlm } from "./llmRouter";
import { LlmRuntimeConfig, SeoSectionBlock } from "./types";

const FILLER_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\bit is important to note that\s+/gi, ""],
  [/\bit is worth noting that\s+/gi, "Notably, "],
  [/\bit should be noted that\s+/gi, "Notably, "],
  [/\bplease note that\s+/gi, ""],
  [/\bdue to the fact that\b/gi, "because"],
  [/\bin order to\b/gi, "to"],
  [/\bwith that being said,?\s*/gi, "However, "],
  [/\bthat being said,?\s*/gi, "However, "],
  [/\bit is recommended to\b/gi, "we recommend you"],
  [/\bit is recommended that\b/gi, "we recommend"],
  [/\bone should\b/gi, "you should"],
];

const CONTRACTION_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\bIt is\b/g, "It's"],
  [/\bit is\b/g, "it's"],
  [/\bYou will\b/g, "You'll"],
  [/\byou will\b/g, "you'll"],
  [/\bYou are\b/g, "You're"],
  [/\byou are\b/g, "you're"],
  [/\bDo not\b/g, "Don't"],
  [/\bdo not\b/g, "don't"],
  [/\bDoes not\b/g, "Doesn't"],
  [/\bdoes not\b/g, "doesn't"],
  [/\bDid not\b/g, "Didn't"],
  [/\bdid not\b/g, "didn't"],
  [/\bCannot\b/g, "Can't"],
  [/\bcannot\b/g, "can't"],
  [/\bWill not\b/g, "Won't"],
  [/\bwill not\b/g, "won't"],
  [/\bIs not\b/g, "Isn't"],
  [/\bis not\b/g, "isn't"],
  [/\bAre not\b/g, "Aren't"],
  [/\bare not\b/g, "aren't"],
  [/\bThey are\b/g, "They're"],
  [/\bthey are\b/g, "they're"],
  [/\bWe are\b/g, "We're"],
  [/\bwe are\b/g, "we're"],
  [/\bThat is\b/g, "That's"],
  [/\bthat is\b/g, "that's"],
];

/**
 * Strips AI typography tells: em-dashes (—), en-dashes (–), unicode arrows (→),
 * star symbols (★/☆), and decorative emojis.
 */
export function stripAiTypographyAndIcons(text: string): string {
  return String(text || "")
    // Replace star ratings like ★★★★★ Excellent -> Excellent
    .replace(/[★☆]{2,}\s*/g, "")
    .replace(/[★☆✅✓✗❌⚠🔴🟡🟢🎯📊▶]/g, "")
    .replace(/[\uD83C-\uDBFF][\uDC00-\uDFFF]/g, "")
    // Replace unicode arrows with clean colon/hyphen
    .replace(/\s*[→⇒]\s*/g, ": ")
    .replace(/\s*[←↑↓⇐]\s*/g, " ")
    // Replace em-dashes (biggest AI formatting tell) with comma or hyphen
    .replace(/\s+—\s+/g, ", ")
    .replace(/—/g, ", ")
    // Normalize en-dashes to standard ASCII hyphen
    .replace(/–/g, "-")
    // Clean any double punctuation created by replacements
    .replace(/,\s*,/g, ",")
    .replace(/:\s*:/g, ":")
    .replace(/\s{2,}/g, " ");
}

function splitLongProseLine(line: string): string {
  const trimmed = line.trim();
  if (
    !trimmed ||
    trimmed.startsWith("#") ||
    trimmed.startsWith("|") ||
    trimmed.startsWith(">") ||
    trimmed.startsWith("```") ||
    trimmed.startsWith("- ") ||
    /^\d+\.\s/.test(trimmed) ||
    trimmed.includes("http://") ||
    trimmed.includes("https://")
  ) {
    return line;
  }

  const wordCount = trimmed.split(/\s+/).length;
  if (wordCount <= 22) return line;

  // Split at semicolons, em-dashes, or coordinating conjunctions when clauses are substantial
  return line
    .replace(/;\s+/g, ". ")
    .replace(/\s+—\s+([^—]{20,})/g, (_, rest: string) => {
      const cap = rest.charAt(0).toUpperCase() + rest.slice(1);
      return `. ${cap}`;
    })
    .replace(/,\s+(however|therefore|meanwhile|consequently)\s+/gi, (_, conj: string) => {
      const cap = conj.charAt(0).toUpperCase() + conj.slice(1).toLowerCase();
      return `. ${cap}, `;
    })
    .replace(/,\s+(and|but)\s+([^,]{28,})/gi, (_, _conj: string, rest: string) => {
      const cap = rest.charAt(0).toUpperCase() + rest.slice(1);
      return `. ${cap}`;
    });
}

/**
 * Deterministic human-editorial polish pass:
 * - Strips AI hedge/filler phrases
 * - Applies natural contractions outside tables/links/code
 * - Breaks long prose sentences (>22 words) for crisp readability
 */
export function humanizeMarkdownDeterministic(markdown: string): string {
  const lines = String(markdown || "").split("\n");
  let inCodeBlock = false;

  const processed = lines.map((rawLine) => {
    const trimmed = rawLine.trim();
    if (trimmed.startsWith("```")) {
      inCodeBlock = !inCodeBlock;
      return rawLine;
    }
    if (inCodeBlock) {
      return rawLine;
    }
    // Strip AI horizontal rule divider lines (---, ***, ___, <hr>)
    if (/^\s*([-*_]){3,}\s*$/.test(trimmed) || /^\s*<hr\s*\/?>\s*$/i.test(trimmed)) {
      return "";
    }
    if (trimmed.startsWith("|")) {
      // Keep markdown table separator lines untouched; clean dashes/icons in cell text
      return /^\|[\s:-|]+\|$/.test(trimmed) ? rawLine : stripAiTypographyAndIcons(rawLine);
    }
    if (trimmed.startsWith("#")) {
      return stripAiTypographyAndIcons(rawLine);
    }

    let line = rawLine;
    for (const [pattern, replacement] of FILLER_REPLACEMENTS) {
      line = line.replace(pattern, replacement);
    }

    // Preserve markdown links while applying contractions to prose
    const linkTokens: string[] = [];
    line = line.replace(/\[[^\]]+\]\([^)]+\)/g, (m) => {
      linkTokens.push(m);
      return `__LINK_TOKEN_${linkTokens.length - 1}__`;
    });

    for (const [pattern, replacement] of CONTRACTION_REPLACEMENTS) {
      line = line.replace(pattern, replacement);
    }

    // Ensure bullet points end with clean terminal punctuation for readability
    if (trimmed.startsWith("- ") && !/[.!?:`]$/.test(trimmed) && !trimmed.includes("|")) {
      line = `${line.trimEnd()}.`;
    }

    line = splitLongProseLine(line);
    line = stripAiTypographyAndIcons(line);

    line = line.replace(/__LINK_TOKEN_(\d+)__/g, (_, idx) => linkTokens[Number(idx)] || "");
    return line;
  });

  return processed.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

/**
 * Plain-text humanizer for titles, meta descriptions, TL;DRs, and FAQ items.
 */
export function humanizeTextPlain(text: string): string {
  let out = String(text || "");
  for (const [pattern, replacement] of FILLER_REPLACEMENTS) {
    out = out.replace(pattern, replacement);
  }
  for (const [pattern, replacement] of CONTRACTION_REPLACEMENTS) {
    out = out.replace(pattern, replacement);
  }
  return stripAiTypographyAndIcons(out).trim();
}

const HUMANIZER_SYSTEM_PROMPT = [
  "You are a senior construction editor polishing a technical prefab architecture guide.",
  "Rewrite the prose in a sharp, natural, human editorial voice while keeping ALL facts, prices, IS/building codes, Markdown tables, links, and headings 100% intact.",
  "Rules:",
  "1. Use natural contractions (it's, you'll, don't, can't, won't).",
  "2. Keep average sentence length under 20 words. Mix crisp 5-8 word punchy sentences with medium ones.",
  "3. Add grounded first-person engineering perspective where natural ('we tested', 'in our review', 'our team recommends').",
  "4. Use direct editorial takes ('Honestly,', 'The reality is', 'Worth noting:') and clear transitions ('However,', 'In contrast,', 'Specifically,').",
  "5. Zero AI filler ('it is important to note', 'in order to', 'delve', 'landscape', 'testament').",
  "6. NEVER use em-dashes (—), en-dashes (–), unicode arrows (→), star icons (★/☆), emojis, or horizontal rule lines (---, ***, ___, <hr>). Use standard hyphens (-), commas, or periods.",
  "7. Never invent prices, ratings, or citations. Keep every Markdown table and URL unchanged.",
].join("\n");

/**
 * Runs an AI editorial humanizer pass over generated sections when an LLM is available,
 * then applies deterministic polish to guarantee contractions, rhythm, and zero filler.
 */
export async function humanizeSectionsWithAi(
  sections: SeoSectionBlock[],
  params: { keyword: string; llmConfig?: LlmRuntimeConfig }
): Promise<{ sections: SeoSectionBlock[]; engineUsed: string }> {
  const useLlm = params.llmConfig?.provider && params.llmConfig.provider !== "deterministic";
  const engines = new Set<string>();
  const out: SeoSectionBlock[] = [];

  for (const sec of sections) {
    let md = sec.markdown;

    if (useLlm) {
      const res = await generateWithBestLlm(
        HUMANIZER_SYSTEM_PROMPT,
        `Topic: "${params.keyword}". Section: "${sec.heading}".\n\nPolish this Markdown section:\n\n${sec.markdown}`,
        params.llmConfig
      );
      engines.add(res.engineUsed);
      // Only accept LLM rewrite if it preserved substantial content and didn't drop tables
      const origTables = (sec.markdown.match(/^\|[^\n]+\|/gm) || []).length;
      const newTables = (res.text.match(/^\|[^\n]+\|/gm) || []).length;
      if (res.ok && countWords(res.text) >= Math.max(120, Math.round(sec.wordCount * 0.7)) && newTables >= origTables) {
        md = res.text.trim();
      }
    } else {
      engines.add("deterministic-humanizer");
    }

    const polished = humanizeMarkdownDeterministic(md);
    out.push({
      ...sec,
      markdown: polished,
      wordCount: countWords(polished),
    });
  }

  return {
    sections: out,
    engineUsed: Array.from(engines).join(", ") || "deterministic-humanizer",
  };
}
