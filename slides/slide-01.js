const pptxgen = require("pptxgenjs");

const config = { type: "cover", index: 1, title: "FVMS" };

function createSlide(pres, theme) {
  const slide = pres.addSlide();
  slide.background = { color: theme.bg };

  slide.addShape(pres.shapes.RECTANGLE, { x: 7.0, y: 0, w: 3.0, h: 5.625, fill: { color: theme.primary } });
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 7.3, y: 0.7, w: 2.4, h: 4.2, fill: { color: theme.bg }, line: { color: theme.light, width: 1.5, dashType: "dash" }, rectRadius: 0.1 });
  slide.addText([
    { text: "GAMBAR UI", options: { fontSize: 14, bold: true, color: theme.primary, breakLine: true } },
    { text: "Screenshot FVMS", options: { fontSize: 11, color: theme.secondary, breakLine: true } },
    { text: "(mis. Dashboard / Login)", options: { fontSize: 10, color: theme.accent } },
  ], { x: 7.3, y: 0.7, w: 2.4, h: 4.2, fontFace: "Calibri", align: "center", valign: "middle" });

  slide.addText("PROPOSAL SISTEM MANAJEMEN", { x: 0.6, y: 0.7, w: 6.0, h: 0.4, fontFace: "Trebuchet MS", fontSize: 13, color: theme.accent, bold: true, charSpacing: 2 });
  slide.addText("FVMS", { x: 0.55, y: 1.05, w: 6.2, h: 1.4, fontFace: "Trebuchet MS", fontSize: 72, color: theme.primary, bold: true });
  slide.addText("Field Visit Management System", { x: 0.6, y: 2.5, w: 6.2, h: 0.5, fontFace: "Trebuchet MS", fontSize: 22, color: theme.secondary, bold: true });
  slide.addText("Sistem manajemen kunjungan lapangan terdigitalisasi untuk perencanaan, eksekusi, dan pelaporan yang terukur.", { x: 0.6, y: 3.1, w: 6.0, h: 0.9, fontFace: "Calibri", fontSize: 14, color: theme.primary });

  slide.addShape(pres.shapes.LINE, { x: 0.6, y: 4.2, w: 5.8, h: 0, line: { color: theme.accent, width: 1.5 } });
  slide.addText([
    { text: "Diajukan oleh: ", options: { bold: true } },
    { text: "Akbar Sinyo" },
  ], { x: 0.6, y: 4.4, w: 6.2, h: 0.3, fontFace: "Calibri", fontSize: 11, color: theme.primary });
  slide.addText([
    { text: "akbarsinyotahe@gmail.com", options: { bold: true, color: theme.secondary } },
    { text: "    |    ", options: { color: theme.accent } },
    { text: "https://github.com/sin-app/", options: { color: theme.secondary } },
  ], { x: 0.6, y: 4.75, w: 6.2, h: 0.3, fontFace: "Calibri", fontSize: 11, color: theme.primary });

  return slide;
}

if (require.main === module) {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_16x9";
  const theme = { primary: "283618", secondary: "606c38", accent: "bc6c25", light: "dda15e", bg: "fefae0" };
  createSlide(pres, theme);
  pres.writeFile({ fileName: "slide-01-preview.pptx" });
}

module.exports = { createSlide, config };
