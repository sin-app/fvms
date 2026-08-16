const pptxgen = require("pptxgenjs");
const { addBadge } = require("./helpers");

const config = { type: "toc", index: 2, title: "Daftar Isi" };

function createSlide(pres, theme) {
  const slide = pres.addSlide();
  slide.background = { color: theme.bg };

  slide.addText("DAFTAR ISI", { x: 0.6, y: 0.5, w: 6, h: 0.4, fontFace: "Trebuchet MS", fontSize: 13, color: theme.accent, bold: true, charSpacing: 2 });
  slide.addText("Agenda Presentasi", { x: 0.6, y: 0.85, w: 8, h: 0.8, fontFace: "Trebuchet MS", fontSize: 32, color: theme.primary, bold: true });

  const items = [
    ["01", "Latar Belakang & Masalah"],
    ["02", "Solusi: FVMS"],
    ["03", "Fitur Unggulan"],
    ["04", "Pengajuan Lahan"],
    ["05", "Galeri Antarmuka"],
    ["06", "Alur Kerja Lapangan"],
    ["07", "Peran Pengguna"],
    ["08", "Keamanan & Teknologi"],
    ["09", "Manfaat & Nilai"],
    ["10", "Roadmap Implementasi"],
    ["11", "Penawaran & Langkah Selanjutnya"],
  ];

  const colW = 4.2;
  const x1 = 0.6, x2 = 5.2;
  const startY = 1.95;
  const gap = 0.42;
  items.forEach((it, i) => {
    const col = i < 5 ? 0 : 1;
    const row = i < 5 ? i : i - 5;
    const x = col === 0 ? x1 : x2;
    const y = startY + row * gap;
    slide.addText(it[0], { x, y, w: 0.6, h: 0.35, fontFace: "Trebuchet MS", fontSize: 18, color: theme.accent, bold: true });
    slide.addText(it[1], { x: x + 0.65, y, w: colW - 0.65, h: 0.35, fontFace: "Calibri", fontSize: 13, color: theme.primary, valign: "middle" });
    slide.addShape(pres.shapes.LINE, { x, y: y + 0.36, w: colW, h: 0, line: { color: theme.light, width: 0.75 } });
  });

  addBadge(pres, slide, theme, 2);
  return slide;
}

if (require.main === module) {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_16x9";
  const theme = { primary: "283618", secondary: "606c38", accent: "bc6c25", light: "dda15e", bg: "fefae0" };
  createSlide(pres, theme);
  pres.writeFile({ fileName: "slide-02-preview.pptx" });
}

module.exports = { createSlide, config };
