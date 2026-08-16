const pptxgen = require("pptxgenjs");
const { addBadge, addHeader } = require("./helpers");

const config = { type: "content", index: 12, title: "Nilai yang Diterima Klien" };

function createSlide(pres, theme) {
  const slide = pres.addSlide();
  slide.background = { color: theme.bg };
  addHeader(pres, slide, theme, "Manfaat & Nilai", "Nilai yang Diterima Klien");

  const benefits = [
    ["100%", "Digital & real-time, bukan kertas/Excel."],
    ["WAKTU", "Rekap laporan berjam-jam jadi hitungan menit."],
    ["VALID", "Bukti kunjungan terjamin: GPS + foto."],
    ["MOBILE", "Akses HP & tetap jalan saat offline."],
  ];
  const cw = 4.3, ch = 1.45, gx = 0.3, gy = 0.25, x0 = 0.6, y0 = 1.75;
  benefits.forEach((b, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = x0 + col * (cw + gx), y = y0 + row * (ch + gy);
    slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w: cw, h: ch, fill: { color: "FFFFFF" }, line: { color: theme.light, width: 1 }, rectRadius: 0.1 });
    slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: x + 0.2, y: y + 0.25, w: 1.4, h: 0.55, fill: { color: theme.accent }, rectRadius: 0.08 });
    slide.addText(b[0], { x: x + 0.2, y: y + 0.25, w: 1.4, h: 0.55, fontFace: "Trebuchet MS", fontSize: 14, color: "FFFFFF", bold: true, align: "center", valign: "middle" });
    slide.addText(b[1], { x: x + 1.75, y: y + 0.2, w: cw - 1.95, h: 1.05, fontFace: "Calibri", fontSize: 12.5, color: theme.secondary, valign: "middle" });
  });

  addBadge(pres, slide, theme, 12);
  return slide;
}

if (require.main === module) {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_16x9";
  const theme = { primary: "283618", secondary: "606c38", accent: "bc6c25", light: "dda15e", bg: "fefae0" };
  createSlide(pres, theme);
  pres.writeFile({ fileName: "slide-10-preview.pptx" });
}

module.exports = { createSlide, config };
