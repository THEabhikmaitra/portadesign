export interface ParsedHeadElement {
  tag: "meta" | "link" | "script" | "style";
  attrs: Record<string, string>;
  inner: string;
}

function parseAttributes(attrText: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const attrRegex = /([a-zA-Z0-9:-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g;
  let m: RegExpExecArray | null;
  while ((m = attrRegex.exec(attrText)) !== null) {
    const key = m[1];
    if (!key) continue;
    const rawVal = m[2] ?? m[3] ?? m[4] ?? "";
    const normalizedKey =
      key === "class"
        ? "className"
        : key === "charset"
        ? "charSet"
        : key === "crossorigin"
        ? "crossOrigin"
        : key === "http-equiv"
        ? "httpEquiv"
        : key === "fetchpriority"
        ? "fetchPriority"
        : key;
    attrs[normalizedKey] = rawVal;
  }
  return attrs;
}

/**
 * Pure server-safe parser for <meta>, <link>, <script>, <style> tags pasted into headerHtml
 * so Next.js Server Components render valid elements inside <head>.
 */
export function parseSafeHeadTags(rawHtml: string): ParsedHeadElement[] {
  if (!rawHtml?.trim()) return [];
  const items: ParsedHeadElement[] = [];

  const pairedRegex = /<(script|style)\b([^>]*)>([\s\S]*?)<\/\1>/gi;
  let m: RegExpExecArray | null;
  while ((m = pairedRegex.exec(rawHtml)) !== null) {
    items.push({
      tag: m[1].toLowerCase() as "script" | "style",
      attrs: parseAttributes(m[2] || ""),
      inner: (m[3] || "").trim(),
    });
  }

  const voidRegex = /<(meta|link)\b([^>]*?)\s*\/?>/gi;
  while ((m = voidRegex.exec(rawHtml)) !== null) {
    items.push({
      tag: m[1].toLowerCase() as "meta" | "link",
      attrs: parseAttributes(m[2] || ""),
      inner: "",
    });
  }

  return items;
}
