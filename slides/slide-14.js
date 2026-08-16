const pptxgen = require("pptxgenjs");
const { addBadge } = require("./helpers");

const config = { type: "closing", index: 14, title: "Mari Digitalkan Kunjungan Lapangan Anda" };

function createSlide(pres, theme) {
  const slide = pres.addSlide();
  slide.background = { color: theme.primary };
  slide.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 0.25, h: 5.625, fill: { color: theme.accent } });

  slide.addText("PENAWARAN & LANGKAH SELANJUTNYA", { x: 0.7, y: 0.5, w: 8.5, h: 0.4, fontFace: "Trebuchet MS", fontSize: 13, color: theme.light, bold: true, charSpacing: 2 });
  slide.addText("Mari Digitalkan Kunjungan Lapangan Anda", { x: 0.7, y: 0.9, w: 8.6, h: 0.9, fontFace: "Trebuchet MS", fontSize: 30, color: "FFFFFF", bold: true });

  const steps = [
    "Demo langsung produk FVMS.",
    "Penyesuaian kebutuhan & penandatanganan.",
    "Kick-off & implementasi roadmap.",
  ];
  let y = 2.1;
  steps.forEach((s, i) => {
    slide.addShape(pres.shapes.OVAL, { x: 0.75, y: y, w: 0.4, h: 0.4, fill: { color: theme.accent } });
    slide.addText(String(i + 1), { x: 0.75, y: y, w: 0.4, h: 0.4, fontFace: "Trebuchet MS", fontSize: 14, color: "FFFFFF", bold: true, align: "center", valign: "middle" });
    slide.addText(s, { x: 1.3, y: y - 0.02, w: 7.5, h: 0.42, fontFace: "Calibri", fontSize: 14, color: "FFFFFF", valign: "middle" });
    y += 0.6;
  });

  slide.addText("Ditujukan untuk: [Nama Klien]", { x: 0.75, y: 3.95, w: 8, h: 0.3, fontFace: "Calibri", fontSize: 11, color: theme.light });

  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.7, y: 4.3, w: 8.6, h: 1.0, fill: { color: theme.secondary }, rectRadius: 0.1 });
  slide.addText([
    { text: "Akbar Sinyo", options: { bold: true, fontSize: 15, color: "FFFFFF" } },
    { text: "    |    akbarsinyotahe@gmail.com", options: { fontSize: 12, color: theme.light } },
    { text: "    |    https://github.com/sin-app/", options: { fontSize: 12, color: theme.light } },
  ], { x: 1.0, y: 4.3, w: 8.1, h: 1.0, fontFace: "Calibri", valign: "middle" });

  addBadge(pres, slide, theme, 14);
  return slide;
}

if (require.main === module) {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_16x9";
  const theme = { primary: "283618", secondary: "606c38", accent: "bc6c25", light: "dda15e", bg: "fefae0" };
  createSlide(pres, theme);
  pres.writeFile({ fileName: "slide-12-preview.pptx" });
}

module.exports = { createSlide, config };
