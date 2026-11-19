"use client";

import React from "react";
import { useStudioStore } from "@/store/useStudioStore";
import { X, FileSpreadsheet, Download, Layers } from "lucide-react";

export const BomDrawer: React.FC = () => {
  const activeDrawer = useStudioStore((state) => state.activeDrawer);
  const setActiveDrawer = useStudioStore((state) => state.setActiveDrawer);
  const getBom = useStudioStore((state) => state.getBom);

  if (activeDrawer !== "bom") return null;

  const bom = getBom();

  const handleExportCsv = () => {
    let csv = "Item Code,Description,Category,Brand,Quantity,Unit Price (INR),Total (INR)\n";
    bom.items.forEach((item) => {
      csv += `"${item.code}","${item.name}","${item.category}","${item.brand || "Standard"}",${item.count},${item.unitPrice},${item.total}\n`;
    });
    csv += `\n,,Subtotal,,,${bom.subtotal}\n`;
    csv += `,,18% GST Tax,,,${bom.tax}\n`;
    csv += `,,Grand Total,,,${bom.totalCost}\n`;

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `portadesign_bom_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full sm:w-[500px] bg-slate-900/95 backdrop-blur-xl border-l border-slate-700/80 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/60">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Bill of Materials (BOM)</h2>
            <div className="text-xs text-slate-400">Itemized manufacturing & material spec sheet</div>
          </div>
        </div>
        <button
          onClick={() => setActiveDrawer(null)}
          className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* BOM Table */}
      <div className="flex-1 overflow-y-auto p-5">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 text-[11px] uppercase">
              <th className="pb-2">Component</th>
              <th className="pb-2 text-center">Qty</th>
              <th className="pb-2 text-right">Price</th>
              <th className="pb-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-200">
            {bom.items.map((item, idx) => (
              <tr key={idx} className="hover:bg-slate-800/40">
                <td className="py-2.5 pr-2">
                  <div className="font-medium text-white">{item.name}</div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    {item.code} {item.brand && `• ${item.brand}`}
                  </div>
                </td>
                <td className="py-2.5 text-center font-mono text-slate-300">{item.count}</td>
                <td className="py-2.5 text-right font-mono text-slate-400">
                  ₹{item.unitPrice.toLocaleString("en-IN")}
                </td>
                <td className="py-2.5 text-right font-mono font-semibold text-emerald-400">
                  ₹{item.total.toLocaleString("en-IN")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Cost Summary Box */}
        <div className="mt-6 p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-2 text-xs">
          <div className="flex justify-between text-slate-400">
            <span>Material Subtotal</span>
            <span className="font-mono text-slate-200">₹{bom.subtotal.toLocaleString("en-IN")}</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Standard Prefab GST (18%)</span>
            <span className="font-mono text-slate-200">₹{bom.tax.toLocaleString("en-IN")}</span>
          </div>
          <div className="pt-2 border-t border-slate-700/80 flex justify-between text-sm font-bold">
            <span className="text-white">Estimated Grand Total</span>
            <span className="font-mono text-emerald-400">₹{bom.totalCost.toLocaleString("en-IN")}</span>
          </div>
        </div>
      </div>

      {/* Footer Action */}
      <div className="p-4 border-t border-slate-800 bg-slate-900/60">
        <button
          onClick={handleExportCsv}
          className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs transition shadow-lg"
        >
          <Download className="w-4 h-4" />
          <span>Export Full BOM to CSV</span>
        </button>
      </div>
    </div>
  );
};
