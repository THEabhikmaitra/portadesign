import { BomSummary } from "@/types";

function escapePdfText(text: string): string {
  return String(text || "")
    .replace(/[^\x20-\x7E]/g, (ch) => (ch === "₹" ? "Rs." : "-"))
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function parseJpegDimensions(bytes: Uint8Array): { width: number; height: number } {
  let i = 2;
  while (i < bytes.length - 8) {
    if (bytes[i] === 0xff) {
      const marker = bytes[i + 1];
      // SOF0 (0xC0) or SOF2 (0xC2)
      if (marker === 0xc0 || marker === 0xc2) {
        const height = (bytes[i + 5] << 8) | bytes[i + 6];
        const width = (bytes[i + 7] << 8) | bytes[i + 8];
        return { width, height };
      }
      const segLen = (bytes[i + 2] << 8) | bytes[i + 3];
      i += 2 + Math.max(2, segLen);
    } else {
      i++;
    }
  }
  return { width: 800, height: 450 };
}

function base64ToUint8Array(dataUrl: string): Uint8Array | null {
  try {
    const idx = dataUrl.indexOf(",");
    if (idx === -1) return null;
    const bin = atob(dataUrl.slice(idx + 1));
    const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    return arr;
  } catch {
    return null;
  }
}

/**
 * Generates a real binary PDF (v1.4) embedding the live 3D canvas JPEG snapshot
 * and a clean, easy-to-read item + price summary for buyers.
 */
export function downloadDesignSummaryPdf(bom: BomSummary, canvasDataUrl?: string | null): void {
  const pageW = 595; // A4 pt
  const pageH = 842;
  const margin = 40;

  const jpegBytes = canvasDataUrl ? base64ToUint8Array(canvasDataUrl) : null;
  const imgDims = jpegBytes ? parseJpegDimensions(jpegBytes) : null;

  // Build PDF content stream
  const ops: string[] = [];

  // Top header bar
  ops.push("0.04 0.47 0.35 rg");
  ops.push(`0 ${pageH - 58} ${pageW} 58 re f`);
  ops.push("BT /F2 17 Tf 1 1 1 rg");
  ops.push(`1 0 0 1 ${margin} ${pageH - 32} Tm (MyPrefabRoom - Room Design & Cost Summary) Tj ET`);
  ops.push("BT /F1 9 Tf 0.85 0.97 0.93 rg");
  ops.push(`1 0 0 1 ${margin} ${pageH - 47} Tm (Generated ${escapePdfText(new Date().toLocaleDateString("en-IN"))} | myprefabroom.com) Tj ET`);

  let y = pageH - 76;

  // Embed live 3D Design Snapshot if available
  if (jpegBytes && imgDims) {
    const maxImgW = pageW - margin * 2;
    const maxImgH = 220;
    const ratio = Math.min(maxImgW / imgDims.width, maxImgH / imgDims.height);
    const drawW = Math.round(imgDims.width * ratio);
    const drawH = Math.round(imgDims.height * ratio);
    const drawX = Math.round((pageW - drawW) / 2);
    const drawY = y - drawH;

    // Subtle border frame
    ops.push("0.85 0.89 0.93 RG 1 w");
    ops.push(`${drawX - 1} ${drawY - 1} ${drawW + 2} ${drawH + 2} re S`);
    ops.push(`q ${drawW} 0 0 ${drawH} ${drawX} ${drawY} cm /Im1 Do Q`);
    y = drawY - 22;
  }

  // Section Title: Item List
  ops.push("BT /F2 12 Tf 0.06 0.09 0.16 rg");
  ops.push(`1 0 0 1 ${margin} ${y} Tm (What's Included (${bom.items.length} Items)) Tj ET`);
  y -= 16;

  // Table header
  ops.push("0.94 0.96 0.98 rg");
  ops.push(`${margin} ${y - 6} ${pageW - margin * 2} 20 re f`);
  ops.push("BT /F2 9 Tf 0.30 0.35 0.43 rg");
  ops.push(`1 0 0 1 ${margin + 8} ${y} Tm (Item) Tj ET`);
  ops.push(`1 0 0 1 ${pageW - margin - 130} ${y} Tm (Qty) Tj ET`);
  ops.push(`1 0 0 1 ${pageW - margin - 75} ${y} Tm (Amount) Tj ET`);
  y -= 22;

  // Rows (cap neatly so page never overflows)
  const maxRows = Math.min(bom.items.length, 18);
  for (let idx = 0; idx < maxRows; idx++) {
    const item = bom.items[idx];
    if (y < 165) break;
    const label = item.brand ? `${item.name} (${item.brand})` : item.name;
    const shortLabel = label.length > 52 ? `${label.slice(0, 49)}...` : label;

    ops.push("BT /F1 9.5 Tf 0.12 0.16 0.24 rg");
    ops.push(`1 0 0 1 ${margin + 8} ${y} Tm (${escapePdfText(shortLabel)}) Tj ET`);
    ops.push(`1 0 0 1 ${pageW - margin - 125} ${y} Tm (${item.count}) Tj ET`);
    ops.push("BT /F2 9.5 Tf 0.04 0.47 0.35 rg");
    ops.push(`1 0 0 1 ${pageW - margin - 82} ${y} Tm (Rs. ${item.total.toLocaleString("en-IN")}) Tj ET`);

    ops.push("0.90 0.92 0.95 RG 0.5 w");
    ops.push(`${margin} ${y - 6} m ${pageW - margin} ${y - 6} l S`);
    y -= 18;
  }

  if (bom.items.length > maxRows) {
    ops.push("BT /F1 8.5 Tf 0.45 0.50 0.58 rg");
    ops.push(`1 0 0 1 ${margin + 8} ${y} Tm (+ ${bom.items.length - maxRows} more items in CSV) Tj ET`);
    y -= 16;
  }

  y -= 10;

  // Cost Summary Box
  const boxH = 108;
  const boxY = Math.max(40, y - boxH);
  ops.push("0.96 0.98 0.99 rg");
  ops.push(`${margin} ${boxY} ${pageW - margin * 2} ${boxH} re f`);
  ops.push("0.82 0.87 0.91 RG 1 w");
  ops.push(`${margin} ${boxY} ${pageW - margin * 2} ${boxH} re S`);

  const summaryRows: Array<[string, number, boolean]> = [
    ["Rooms & Items", bom.subtotal - bom.foundationOrCanopyCost, false],
    ["Base & Roof Setup", bom.foundationOrCanopyCost, false],
    ["GST (18%)", bom.tax, false],
    ["Delivery & Assembly", bom.transportCost + bom.craneOrAssemblyCost, false],
    ["Total Landed Price", bom.totalCost, true],
  ];

  let sy = boxY + boxH - 20;
  for (const [label, amount, isTotal] of summaryRows) {
    if (isTotal) {
      ops.push("0.82 0.87 0.91 RG 0.8 w");
      ops.push(`${margin + 10} ${sy + 12} m ${pageW - margin - 10} ${sy + 12} l S`);
      ops.push("BT /F2 11 Tf 0.06 0.09 0.16 rg");
      ops.push(`1 0 0 1 ${margin + 12} ${sy - 2} Tm (${escapePdfText(label)}) Tj ET`);
      ops.push("BT /F2 11 Tf 0.04 0.47 0.35 rg");
      ops.push(`1 0 0 1 ${pageW - margin - 110} ${sy - 2} Tm (Rs. ${amount.toLocaleString("en-IN")}) Tj ET`);
    } else {
      ops.push("BT /F1 9.5 Tf 0.32 0.37 0.45 rg");
      ops.push(`1 0 0 1 ${margin + 12} ${sy} Tm (${escapePdfText(label)}) Tj ET`);
      ops.push("BT /F1 9.5 Tf 0.12 0.16 0.24 rg");
      ops.push(`1 0 0 1 ${pageW - margin - 105} ${sy} Tm (Rs. ${amount.toLocaleString("en-IN")}) Tj ET`);
      sy -= 17;
    }
  }

  const streamStr = ops.join("\n");
  const enc = new TextEncoder();
  const streamBytes = enc.encode(streamStr);

  // Assemble PDF objects
  const chunks: Uint8Array[] = [];
  const offsets: number[] = [0];
  let byteLen = 0;

  const pushStr = (s: string) => {
    const b = enc.encode(s);
    chunks.push(b);
    byteLen += b.length;
  };
  const pushBytes = (b: Uint8Array) => {
    chunks.push(b);
    byteLen += b.length;
  };

  pushStr("%PDF-1.4\n%\xFF\xFF\xFF\xFF\n");

  const startObj = (id: number) => {
    offsets[id] = byteLen;
    pushStr(`${id} 0 obj\n`);
  };

  // 1: Catalog, 2: Pages, 3: Page, 4: Font Regular, 5: Font Bold, 6: Content Stream, [7: Image XObject]
  startObj(1);
  pushStr("<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");

  startObj(2);
  pushStr("<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n");

  const xObjRef = jpegBytes && imgDims ? " /XObject << /Im1 7 0 R >>" : "";
  startObj(3);
  pushStr(
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageW} ${pageH}] /Resources << /Font << /F1 4 0 R /F2 5 0 R >>${xObjRef} >> /Contents 6 0 R >>\nendobj\n`
  );

  startObj(4);
  pushStr("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n");

  startObj(5);
  pushStr("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n");

  startObj(6);
  pushStr(`<< /Length ${streamBytes.length} >>\nstream\n`);
  pushBytes(streamBytes);
  pushStr("\nendstream\nendobj\n");

  if (jpegBytes && imgDims) {
    startObj(7);
    pushStr(
      `<< /Type /XObject /Subtype /Image /Width ${imgDims.width} /Height ${imgDims.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.length} >>\nstream\n`
    );
    pushBytes(jpegBytes);
    pushStr("\nendstream\nendobj\n");
  }

  const totalObjs = jpegBytes && imgDims ? 8 : 7;
  const xrefPos = byteLen;
  pushStr(`xref\n0 ${totalObjs}\n0000000000 65535 f \n`);
  for (let id = 1; id < totalObjs; id++) {
    pushStr(`${String(offsets[id]).padStart(10, "0")} 00000 n \n`);
  }
  pushStr(`trailer\n<< /Size ${totalObjs} /Root 1 0 R >>\nstartxref\n${xrefPos}\n%%EOF`);

  const blob = new Blob(chunks as BlobPart[], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `myprefabroom_design_${Date.now()}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
