const pptxgen = require("pptxgenjs");
const { addBadge, addHeader } = require("./helpers");

const config = { type: "content", index: 13, title: "Empat Fase Menuju Go-Live" };

function createSlide(pres, theme) {
  const slide = pres.addSlide();
  slide.background = { color: theme.bg };
  addHeader(pres, slide, theme, "Roadmap Implementasi", "Empat Fase Menuju Go-Live");

  const phases = [
    ["Fase 1", "Setup & Migrasi Data", "Minggu 1-2"],
    ["Fase 2", "Pelatihan & Uji Coba", "Minggu 3-4"],
    ["Fase 3", "Go-Live & Monitoring", "Minggu 5-6"],
    ["Fase 4", "Pengembangan Lanjutan", "Berkelanjutan"],
  ];
  const n = 4, startX = 0.7, endX = 9.3, y = 2.3, cw = 1.95;
  const gap = (endX - startX - cw * n) / (n - 1);
  slide.addShape(pres.shapes.LINE, { x: startX + cw / 2, y: y + 0.35, w: (endX - startX - cw), h: 0, line: { color: theme.light, width: 2 } });

  phases.forEach((p, i) => {
    const x = startX + i * (cw + gap);
    slide.addShape(pres.shapes.OVAL, { x: x + cw / 2 - 0.35, y: y, w: 0.7, h: 0.7, fill: { color: i % 2 === 0 ? theme.primary : theme.accent } });
    slide.addText(String(i + 1), { x: x + cw / 2 - 0.35, y: y, w: 0.7, h: 0.7, fontFace: "Trebuchet MS", fontSize: 22, color: "FFFFFF", bold: true, align: "center", valign: "middle" });
    slide.addText(p[0], { x: x - 0.2, y: y + 0.85, w: cw + 0.4, h: 0.35, fontFace: "Trebuchet MS", fontSize: 13, color: theme.primary, bold: true, align: "center" });
    slide.addText(p[1], { x: x - 0.25, y: y + 1.22, w: cw + 0.5, h: 0.6, fontFace: "Calibri", fontSize: 11, color: theme.secondary, align: "center" });
    slide.addText(p[2], { x: x - 0.25, y: y + 1.8, w: cw + 0.5, h: 0.3, fontFace: "Calibri", fontSize: 10, color: theme.accent, bold: true, align: "center" });
  });

  addBadge(pres, slide, theme, 13);
  return slide;
}

if (require.main === module) {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_16x9";
  const theme = { primary: "283618", secondary: "606c38", accent: "bc6c25", light: "dda15e", bg: "fefae0" };
  createSlide(pres, theme);
  pres.writeFile({ fileName: "slide-11-preview.pptx" });
}

module.exports = { createSlide, config };
