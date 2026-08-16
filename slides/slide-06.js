const pptxgen = require("pptxgenjs");
const { addBadge, addHeader } = require("./helpers");

const config = { type: "content", index: 6, title: "Enam Fitur Inti FVMS" };

function createSlide(pres, theme) {
  const slide = pres.addSlide();
  slide.background = { color: theme.bg };
  addHeader(pres, slide, theme, "Fitur Unggulan", "Enam Fitur Inti FVMS");

  const cards = [
    ["1", "Import Excel", "Upload workbook; akun petugas, master data & jadwal terbuat otomatis."],
    ["2", "Jadwal & Kalender", "Lihat kunjungan per hari, filter, export PDF, aksi massal."],
    ["3", "Kunjungan GPS+Foto", "Validasi lokasi, unggah foto (URL bertanda), & timeline aktivitas."],
    ["4", "Notifikasi", "Lonceng real-time & pengingat harian otomatis (cron)."],
    ["5", "Dashboard", "Kartu statistik: hari ini, besok, minggu, telat, selesai."],
    ["6", "Laporan", "Rekap agregat + grafik + tabel per petugas, export Excel."],
  ];

  const cw = 2.95, ch = 1.55, gx = 0.25, gy = 0.25;
  const x0 = 0.6, y0 = 1.7;
  cards.forEach((c, i) => {
    const col = i % 3, row = Math.floor(i / 3);
    const x = x0 + col * (cw + gx), y = y0 + row * (ch + gy);
    slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w: cw, h: ch, fill: { color: "FFFFFF" }, line: { color: theme.light, width: 1 }, rectRadius: 0.1 });
    slide.addShape(pres.shapes.OVAL, { x: x + 0.2, y: y + 0.2, w: 0.5, h: 0.5, fill: { color: theme.accent } });
    slide.addText(c[0], { x: x + 0.2, y: y + 0.2, w: 0.5, h: 0.5, fontFace: "Trebuchet MS", fontSize: 18, color: "FFFFFF", bold: true, align: "center", valign: "middle" });
    slide.addText(c[1], { x: x + 0.85, y: y + 0.22, w: cw - 1.0, h: 0.45, fontFace: "Trebuchet MS", fontSize: 13.5, color: theme.primary, bold: true, valign: "middle" });
    slide.addText(c[2], { x: x + 0.22, y: y + 0.82, w: cw - 0.44, h: 0.65, fontFace: "Calibri", fontSize: 10.5, color: theme.secondary });
  });

  addBadge(pres, slide, theme, 6);
  return slide;
}

if (require.main === module) {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_16x9";
  const theme = { primary: "283618", secondary: "606c38", accent: "bc6c25", light: "dda15e", bg: "fefae0" };
  createSlide(pres, theme);
  pres.writeFile({ fileName: "slide-06-preview.pptx" });
}

module.exports = { createSlide, config };
