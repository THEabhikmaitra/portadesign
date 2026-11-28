import React from "react";
import Link from "next/link";
import { SortableSearchableTable } from "./SortableSearchableTable";

function renderInlineFormatting(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let k = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    const token = match[0];
    if (token.startsWith("**") && token.endsWith("**")) {
      parts.push(
        <strong key={`b-${k++}`} className="font-semibold text-white">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith("[")) {
      const m = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (m) {
        const href = m[2].startsWith("/") || m[2].startsWith("https://") ? m[2] : "/";
        parts.push(
          <Link key={`l-${k++}`} href={href} className="text-emerald-400 hover:text-emerald-300 underline underline-offset-4 font-medium">
            {m[1]}
          </Link>
        );
      } else {
        parts.push(token);
      }
    }
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  return parts;
}

export const GuideMarkdownView: React.FC<{ markdown: string }> = ({ markdown }) => {
  const lines = String(markdown || "").replace(/\r\n/g, "\n").split("\n");
  const blocks: React.ReactNode[] = [];
  let i = 0;
  let keyCounter = 0;

  while (i < lines.length) {
    const raw = lines[i];
    const line = raw.trim();

    if (!line || /^(-{3,}|\*{3,}|_{3,})$/.test(line)) {
      i++;
      continue;
    }

    // Markdown Table block
    if (line.startsWith("|") && i + 1 < lines.length && lines[i + 1].trim().startsWith("|---")) {
      const headerCells = line.split("|").map((c) => c.trim()).filter(Boolean);
      i += 2; // skip header + separator
      const rows: string[][] = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        rows.push(lines[i].trim().split("|").map((c) => c.trim()).filter(Boolean));
        i++;
      }
      blocks.push(
        <SortableSearchableTable
          key={`tbl-${keyCounter++}`}
          headers={headerCells}
          rows={rows}
        />
      );
      continue;
    }

    // Headings
    if (line.startsWith("### ")) {
      blocks.push(
        <h3 key={`h3-${keyCounter++}`} className="text-lg font-bold text-cyan-300 mt-6 mb-2.5">
          {renderInlineFormatting(line.slice(4))}
        </h3>
      );
      i++;
      continue;
    }

    if (line.startsWith("#### ")) {
      blocks.push(
        <h4 key={`h4-${keyCounter++}`} className="text-base font-bold text-white mt-4 mb-2">
          {renderInlineFormatting(line.slice(5))}
        </h4>
      );
      i++;
      continue;
    }

    // Blockquote
    if (line.startsWith("> ")) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("> ")) {
        quoteLines.push(lines[i].trim().slice(2));
        i++;
      }
      blocks.push(
        <blockquote
          key={`bq-${keyCounter++}`}
          className="my-4 p-4 rounded-2xl border-l-4 border-emerald-500 bg-emerald-950/40 text-slate-200 text-sm leading-relaxed"
        >
          {renderInlineFormatting(quoteLines.join(" "))}
        </blockquote>
      );
      continue;
    }

    // Bullet / Numbered list
    if (/^([-*]|\d+\.)\s+/.test(line)) {
      const ordered = /^\d+\./.test(line);
      const listItems: string[] = [];
      while (i < lines.length && /^([-*]|\d+\.)\s+/.test(lines[i].trim())) {
        listItems.push(lines[i].trim().replace(/^([-*]|\d+\.)\s+/, ""));
        i++;
      }
      const ListTag = ordered ? "ol" : "ul";
      blocks.push(
        <ListTag
          key={`list-${keyCounter++}`}
          className={`my-3 pl-5 space-y-2 text-slate-200 text-sm sm:text-base leading-relaxed ${
            ordered ? "list-decimal" : "list-disc"
          }`}
        >
          {listItems.map((item, idx) => (
            <li key={idx}>{renderInlineFormatting(item)}</li>
          ))}
        </ListTag>
      );
      continue;
    }

    // Paragraph
    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !lines[i].trim().startsWith("#") &&
      !lines[i].trim().startsWith("|") &&
      !lines[i].trim().startsWith("> ") &&
      !/^([-*]|\d+\.)\s+/.test(lines[i].trim())
    ) {
      paraLines.push(lines[i].trim());
      i++;
    }

    if (paraLines.length > 0) {
      blocks.push(
        <p key={`p-${keyCounter++}`} className="my-3.5 text-slate-200 text-sm sm:text-base leading-7">
          {renderInlineFormatting(paraLines.join(" "))}
        </p>
      );
    } else {
      i++;
    }
  }

  return <div>{blocks}</div>;
};
