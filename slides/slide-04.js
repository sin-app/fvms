const pptxgen = require("pptxgenjs");
const { addBadge, addHeader } = require("./helpers");

const config = { type: "content", index: 4, title: "Tantangan Kunjungan Lapangan Saat Ini" };

function createSlide(pres, theme) {
  const slide = pres.addSlide();
  slide.background = { color: theme.bg };
  addHeader(pres, slide, theme, "Latar Belakang", "Tantangan Kunjungan Lapangan Saat Ini");

  const pts = [
    ["Pencatatan manual", "Jadwal & laporan kunjungan masih dikelola lewat Excel yang rawan salah ketik."],
    ["Duplikasi & hilang", "Data tersebar di banyak file; mudah terduplikasi atau tertimpa antar petugas."],
    ["Tidak real-time", "Manajemen tidak bisa memantau progres kunjungan secara langsung."],
    ["Bukti lemah", "Tanpa validasi GPS & foto, sulit membuktikan kunjungan benar terjadi."],
    ["Laporan lambat", "Rekap mingguan/bulanan memakan waktu dan sering tidak akurat."],
  ];

  let y = 1.75;
  const gap = 0.72;
  pts.forEach((p) => {
    slide.addShape(pres.shapes.OVAL, { x: 0.65, y: y + 0.03, w: 0.32, h: 0.32, fill: { color: theme.accent } });
    slide.addText(p[0], { x: 1.15, y: y - 0.05, w: 8.2, h: 0.35, fontFace: "Trebuchet MS", fontSize: 16, color: theme.primary, bold: true });
    slide.addText(p[1], { x: 1.15, y: y + 0.30, w: 8.2, h: 0.4, fontFace: "Calibri", fontSize: 13, color: theme.secondary });
    y += gap;
  });

  addBadge(pres, slide, theme, 4);
  return slide;
}

if (require.main === module) {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_16x9";
  const theme = { primary: "283618", secondary: "606c38", accent: "bc6c25", light: "dda15e", bg: "fefae0" };
  createSlide(pres, theme);
  pres.writeFile({ fileName: "slide-04-preview.pptx" });
}

module.exports = { createSlide, config };
