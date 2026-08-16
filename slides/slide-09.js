const pptxgen = require("pptxgenjs");
const { addBadge, addHeader } = require("./helpers");

const config = { type: "content", index: 9, title: "Dari Jadwal Hingga Laporan" };

function createSlide(pres, theme) {
  const slide = pres.addSlide();
  slide.background = { color: theme.bg };
  addHeader(pres, slide, theme, "Alur Kerja", "Dari Jadwal Hingga Laporan");

  const steps = [
    ["1", "Import Jadwal", "Upload Excel → akun & jadwal otomatis."],
    ["2", "Penugasan", "Petugas menerima jadwal harian."],
    ["3", "Kunjungan", "Catat GPS, foto, & status di lapangan."],
    ["4", "Pelaporan", "Dashboard & laporan rekap otomatis."],
  ];
  const n = steps.length;
  const startX = 0.7, endX = 9.3;
  const y = 2.4;
  const cw = 1.95;
  const gap = (endX - startX - cw * n) / (n - 1);

  steps.forEach((s, i) => {
    const x = startX + i * (cw + gap);
    slide.addShape(pres.shapes.OVAL, { x: x + cw / 2 - 0.45, y: y, w: 0.9, h: 0.9, fill: { color: i % 2 === 0 ? theme.primary : theme.accent } });
    slide.addText(s[0], { x: x + cw / 2 - 0.45, y: y, w: 0.9, h: 0.9, fontFace: "Trebuchet MS", fontSize: 26, color: "FFFFFF", bold: true, align: "center", valign: "middle" });
    slide.addText(s[1], { x: x - 0.2, y: y + 1.0, w: cw + 0.4, h: 0.4, fontFace: "Trebuchet MS", fontSize: 13.5, color: theme.primary, bold: true, align: "center" });
    slide.addText(s[2], { x: x - 0.25, y: y + 1.42, w: cw + 0.5, h: 0.7, fontFace: "Calibri", fontSize: 11, color: theme.secondary, align: "center" });
    if (i < n - 1) {
      slide.addText("→", { x: x + cw / 2 + 0.1, y: y + 0.1, w: gap - 0.2, h: 0.7, fontFace: "Arial", fontSize: 22, color: theme.accent, bold: true, align: "center", valign: "middle" });
    }
  });

  addBadge(pres, slide, theme, 9);
  return slide;
}

if (require.main === module) {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_16x9";
  const theme = { primary: "283618", secondary: "606c38", accent: "bc6c25", light: "dda15e", bg: "fefae0" };
  createSlide(pres, theme);
  pres.writeFile({ fileName: "slide-07-preview.pptx" });
}

module.exports = { createSlide, config };
