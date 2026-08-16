const pptxgen = require("pptxgenjs");
const { addBadge } = require("./helpers");

const config = { type: "divider", index: 3, title: "Latar Belakang & Masalah" };

function createSlide(pres, theme) {
  const slide = pres.addSlide();
  slide.background = { color: theme.primary };

  slide.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 0.25, h: 5.625, fill: { color: theme.accent } });
  slide.addText("01", { x: 0.8, y: 1.4, w: 3, h: 1.6, fontFace: "Trebuchet MS", fontSize: 96, color: theme.light, bold: true });
  slide.addText("Latar Belakang & Masalah", { x: 0.85, y: 3.1, w: 8.2, h: 0.9, fontFace: "Trebuchet MS", fontSize: 34, color: "FFFFFF", bold: true });
  slide.addText("Mengapa sistem ini dibutuhkan dan apa kendala yang dihadapi saat ini.", { x: 0.87, y: 4.0, w: 8, h: 0.5, fontFace: "Calibri", fontSize: 15, color: theme.light });

  addBadge(pres, slide, theme, 3);
  return slide;
}

if (require.main === module) {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_16x9";
  const theme = { primary: "283618", secondary: "606c38", accent: "bc6c25", light: "dda15e", bg: "fefae0" };
  createSlide(pres, theme);
  pres.writeFile({ fileName: "slide-03-preview.pptx" });
}

module.exports = { createSlide, config };
