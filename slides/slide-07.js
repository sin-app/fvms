const pptxgen = require("pptxgenjs");
const { addBadge, addHeader } = require("./helpers");

const config = { type: "content", index: 7, title: "Alur Pengajuan Lahan (Detail)" };

function createSlide(pres, theme) {
  const slide = pres.addSlide();
  slide.background = { color: theme.bg };
  addHeader(pres, slide, theme, "Fitur Unggulan", "Alur Pengajuan Lahan (Detail)");

  const steps = [
    ["1", "Ajukan", "Produksi", "Isi lokasi, data tanam & member, GPS + akurasi, foto (maks. 10). Bisa offline."],
    ["2", "Notifikasi", "Admin & QC", "Lonceng + web push real-time ke Admin/QC sesuai scope kabupaten."],
    ["3", "Review", "Admin / QC", "Tinjau detail pengajuan; dapat Assign Petugas setelah disetujui."],
    ["4", "Keputusan", "Admin / QC", "Setuju -> Approved & otomatis buat Jadwal. Tolak -> Rejected (wajib catatan)."],
    ["5", "Tindak Lanjut", "Sistem", "Jadwal muncul di petugas. Ditolak -> Admin revisi -> Pending. Petugas dapat Batalkan."],
  ];

  const n = steps.length;
  const startX = 0.5, cw = 1.72, gap = 0.2, y = 1.8, ch = 1.9;
  const circ = 0.44;
  steps.forEach((s, i) => {
    const x = startX + i * (cw + gap);
    slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w: cw, h: ch, fill: { color: "FFFFFF" }, line: { color: theme.light, width: 1 }, rectRadius: 0.08 });
    slide.addShape(pres.shapes.OVAL, { x: x + cw / 2 - circ / 2, y: y + 0.12, w: circ, h: circ, fill: { color: i % 2 === 0 ? theme.primary : theme.accent } });
    slide.addText(s[0], { x: x + cw / 2 - circ / 2, y: y + 0.12, w: circ, h: circ, fontFace: "Trebuchet MS", fontSize: 16, color: "FFFFFF", bold: true, align: "center", valign: "middle" });
    slide.addText(s[1], { x: x + 0.05, y: y + 0.62, w: cw - 0.1, h: 0.3, fontFace: "Trebuchet MS", fontSize: 11.5, color: theme.primary, bold: true, align: "center" });
    slide.addText(s[2], { x: x + 0.05, y: y + 0.92, w: cw - 0.1, h: 0.25, fontFace: "Calibri", fontSize: 9, color: theme.accent, bold: true, align: "center" });
    slide.addText(s[3], { x: x + 0.08, y: y + 1.16, w: cw - 0.16, h: 0.7, fontFace: "Calibri", fontSize: 8.5, color: theme.secondary, align: "center", valign: "top" });
    if (i < n - 1) {
      slide.addText("→", { x: x + cw, y: y + 0.1, w: gap, h: circ, fontFace: "Arial", fontSize: 16, color: theme.accent, bold: true, align: "center", valign: "middle" });
    }
  });

  const notes = [
    "Offline-ready: diajukan tanpa sinyal, auto-sync saat online.",
    "Otomatis: disetujui -> langsung jadi Jadwal Kunjungan.",
    "Validasi: RLS per kabupaten; foto via signed URL (maks 10, kompres WebP).",
  ];
  let ny = 4.0;
  slide.addText("Catatan:", { x: 0.6, y: ny - 0.32, w: 5, h: 0.3, fontFace: "Trebuchet MS", fontSize: 12, color: theme.primary, bold: true });
  notes.forEach((t) => {
    slide.addShape(pres.shapes.OVAL, { x: 0.62, y: ny + 0.04, w: 0.14, h: 0.14, fill: { color: theme.accent } });
    slide.addText(t, { x: 0.9, y: ny - 0.06, w: 5.2, h: 0.4, fontFace: "Calibri", fontSize: 10, color: theme.secondary });
    ny += 0.42;
  });

  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 6.2, y: 3.9, w: 3.2, h: 1.15, fill: { color: "FFFFFF" }, line: { color: theme.accent, width: 1.25, dashType: "dash" }, rectRadius: 0.08 });
  slide.addText([
    { text: "GAMBAR UI", options: { fontSize: 11, bold: true, color: theme.primary, breakLine: true } },
    { text: "Daftar / Detail Pengajuan Lahan", options: { fontSize: 9, color: theme.secondary } },
  ], { x: 6.2, y: 3.9, w: 3.2, h: 1.15, fontFace: "Calibri", align: "center", valign: "middle" });

  addBadge(pres, slide, theme, 7);
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
