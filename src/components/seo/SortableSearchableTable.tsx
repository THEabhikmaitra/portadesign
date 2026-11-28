"use client";

import React, { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, Search } from "lucide-react";

interface SortableSearchableTableProps {
  headers: string[];
  rows: string[][];
}

function parseSortableValue(val: string): { num: number | null; str: string } {
  const clean = String(val || "").replace(/[*_`]/g, "").trim();
  const numMatch = clean.replace(/,/g, "").match(/^[₹$£€A~<>]*\s*(-?\d+(?:\.\d+)?)/);
  return {
    num: numMatch ? Number(numMatch[1]) : null,
    str: clean.toLowerCase(),
  };
}

export const SortableSearchableTable: React.FC<SortableSearchableTableProps> = ({
  headers,
  rows,
}) => {
  const [query, setQuery] = useState("");
  const [sortCol, setSortCol] = useState<number | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const handleSort = (colIdx: number) => {
    if (sortCol === colIdx) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortCol(colIdx);
      setSortDir("asc");
    }
  };

  const processedRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? rows.filter((r) => r.some((cell) => String(cell || "").toLowerCase().includes(q)))
      : rows;

    if (sortCol === null) return filtered;

    return [...filtered].sort((a, b) => {
      const va = parseSortableValue(a[sortCol] || "");
      const vb = parseSortableValue(b[sortCol] || "");
      let cmp = 0;
      if (va.num !== null && vb.num !== null) {
        cmp = va.num - vb.num;
      } else {
        cmp = va.str.localeCompare(vb.str);
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [rows, query, sortCol, sortDir]);

  return (
    <div className="my-5 rounded-2xl border border-slate-700/80 bg-slate-900 overflow-hidden">
      <div className="px-4 py-2.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 bg-slate-800/60">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search table..."
            aria-label="Search table rows"
            className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white placeholder:text-slate-400 focus:outline-none focus:border-emerald-500"
          />
        </div>
        <span className="text-[11px] font-mono text-slate-400">
          {processedRows.length} / {rows.length} rows
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs sm:text-sm">
          <thead className="bg-slate-800 text-white">
            <tr>
              {headers.map((h, idx) => {
                const isActive = sortCol === idx;
                return (
                  <th
                    key={idx}
                    className="px-4 py-3 font-bold border-b border-slate-700 whitespace-nowrap"
                  >
                    <button
                      type="button"
                      onClick={() => handleSort(idx)}
                      className="inline-flex items-center space-x-1.5 hover:text-emerald-400 transition text-left font-bold"
                    >
                      <span>{h.replace(/\*\*/g, "")}</span>
                      {isActive ? (
                        sortDir === "asc" ? (
                          <ArrowUp className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <ArrowDown className="w-3.5 h-3.5 text-emerald-400" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      )}
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 text-slate-200">
            {processedRows.length === 0 ? (
              <tr>
                <td colSpan={headers.length} className="px-4 py-4 text-center text-xs text-slate-400">
                  No matching rows found.
                </td>
              </tr>
            ) : (
              processedRows.map((r, rIdx) => (
                <tr key={rIdx} className="hover:bg-slate-800/30">
                  {headers.map((_, cIdx) => (
                    <td key={cIdx} className="px-4 py-2.5 align-top">
                      {(r[cIdx] || "").replace(/\*\*/g, "")}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
