/**
 * gen-enterprise-pdf.js
 * Hasilkan dua PDF dari dokumen docs/ENTERPRISE/:
 *   1. FVMS-Penjelasan-Enterprise.pdf  -> dokumen lengkap (teknis + bisnis)
 *   2. FVMS-Penjelasan-Fungsional.pdf -> penjelasan fungsional (tanpa bahasa teknis)
 * Renderer markdown terbatas (heading, paragraf, bullet, blockquote, tabel) via
 * jspdf + jspdf-autotable. Istilah asing dijelaskan di GLOSARIUM.md.
 */
const fs = require("fs");
const path = require("path");
const { jsPDF } = require("jspdf");
const autoTable = require("jspdf-autotable").default;

const DIR = path.join(__dirname, "docs", "ENTERPRISE");

function sanitize(s) {
  return s
    .replace(/✅/g, "[Sudah]")
    .replace(/🟡/g, "[Sebagian]")
    .replace(/🔴/g, "[Rencana]")
    .replace(/→/g, "-")
    .replace(/≥/g, ">=")
    .replace(/≤/g, "<=")
    .replace(/•/g, "-")
    .replace(/✓/g, "v")
    .replace(/[—–]/g, "-")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/…/g, "...")
    .replace(/\*\*/g, "")
    .replace(/`/g, "");
}

function buildPdf({ files, out, subtitle }) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const M = { top: 56, bottom: 56, left: 58, right: 58 };
  const pageH = doc.internal.pageSize.getHeight();
  const pageW = doc.internal.pageSize.getWidth();
  const contentW = pageW - M.left - M.right;
  let y = M.top;

  function drawFooter() {
    const n = doc.getNumberOfPages();
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text("FVMS - Penjelasan Adopsi Internal", M.left, pageH - M.bottom + 26);
    doc.text(String(n), pageW - M.right, pageH - M.bottom + 26, { align: "right" });
  }
  function newPage() {
    doc.addPage();
    drawFooter();
    y = M.top;
  }
  function addPara(text, opt = {}) {
    const size = opt.size || 10.5;
    const style = opt.style || "normal";
    const indent = opt.indent || 0;
    const color = opt.color || [30, 40, 35];
    const lh = size * 1.34;
    doc.setFont("helvetica", style);
    doc.setFontSize(size);
    doc.setTextColor(...color);
    const lines = doc.splitTextToSize(sanitize(text), contentW - indent);
    for (const ln of lines) {
      if (y > pageH - M.bottom - lh) newPage();
      doc.text(ln, M.left + indent, y, { baseline: "top" });
      y += lh;
    }
    y += opt.gapAfter != null ? opt.gapAfter : size * 0.5;
  }
  function addHeading(text, level) {
    const sizes = { 1: 22, 2: 14, 3: 11.5 };
    const gapBefore = { 1: 4, 2: 16, 3: 10 };
    const size = sizes[level] || 11;
    if (y > pageH - M.bottom - size * 3) newPage();
    y += gapBefore[level] || 8;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(size);
    doc.setTextColor(...(level === 1 ? [20, 40, 30] : [27, 94, 32]));
    const lines = doc.splitTextToSize(sanitize(text), contentW);
    for (const ln of lines) {
      if (y > pageH - M.bottom - size * 1.5) newPage();
      doc.text(ln, M.left, y, { baseline: "top" });
      y += size * 1.3;
    }
    y += 4;
    if (level === 2) {
      doc.setDrawColor(200, 210, 200);
      doc.line(M.left, y, pageW - M.right, y);
      y += 8;
    }
  }
  function splitRow(line) {
    let s = line.trim();
    if (s.startsWith("|")) s = s.slice(1);
    if (s.endsWith("|")) s = s.slice(0, -1);
    return s.split("|").map((c) => c.trim());
  }
  function drawTable(header, rows) {
    const head = [header.map((h) => sanitize(h))];
    const body = rows.map((r) => r.map((c) => sanitize(c)));
    if (y > pageH - M.bottom - 70) newPage();
    autoTable(doc, {
      startY: y + 6,
      head,
      body,
      margin: { left: M.left, right: M.right },
      styles: { fontSize: 8.5, cellPadding: 4, textColor: [30, 40, 35], valign: "top", lineColor: [210, 215, 210] },
      headStyles: { fillColor: [27, 94, 32], textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [240, 245, 240] },
      theme: "grid",
    });
    y = doc.lastAutoTable.finalY + 12;
  }
  function renderMarkdown(md) {
    const lines = md.split(/\r?\n/);
    let i = 0;
    while (i < lines.length) {
      const line = lines[i];
      if (line.trim() === "") {
        i++;
        continue;
      }
      if (
        line.includes("|") &&
        i + 1 < lines.length &&
        /^\s*\|?[\s:|-]+\|/.test(lines[i + 1]) &&
        lines[i + 1].includes("-")
      ) {
        const header = splitRow(line);
        i += 2;
        const rows = [];
        while (i < lines.length && lines[i].includes("|") && lines[i].trim() !== "") {
          rows.push(splitRow(lines[i]));
          i++;
        }
        drawTable(header, rows);
        continue;
      }
      if (line.startsWith("### ")) {
        addHeading(line.slice(4), 3);
        i++;
        continue;
      }
      if (line.startsWith("## ")) {
        addHeading(line.slice(3), 2);
        i++;
        continue;
      }
      if (line.startsWith("# ")) {
        addHeading(line.slice(2), 1);
        i++;
        continue;
      }
      if (line.startsWith("> ")) {
        addPara(line.slice(2), { style: "italic", indent: 14, color: [110, 122, 114], size: 10 });
        i++;
        continue;
      }
      if (/^[-*]\s+/.test(line)) {
        addPara("- " + line.replace(/^[-*]\s+/, ""), { indent: 12, size: 10.5, gapAfter: 2 });
        i++;
        continue;
      }
      if (line.startsWith("---")) {
        y += 4;
        doc.setDrawColor(220, 220, 210);
        doc.line(M.left, y, pageW - M.right, y);
        y += 8;
        i++;
        continue;
      }
      if (/^!\[.*\]\(.+\)$/.test(line)) {
        const m = line.match(/^!\[(.*)\]\((.+)\)$/);
        const alt = m[1];
        const imgPath = m[2].trim();
        try {
          const full = path.resolve(__dirname, imgPath);
          if (fs.existsSync(full)) {
            const dataUrl = "data:image/png;base64," + fs.readFileSync(full).toString("base64");
            const props = doc.getImageProperties(dataUrl);
            const ratio = props.height / props.width;
            let w = contentW;
            let h = w * ratio;
            const maxH = pageH - M.top - M.bottom - 50;
            if (h > maxH) {
              h = maxH;
              w = h / ratio;
            }
            if (y + h > pageH - M.bottom - 30) newPage();
            doc.addImage(dataUrl, "PNG", M.left, y, w, h);
            y += h + 4;
            addPara(alt, { size: 9, style: "italic", color: [110, 122, 114], gapAfter: 12 });
          } else {
            addPara("[Gambar tidak ditemukan: " + imgPath + "]", { size: 9, color: [150, 80, 80] });
          }
        } catch (e) {
          addPara("[Gagal memuat gambar: " + imgPath + "]", { size: 9, color: [150, 80, 80] });
        }
        i++;
        continue;
      }
      addPara(line, { size: 10.5 });
      i++;
    }
  }

  /* Cover */
  doc.setFillColor(20, 40, 30);
  doc.rect(0, 0, pageW, pageH, "F");
  doc.setTextColor(255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(56);
  doc.text("FVMS", pageW / 2, pageH / 2 - 70, { align: "center" });
  doc.setFontSize(17);
  doc.setTextColor(230, 240, 230);
  doc.text(subtitle, pageW / 2, pageH / 2 - 26, { align: "center" });
  doc.setFontSize(11);
  doc.setTextColor(205, 215, 205);
  doc.text("Field Visit Management System", pageW / 2, pageH / 2 + 4, { align: "center" });
  doc.text("Dokumen ditujukan untuk: [Nama Perusahaan]", pageW / 2, pageH / 2 + 42, { align: "center" });
  doc.text("Versi 1.0  -  2026-08-25", pageW / 2, pageH / 2 + 60, { align: "center" });

  files.forEach((f) => {
    newPage();
    const md = fs.readFileSync(path.join(DIR, f), "utf8");
    renderMarkdown(md);
  });

  drawFooter();
  const outPath = path.join(__dirname, "proposal", out);
  doc.save(outPath);
  console.log("Saved:", outPath);
}

buildPdf({
  files: [
    "00-Executive-Summary.md",
    "01-Readiness-Dossier.md",
    "02-Objection-Handling-FAQ.md",
    "03-Operations-Change-Management.md",
    "GLOSARIUM.md",
  ],
  out: "FVMS-Penjelasan-Enterprise.pdf",
  subtitle: "Penjelasan Adopsi Internal Enterprise",
});

buildPdf({
  files: ["Penjelasan-Fungsional.md"],
  out: "FVMS-Penjelasan-Fungsional.pdf",
  subtitle: "Penjelasan Fungsional",
});
