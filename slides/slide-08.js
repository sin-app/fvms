const pptxgen = require("pptxgenjs");
const { addBadge, addHeader } = require("./helpers");

const config = { type: "content", index: 8, title: "Contoh Tampilan Antarmuka FVMS" };

function createSlide(pres, theme) {
  const slide = pres.addSlide();
  slide.background = { color: theme.bg };
  addHeader(pres, slide, theme, "Galeri Antarmuka", "Contoh Tampilan Antarmuka FVMS");

  const shots = [
    ["Dashboard", "Ringkasan statistik & jadwal hari ini."],
    ["Jadwal & Kalender", "Daftar kunjungan per hari dengan filter."],
    ["Kunjungan (GPS + Foto)", "Validasi lokasi & unggah foto bukti."],
    ["Laporan", "Rekap agregat & tabel per petugas."],
  ];

  const cw = 4.3, ch = 1.55, gx = 0.3, gy = 0.45, x0 = 0.6, y0 = 1.8;
  shots.forEach((s, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = x0 + col * (cw + gx), y = y0 + row * (ch + gy);

    slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w: cw, h: ch, fill: { color: "FFFFFF" }, line: { color: theme.accent, width: 1.25, dashType: "dash" }, rectRadius: 0.08 });
    slide.addText([
      { text: "GAMBAR UI", options: { fontSize: 13, bold: true, color: theme.primary, breakLine: true } },
      { text: "Tambahkan screenshot: " + s[0], options: { fontSize: 10, color: theme.secondary } },
    ], { x, y, w: cw, h: ch, fontFace: "Calibri", align: "center", valign: "middle" });

    slide.addText(s[0] + " — " + s[1], { x, y: y + ch + 0.03, w: cw, h: 0.35, fontFace: "Calibri", fontSize: 10.5, color: theme.secondary, align: "center" });
  });

  addBadge(pres, slide, theme, 8);
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
