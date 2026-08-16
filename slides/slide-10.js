const pptxgen = require("pptxgenjs");
const { addBadge, addHeader } = require("./helpers");

const config = { type: "content", index: 10, title: "Tiga Peran, Satu Sistem" };

function createSlide(pres, theme) {
  const slide = pres.addSlide();
  slide.background = { color: theme.bg };
  addHeader(pres, slide, theme, "Peran Pengguna", "Tiga Peran, Satu Sistem");

  const roles = [
    ["Admin", "Akses penuh: kelola pengguna, master data, import, & reset data."],
    ["QC", "Quality Control: scope per kabupaten, unggah foto & catat GPS."],
    ["Produksi", "Petugas lapangan: kelola jadwal & kunjungan sendiri."],
  ];
  const cw = 2.9, gx = 0.3, x0 = 0.6, y = 1.8, ch = 2.9;
  const headerColor = [theme.primary, theme.secondary, theme.accent];
  roles.forEach((r, i) => {
    const x = x0 + i * (cw + gx);
    slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w: cw, h: ch, fill: { color: "FFFFFF" }, line: { color: theme.light, width: 1 }, rectRadius: 0.1 });
    slide.addShape(pres.shapes.RECTANGLE, { x, y, w: cw, h: 0.7, fill: { color: headerColor[i] }, rectRadius: 0.1 });
    slide.addText(r[0], { x, y, w: cw, h: 0.7, fontFace: "Trebuchet MS", fontSize: 18, color: "FFFFFF", bold: true, align: "center", valign: "middle" });
    slide.addText(r[1], { x: x + 0.25, y: y + 0.95, w: cw - 0.5, h: 1.8, fontFace: "Calibri", fontSize: 13, color: theme.secondary, valign: "top" });
  });

  addBadge(pres, slide, theme, 10);
  return slide;
}

if (require.main === module) {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_16x9";
  const theme = { primary: "283618", secondary: "606c38", accent: "bc6c25", light: "dda15e", bg: "fefae0" };
  createSlide(pres, theme);
  pres.writeFile({ fileName: "slide-08-preview.pptx" });
}

module.exports = { createSlide, config };
