const pptxgen = require("pptxgenjs");
const { addBadge, addHeader } = require("./helpers");

const config = { type: "content", index: 5, title: "FVMS: Sistem Kunjungan Lapangan Modern" };

function createSlide(pres, theme) {
  const slide = pres.addSlide();
  slide.background = { color: theme.bg };
  addHeader(pres, slide, theme, "Solusi", "FVMS: Sistem Kunjungan Lapangan Modern");

  slide.addText("FVMS menggantikan alur Excel manual dengan sistem web profesional yang mengelola perencanaan, eksekusi, dan pelaporan kunjungan lapangan dalam satu platform.", { x: 0.6, y: 1.7, w: 4.9, h: 1.0, fontFace: "Calibri", fontSize: 14, color: theme.primary });

  const bl = [
    "Akses dari HP & desktop (mobile-first).",
    "Tetap jalan saat offline via PWA.",
    "Import jadwal massal dari Excel otomatis.",
  ];
  let y = 2.9;
  bl.forEach((b) => {
    slide.addShape(pres.shapes.OVAL, { x: 0.65, y: y + 0.04, w: 0.18, h: 0.18, fill: { color: theme.accent } });
    slide.addText(b, { x: 0.95, y: y - 0.05, w: 4.6, h: 0.4, fontFace: "Calibri", fontSize: 13, color: theme.secondary });
    y += 0.5;
  });

  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 5.9, y: 1.7, w: 3.5, h: 3.1, fill: { color: theme.primary }, rectRadius: 0.12 });
  slide.addText("Keunggulan Utama", { x: 6.15, y: 1.95, w: 3.0, h: 0.4, fontFace: "Trebuchet MS", fontSize: 15, color: "FFFFFF", bold: true });
  const feats = [
    ["Web & Mobile", "Satu sistem, semua perangkat"],
    ["Offline-ready", "Lanjut bekerja tanpa sinyal"],
    ["Import cepat", "Jam kerja jadi hitungan menit"],
    ["Real-time", "Pantau progres secara langsung"],
  ];
  let fy = 2.5;
  feats.forEach((f) => {
    slide.addShape(pres.shapes.OVAL, { x: 6.15, y: fy + 0.02, w: 0.24, h: 0.24, fill: { color: theme.light } });
    slide.addText(f[0], { x: 6.5, y: fy - 0.04, w: 2.8, h: 0.3, fontFace: "Trebuchet MS", fontSize: 12.5, color: "FFFFFF", bold: true });
    slide.addText(f[1], { x: 6.5, y: fy + 0.26, w: 2.8, h: 0.3, fontFace: "Calibri", fontSize: 10.5, color: theme.light });
    fy += 0.62;
  });

  addBadge(pres, slide, theme, 5);
  return slide;
}

if (require.main === module) {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_16x9";
  const theme = { primary: "283618", secondary: "606c38", accent: "bc6c25", light: "dda15e", bg: "fefae0" };
  createSlide(pres, theme);
  pres.writeFile({ fileName: "slide-05-preview.pptx" });
}

module.exports = { createSlide, config };
