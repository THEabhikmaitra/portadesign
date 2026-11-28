"use client";

import React from "react";
import { useStudioStore } from "@/store/useStudioStore";
import { X, FileSpreadsheet, FileText, Download } from "lucide-react";
import { downloadDesignSummaryPdf } from "@/lib/pdf/designPdfExport";

export const BomDrawer: React.FC = () => {
  const activeDrawer = useStudioStore((state) => state.activeDrawer);
  const setActiveDrawer = useStudioStore((state) => state.setActiveDrawer);
  const getBom = useStudioStore((state) => state.getBom);

  if (activeDrawer !== "bom") return null;

  const bom = getBom();

  const handleExportCsv = () => {
    let csv = "Item,Category,Brand,Qty,Price (INR),Total (INR)\n";
    bom.items.forEach((item) => {
      csv += `"${item.name}","${item.category}","${item.brand || "Standard"}",${item.count},${item.unitPrice},${item.total}\n`;
    });
    csv += `\n,Subtotal,,,${bom.subtotal}\n`;
    csv += `,18% GST Tax,,,${bom.tax}\n`;
    csv += `,Total Landed Price,,,${bom.totalCost}\n`;

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `myprefabroom_list_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPdf = () => {
    const canvas = document.querySelector("canvas") as HTMLCanvasElement | null;
    let snapshot: string | null = null;
    try {
      snapshot = canvas ? canvas.toDataURL("image/jpeg", 0.92) : null;
    } catch {
      snapshot = null;
    }
    downloadDesignSummaryPdf(bom, snapshot);
  };

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full sm:w-[440px] bg-white/95 backdrop-blur-xl border-l border-slate-200 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-200 bg-slate-50">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700">
            <FileSpreadsheet className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">Your Room &amp; Cost List</h2>
            <div className="text-[11px] text-slate-500">Simple breakdown ({bom.items.length} items)</div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setActiveDrawer(null)}
          aria-label="Close list"
          className="text-slate-500 hover:text-slate-900 p-1.5 rounded-xl hover:bg-slate-200/70 transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Compact Item List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500 text-[10px] uppercase tracking-wider">
              <th className="pb-1.5 font-semibold">Item</th>
              <th className="pb-1.5 text-center font-semibold">Qty</th>
              <th className="pb-1.5 text-right font-semibold">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-800">
            {bom.items.map((item, idx) => (
              <tr key={idx} className="hover:bg-slate-50">
                <td className="py-2 pr-2">
                  <div className="font-medium text-slate-900 leading-tight">{item.name}</div>
                  {item.brand && (
                    <div className="text-[10px] text-slate-500">{item.brand}</div>
                  )}
                </td>
                <td className="py-2 text-center font-mono text-slate-600">{item.count}</td>
                <td className="py-2 text-right font-mono font-semibold text-emerald-700 whitespace-nowrap">
                  ₹{item.total.toLocaleString("en-IN")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Plain Cost Summary Box */}
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
          <div className="flex justify-between text-slate-600">
            <span>Rooms &amp; Items</span>
            <span className="font-mono font-medium text-slate-900">
              ₹{(bom.subtotal - bom.foundationOrCanopyCost).toLocaleString("en-IN")}
            </span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Base &amp; Roof Setup</span>
            <span className="font-mono font-medium text-slate-900">
              ₹{bom.foundationOrCanopyCost.toLocaleString("en-IN")}
            </span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>GST (18%)</span>
            <span className="font-mono font-medium text-slate-900">
              ₹{bom.tax.toLocaleString("en-IN")}
            </span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Delivery &amp; Assembly</span>
            <span className="font-mono font-medium text-amber-700">
              ₹{(bom.transportCost + bom.craneOrAssemblyCost).toLocaleString("en-IN")}
            </span>
          </div>
          <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-bold">
            <span className="text-slate-900">Total Landed Price</span>
            <span className="font-mono text-emerald-700">
              ₹{bom.totalCost.toLocaleString("en-IN")}
            </span>
          </div>
        </div>
      </div>

      {/* Footer Actions: Real PDF (with 3D Design) + CSV */}
      <div className="p-3.5 border-t border-slate-200 bg-slate-50 flex items-center gap-2">
        <button
          type="button"
          onClick={handleExportPdf}
          className="flex-1 flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white font-bold text-xs transition shadow-sm active:scale-[0.99]"
        >
          <FileText className="w-4 h-4" />
          <span>Download PDF (with 3D Design)</span>
        </button>
        <button
          type="button"
          onClick={handleExportCsv}
          title="Download spreadsheet (CSV)"
          className="flex items-center justify-center space-x-1 py-2.5 px-3 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-semibold text-xs transition"
        >
          <Download className="w-3.5 h-3.5" />
          <span>CSV</span>
        </button>
      </div>
    </div>
  );
};
