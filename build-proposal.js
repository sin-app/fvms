const pptxgen = require("pptxgenjs");
const fs = require("fs");
const path = require("path");

const pptx = new pptxgen();
pptx.layout = "LAYOUT_WIDE";
pptx.author = "Akbar Sinyo";
pptx.company = "sin-app";
pptx.title = "FVMS — Proposal Sistem Manajemen Kunjungan Lapangan";
const ASSETS = path.join(__dirname, "proposal", "assets");

const C = {
  greenXD: "0E3322", greenD: "13402C", green: "1B5E20", greenL: "2E7D32",
  gold: "C9A227", goldL: "E3C766", cream: "FAF7F0", card: "FFFFFF",
  ink: "1C2B26", mute: "6E7A72", line: "E2DDD0", white: "FFFFFF", soft: "EAF1EA",
};
const W = 13.33, H = 7.5;
const RECT = pptx.ShapeType.rect, RR = pptx.ShapeType.roundRect, OVAL = pptx.ShapeType.ellipse;
const SH = { type: "outer", color: "B9B2A0", blur: 9, offset: 3, angle: 90, opacity: 0.35 };

function bg(s, c) {
  if (c === C.greenXD) s.background = { path: path.join(ASSETS, "bg-dark.png") };
  else if (c === C.greenD) s.background = { path: path.join(ASSETS, "bg-green.png") };
  else s.background = { path: path.join(ASSETS, "bg-content.png") };
}
function decor(s) {
  s.addShape(OVAL, { x: W - 2.3, y: -1.7, w: 3.8, h: 3.8, fill: { color: C.gold, transparency: 93 }, line: { width: 0 } });
  s.addShape(OVAL, { x: -1.5, y: H - 1.9, w: 3.2, h: 3.2, fill: { color: C.greenL, transparency: 94 }, line: { width: 0 } });
}
function header(s, kick, title, y = 0.95) {
  s.addShape(RECT, { x: 0.7, y: 0.5, w: 0.55, h: 0.05, fill: { color: C.gold }, line: { width: 0 } });
  s.addText(kick.toUpperCase(), { x: 0.7, y: 0.58, w: 11, h: 0.3, fontSize: 11, bold: true, color: C.gold, charSpacing: 3.5, fontFace: "Georgia" });
  s.addText(title, { x: 0.7, y, w: 12, h: 0.85, fontSize: 27, bold: true, color: C.ink, fontFace: "Georgia" });
}
function footer(s, n) {
  s.addText("[Nama Perusahaan]   ·   FVMS — Proposal Sistem Kunjungan Lapangan", { x: 0.7, y: H - 0.36, w: 9, h: 0.3, fontSize: 8.5, color: C.mute, fontFace: "Arial" });
  s.addText(String(n).padStart(2, "0"), { x: W - 1.1, y: H - 0.36, w: 0.6, h: 0.3, fontSize: 8.5, color: C.gold, bold: true, align: "right", fontFace: "Georgia" });
}
function card(s, x, y, w, h, opts = {}) {
  s.addShape(RR, { x, y, w, h, rectRadius: 0.1, fill: { color: opts.fill || C.card }, line: { color: opts.line || C.line, width: 1 }, shadow: SH });
  if (opts.accent) s.addShape(RR, { x, y, w: 0.09, h, rectRadius: 0.02, fill: { color: opts.accent }, line: { width: 0 } });
}
function badge(s, x, y, d, txt, fill, txtColor) {
  s.addShape(OVAL, { x, y, w: d, h: d, fill: { color: fill }, line: { width: 0 }, shadow: SH });
  s.addText(txt, { x, y, w: d, h: d, fontSize: 22, bold: true, color: txtColor, align: "center", valign: "middle", fontFace: "Georgia" });
}

/* ---------- mock UI (fallback bila screenshot belum ada) ---------- */
function mockBar(s, sx, sy, sw) {
  s.addShape(RECT, { x: sx, y: sy, w: sw, h: 0.32, fill: { color: C.greenD }, line: { width: 0 } });
  for (let i = 0; i < 3; i++) s.addShape(OVAL, { x: sx + 0.12 + i * 0.28, y: sy + 0.08, w: 0.16, h: 0.16, fill: { color: C.white }, line: { width: 0 } });
}
function mockDashboard(s, sx, sy, sw, sh) {
  const cw = (sw - 0.4) / 3;
  for (let i = 0; i < 3; i++) s.addShape(RR, { x: sx + 0.1 + i * (cw + 0.1), y: sy + 0.12, w: cw, h: sh * 0.26, rectRadius: 0.05, fill: { color: C.soft }, line: { color: C.line, width: 1 } });
  for (let i = 0; i < 3; i++) {
    const y = sy + sh * 0.42 + i * (sh * 0.17);
    s.addShape(RECT, { x: sx + 0.1, y, w: sw - 0.2, h: sh * 0.13, fill: { color: C.white }, line: { color: C.line, width: 1 } });
    s.addShape(OVAL, { x: sx + 0.2, y: y + (sh * 0.13 - 0.12) / 2, w: 0.12, h: 0.12, fill: { color: C.greenL }, line: { width: 0 } });
    s.addShape(RECT, { x: sx + 0.42, y: y + 0.03, w: sw * 0.42, h: 0.06, fill: { color: C.line }, line: { width: 0 } });
  }
}
function mockSchedules(s, sx, sy, sw, sh) {
  mockBar(s, sx, sy, sw);
  for (let i = 0; i < 4; i++) {
    const y = sy + 0.45 + i * (sh * 0.17);
    s.addShape(RECT, { x: sx + 0.1, y, w: sw - 0.2, h: sh * 0.13, fill: { color: C.white }, line: { color: C.line, width: 1 } });
    s.addShape(OVAL, { x: sx + 0.2, y: y + (sh * 0.13 - 0.12) / 2, w: 0.12, h: 0.12, fill: { color: C.gold }, line: { width: 0 } });
    s.addShape(RECT, { x: sx + 0.42, y: y + 0.03, w: sw * 0.4, h: 0.06, fill: { color: C.line }, line: { width: 0 } });
    s.addShape(RECT, { x: sx + sw - 0.55, y: y + 0.03, w: 0.35, h: 0.07, fill: { color: C.soft }, line: { width: 0 } });
  }
}
function mockVisit(s, sx, sy, sw, sh) {
  s.addShape(RECT, { x: sx + 0.1, y: sy + 0.12, w: sw - 0.2, h: sh * 0.5, fill: { color: "DDE8E0" }, line: { color: C.line, width: 1 } });
  s.addShape(OVAL, { x: sx + sw / 2 - 0.1, y: sy + sh * 0.28, w: 0.2, h: 0.2, fill: { color: C.greenD }, line: { color: C.white, width: 2 } });
  s.addShape(RR, { x: sx + 0.12, y: sy + sh * 0.66, w: sw * 0.42, h: sh * 0.28, rectRadius: 0.04, fill: { color: C.white }, line: { color: C.line, width: 1 } });
  s.addShape(RECT, { x: sx + 0.1, y: sy + sh * 0.66 + 0.04, w: sw * 0.42 - 0.2, h: 0.05, fill: { color: C.line }, line: { width: 0 } });
  s.addShape(RECT, { x: sx + sw * 0.5, y: sy + sh * 0.66, w: sw * 0.4, h: 0.06, fill: { color: C.greenL }, line: { width: 0 } });
  s.addShape(RECT, { x: sx + sw * 0.5, y: sy + sh * 0.78, w: sw * 0.4, h: 0.06, fill: { color: C.line }, line: { width: 0 } });
}
function mockReports(s, sx, sy, sw, sh) {
  const bx = sx + 0.12, bw = (sw - 0.5) / 4;
  for (let i = 0; i < 4; i++) { const bh = sh * (0.25 + 0.15 * i); s.addShape(RECT, { x: bx + i * (bw + 0.06), y: sy + sh * 0.8 - bh, w: bw, h: bh, fill: { color: i % 2 ? C.greenL : C.green }, line: { width: 0 } }); }
  for (let r = 0; r < 3; r++) { const y = sy + sh * 0.02 + r * (sh * 0.06); s.addShape(RECT, { x: sx + 0.1, y, w: sw - 0.2, h: sh * 0.045, fill: { color: r === 0 ? C.soft : C.white }, line: { color: C.line, width: 1 } }); }
}
function mockLahan(s, sx, sy, sw, sh) {
  const cy = sy + 0.25, n = 4, gap = (sw - 0.6) / (n - 1);
  s.addShape(RECT, { x: sx + 0.2, y: cy + 0.05, w: sw - 0.4, h: 0.03, fill: { color: C.line }, line: { width: 0 } });
  for (let i = 0; i < n; i++) s.addShape(OVAL, { x: sx + 0.1 + i * gap, y: cy, w: 0.18, h: 0.18, fill: { color: i < 2 ? C.green : C.white }, line: { color: C.green, width: 2 } });
  for (let i = 0; i < 2; i++) { const y = sy + sh * 0.5 + i * (sh * 0.2); s.addShape(RECT, { x: sx + 0.1, y, w: sw - 0.2, h: sh * 0.13, fill: { color: C.white }, line: { color: C.line, width: 1 } }); s.addShape(RECT, { x: sx + 0.2, y: y + 0.04, w: sw * 0.4, h: 0.06, fill: { color: C.line }, line: { width: 0 } }); }
}
const MOCKS = { dashboard: mockDashboard, schedules: mockSchedules, visit: mockVisit, reports: mockReports, lahan: mockLahan };

/* ============ SLIDE 1 — COVER ============ */
{
  const s = pptx.addSlide(); bg(s, C.greenXD);
  s.addShape(RECT, { x: 0.3, y: 0.3, w: W - 0.6, h: H - 0.6, fill: { color: C.greenXD, transparency: 100 }, line: { color: C.gold, width: 1, transparency: 45 } });
  s.addShape(OVAL, { x: W - 3.3, y: -1.9, w: 4.4, h: 4.4, fill: { color: C.gold, transparency: 90 }, line: { width: 0 } });
  s.addShape(OVAL, { x: -1.4, y: H - 2.3, w: 3.6, h: 3.6, fill: { color: C.greenL, transparency: 87 }, line: { width: 0 } });
  s.addText("PROPOSAL SISTEM MANAJEMEN KUNJUNGAN LAPANGAN", { x: 0.95, y: 1.5, w: 11, h: 0.4, fontSize: 13, bold: true, color: C.gold, charSpacing: 3.5, fontFace: "Georgia" });
  s.addText("FVMS", { x: 0.88, y: 2.0, w: 11, h: 1.7, fontSize: 94, bold: true, color: C.white, fontFace: "Georgia" });
  s.addShape(RECT, { x: 0.95, y: 3.75, w: 4.3, h: 0.045, fill: { color: C.gold }, line: { width: 0 } });
  s.addText("Field Visit Management System untuk Perkebunan Modern", { x: 0.95, y: 3.95, w: 11, h: 0.6, fontSize: 22, color: C.soft, fontFace: "Georgia" });
  s.addText([{ text: "Diajukan kepada:  ", options: { bold: true, color: C.white } }, { text: "[Nama Perusahaan]", options: { color: C.goldL, italic: true } }], { x: 0.95, y: 5.05, w: 11, h: 0.4, fontSize: 16, fontFace: "Georgia" });
  s.addText("Akbar Sinyo   ·   akbarsinyotahe@gmail.com   ·   github.com/sin-app", { x: 0.95, y: 6.55, w: 11, h: 0.4, fontSize: 12, color: C.soft, fontFace: "Arial" });
}
/* ============ SLIDE 2 — RINGKASAN EKSEKUTIF ============ */
{
  const s = pptx.addSlide(); bg(s); header(s, "Ringkasan Eksekutif", "Satu platform untuk seluruh kunjungan lapangan perkebunan Anda");
  s.addText("FVMS menggantikan alur Excel dan pencatatan manual dengan sistem web profesional yang mengelola perencanaan, eksekusi, dan pelaporan kunjungan lapangan secara terdigitalisasi, terukur, dan dapat diaudit — dari level kebun hingga direksi.", { x: 0.7, y: 1.75, w: 11.9, h: 0.85, fontSize: 14.5, color: C.mute, fontFace: "Georgia", italic: true, lineSpacingMultiple: 1.1 });
  const items = [
    { t: "100% Digital & Real-time", d: "Pantau progres kunjungan langsung, bukan rekap mingguan.", a: C.green },
    { t: "Bukti Kuat: GPS + Foto", d: "Setiap kunjungan tervalidasi lokasi & foto sebagai bukti.", a: C.gold },
    { t: "Offline-Resilient (PWA)", d: "Tetap bekerja di kebun tanpa sinyal, auto-sync saat online.", a: C.greenL },
    { t: "Laporan Menit-level", d: "Rekap yang dulu berjam-jam jadi hitungan menit.", a: C.green },
  ];
  const cw = 2.85, gap = 0.2, x0 = 0.7, y0 = 2.95, ch = 3.6;
  items.forEach((it, i) => {
    const x = x0 + i * (cw + gap);
    card(s, x, y0, cw, ch, { accent: it.a });
    badge(s, x + 0.3, y0 + 0.35, 0.7, String(i + 1), it.a, C.white);
    s.addText(it.t, { x: x + 0.3, y: y0 + 1.25, w: cw - 0.6, h: 0.7, fontSize: 14.5, bold: true, color: C.ink, fontFace: "Georgia" });
    s.addText(it.d, { x: x + 0.3, y: y0 + 1.95, w: cw - 0.6, h: 1.4, fontSize: 12, color: C.mute, fontFace: "Arial", lineSpacingMultiple: 1.05 });
  });
  footer(s, 2);
}
/* ============ SLIDE 3 — DAFTAR ISI ============ */
{
  const s = pptx.addSlide(); bg(s); header(s, "Agenda", "Daftar Isi");
  const toc = [
    ["01", "Tantangan Perkebunan Besar", "Mengapa cara manual tak lagi memadai"],
    ["02", "Biaya Status Quo", "Harga dari lambatnya data"],
    ["03", "Solusi: FVMS", "Satu sistem, semua perangkat"],
    ["04", "Alur Kerja Lapangan", "Dari jadwal hingga laporan"],
    ["05", "Fitur Unggulan & Pengajuan Lahan", "Enam fitur inti + alur lahan"],
    ["06", "Galeri Antarmuka", "Tampilan utama FVMS"],
    ["07", "Manfaat & Nilai", "ROI yang langsung terasa"],
    ["08", "Keamanan & Kesiapan Enterprise", "Fondasi andal & transparan"],
    ["09", "Integrasi & Skalabilitas", "Terhubung & siap tumbuh"],
    ["10", "FAQ, Roadmap & Adopsi", "Keberatan & langkah mulai"],
  ];
  const colW = 5.9, x0 = 0.7, y0 = 1.85, rh = 0.94;
  toc.forEach((r, i) => {
    const col = i < 5 ? 0 : 1, row = i % 5, x = x0 + col * (colW + 0.4), y = y0 + row * rh;
    s.addText(r[0], { x, y, w: 0.85, h: 0.7, fontSize: 24, bold: true, color: C.gold, fontFace: "Georgia" });
    s.addText(r[1], { x: x + 0.9, y: y - 0.02, w: colW - 1.0, h: 0.4, fontSize: 15, bold: true, color: C.ink, fontFace: "Georgia" });
    s.addText(r[2], { x: x + 0.9, y: y + 0.36, w: colW - 1.0, h: 0.35, fontSize: 11, color: C.mute, fontFace: "Arial" });
  });
  footer(s, 3);
}
/* ============ SLIDE 4 — TANTANGAN ============ */
{
  const s = pptx.addSlide(); bg(s); header(s, "01 · Latar Belakang", "Tantangan perkebunan besar hari ini");
  const pains = [
    ["Skala & sebaran", "Ribuan hektar dan ratusan petugas tersebar antar kebun & kabupaten."],
    ["Pencatatan manual", "Jadwal & laporan di Excel rawan salah ketik dan versi berbeda."],
    ["Data terfragmentasi", "Data menyebar di banyak file; mudah terduplikasi atau tertimpa."],
    ["Tidak real-time", "Manajemen tak bisa memantau progres kunjungan secara langsung."],
    ["Bukti lemah", "Tanpa GPS & foto, sulit membuktikan kunjungan benar terjadi."],
    ["Laporan lambat", "Rekap mingguan/bulanan memakan waktu dan sering tak akurat."],
  ];
  const cw = 3.85, ch = 2.25, gx = 0.7, gy = 1.9, gap = 0.2;
  pains.forEach((p, i) => {
    const col = i % 3, row = Math.floor(i / 3), x = gx + col * (cw + gap), y = gy + row * (ch + 0.22);
    card(s, x, y, cw, ch, { accent: C.gold });
    s.addText("0" + (i + 1), { x: x + 0.3, y: y + 0.25, w: 1, h: 0.5, fontSize: 22, bold: true, color: C.gold, fontFace: "Georgia" });
    s.addText(p[0], { x: x + 0.3, y: y + 0.8, w: cw - 0.6, h: 0.5, fontSize: 15, bold: true, color: C.greenD, fontFace: "Georgia" });
    s.addText(p[1], { x: x + 0.3, y: y + 1.35, w: cw - 0.6, h: 1.2, fontSize: 12, color: C.mute, fontFace: "Arial", lineSpacingMultiple: 1.05 });
  });
  footer(s, 4);
}
/* ============ SLIDE 5 — BIAYA STATUS QUO ============ */
{
  const s = pptx.addSlide(); bg(s); header(s, "02 · Biaya Status Quo", "Harga dari lambatnya data");
  s.addChart(pptx.ChartType.bar, [
    { name: "Manual (Excel)", labels: ["Rekap laporan", "Input & validasi", "Koordinasi"], values: [40, 60, 30] },
    { name: "FVMS", labels: ["Rekap laporan", "Input & validasi", "Koordinasi"], values: [2, 6, 8] },
  ], { x: 0.7, y: 1.95, w: 7.0, h: 4.4, barDir: "col", barGrouping: "clustered", showValue: true, dataLabelColor: C.white, dataLabelFontSize: 10, chartColors: [C.mute, C.green], catAxisLabelColor: C.ink, valAxisLabelColor: C.mute, catAxisLabelFontSize: 11, valAxisLabelFontSize: 10, showLegend: true, legendPos: "t", legendColor: C.ink, legendFontSize: 11, valAxisTitle: "Jam kerja / bulan", showValAxisTitle: true, valAxisTitleColor: C.mute, valAxisTitleFontSize: 11, fontFace: "Arial" });
  card(s, 8.1, 1.95, 4.5, 4.4, { accent: C.gold });
  s.addText("Apa artinya?", { x: 8.35, y: 2.2, w: 4.0, h: 0.4, fontSize: 16, bold: true, color: C.greenD, fontFace: "Georgia" });
  s.addText([
    { text: "Hingga ~130 jam/bulan admin terbuang untuk rekap & koordinasi manual.", options: { bullet: { code: "2022" }, breakLine: true, paraSpaceAfter: 10 } },
    { text: "Data telat → keputusan ikut telat; kerugian tak terukur di lapangan.", options: { bullet: { code: "2022" }, breakLine: true, paraSpaceAfter: 10 } },
    { text: "Dengan FVMS, waktu itu turun drastis dan dialihkan ke pengawasan nyata.", options: { bullet: { code: "2022" } } },
  ], { x: 8.35, y: 2.75, w: 4.0, h: 3.4, fontSize: 12.5, color: C.ink, fontFace: "Arial", valign: "top", lineSpacingMultiple: 1.05 });
  footer(s, 5);
}
/* ============ SLIDE 6 — SOLUSI ============ */
{
  const s = pptx.addSlide(); bg(s, C.greenD);
  s.addShape(OVAL, { x: W - 3.2, y: -1.9, w: 4.4, h: 4.4, fill: { color: C.gold, transparency: 90 }, line: { width: 0 } });
  s.addShape(RECT, { x: 0.7, y: 0.5, w: 0.55, h: 0.05, fill: { color: C.gold }, line: { width: 0 } });
  s.addText("03 · SOLUSI", { x: 0.7, y: 0.58, w: 11, h: 0.3, fontSize: 11, bold: true, color: C.gold, charSpacing: 3.5, fontFace: "Georgia" });
  s.addText("FVMS: sistem kunjungan lapangan modern", { x: 0.7, y: 0.95, w: 12, h: 0.85, fontSize: 27, bold: true, color: C.white, fontFace: "Georgia" });
  s.addText("Satu platform yang menggantikan Excel manual — untuk perencanaan, eksekusi, dan pelaporan kunjungan yang terukur.", { x: 0.7, y: 1.85, w: 11.9, h: 0.6, fontSize: 14.5, color: C.soft, fontFace: "Georgia", italic: true });
  const pil = [
    ["Web & Mobile", "Satu sistem, semua perangkat — akses dari HP maupun desktop."],
    ["Offline-ready", "Lanjut bekerja tanpa sinyal; auto-sync saat kembali online."],
    ["Import cepat", "Jadwal massal dari Excel jadi hitungan menit, bukan hari."],
    ["Real-time", "Pantau progres kunjungan dan laporan secara langsung."],
  ];
  const cw = 2.85, gap = 0.2, x0 = 0.7, y0 = 2.85, ch = 3.7;
  pil.forEach((p, i) => {
    const x = x0 + i * (cw + gap);
    card(s, x, y0, cw, ch, { fill: "FFFFFF" });
    badge(s, x + 0.3, y0 + 0.35, 0.7, "✓", C.green, C.white);
    s.addText(p[0], { x: x + 0.3, y: y0 + 1.35, w: cw - 0.6, h: 0.6, fontSize: 15, bold: true, color: C.greenD, fontFace: "Georgia" });
    s.addText(p[1], { x: x + 0.3, y: y0 + 2.0, w: cw - 0.6, h: 1.4, fontSize: 12, color: C.mute, fontFace: "Arial", lineSpacingMultiple: 1.05 });
  });
  footer(s, 6);
}

/* ============ SLIDE 7 — ALUR KERJA ============ */
{
  const s = pptx.addSlide(); bg(s); header(s, "04 · Alur Kerja", "Dari jadwal hingga laporan");
  const steps = [
    ["1", "Import Jadwal", "Upload Excel → akun petugas & jadwal otomatis."],
    ["2", "Penugasan", "Petugas menerima jadwal harian di HP."],
    ["3", "Kunjungan", "Catat GPS, foto, & status di lapangan."],
    ["4", "Persetujuan Lahan", "Pengajuan lahan → review → jadwal otomatis."],
    ["5", "Pelaporan", "Dashboard & rekap otomatis, export Excel."],
  ];
  const n = steps.length, cw = 2.25, gap = 0.15, x0 = 0.7, y0 = 2.55, ch = 3.2;
  steps.forEach((st, i) => {
    const x = x0 + i * (cw + gap);
    card(s, x, y0, cw, ch, { accent: C.green });
    badge(s, x + cw / 2 - 0.45, y0 + 0.3, 0.9, st[0], C.gold, C.greenD);
    s.addText(st[1], { x: x + 0.15, y: y0 + 1.4, w: cw - 0.3, h: 0.5, fontSize: 13.5, bold: true, color: C.ink, align: "center", fontFace: "Georgia" });
    s.addText(st[2], { x: x + 0.15, y: y0 + 1.95, w: cw - 0.3, h: 1.1, fontSize: 10.5, color: C.mute, align: "center", fontFace: "Arial" });
    if (i < n - 1) s.addText("→", { x: x + cw - 0.01, y: y0 + 1.4, w: gap + 0.05, h: 0.6, fontSize: 18, bold: true, color: C.gold, align: "center", valign: "middle", fontFace: "Georgia" });
  });
  footer(s, 7);
}
/* ============ SLIDE 8 — FITUR UNGGULAN ============ */
{
  const s = pptx.addSlide(); bg(s); header(s, "05 · Fitur Unggulan", "Enam fitur inti FVMS");
  const feats = [
    ["1", "Import Excel", "Eksel → akun petugas, master data & jadwal otomatis."],
    ["2", "Jadwal & Kalender", "Kunjungan harian, filter, export PDF, aksi massal."],
    ["3", "Kunjungan GPS+Foto", "Validasi lokasi, foto (signed URL), timeline aktivitas."],
    ["4", "Notifikasi", "Lonceng real-time & pengingat harian otomatis (cron)."],
    ["5", "Dashboard", "Kartu statistik: hari ini, besok, minggu, telat, selesai."],
    ["6", "Laporan", "Rekap agregat + grafik + tabel per petugas, export Excel."],
  ];
  const cw = 3.85, ch = 2.25, gx = 0.7, gy = 1.9, gap = 0.2;
  feats.forEach((f, i) => {
    const col = i % 3, row = Math.floor(i / 3), x = gx + col * (cw + gap), y = gy + row * (ch + 0.22);
    card(s, x, y, cw, ch, { accent: C.green });
    s.addText(f[0], { x: x + 0.3, y: y + 0.3, w: 0.9, h: 0.7, fontSize: 30, bold: true, color: C.gold, fontFace: "Georgia" });
    s.addText(f[1], { x: x + 1.25, y: y + 0.35, w: cw - 1.5, h: 0.6, fontSize: 15, bold: true, color: C.ink, valign: "middle", fontFace: "Georgia" });
    s.addText(f[2], { x: x + 0.3, y: y + 1.25, w: cw - 0.6, h: 0.9, fontSize: 11.5, color: C.mute, fontFace: "Arial", lineSpacingMultiple: 1.03 });
  });
  footer(s, 8);
}
/* ============ SLIDE 9 — PENGAJUAN LAHAN ============ */
{
  const s = pptx.addSlide(); bg(s); header(s, "05 · Pengajuan Lahan", "Alur pengajuan lahan (detail)");
  const flow = [
    ["1", "Ajukan", "Produksi", "Isi lokasi, data tanam & member, GPS + akurasi, foto (maks 10). Bisa offline."],
    ["2", "Notifikasi", "Admin & QC", "Lonceng + web push real-time sesuai scope kabupaten."],
    ["3", "Review", "Admin / QC", "Tinjau detail; dapat assign petugas setelah disetujui."],
    ["4", "Keputusan", "Admin / QC", "Setuju → Approved & otomatis buat Jadwal. Tolak → wajib catatan."],
    ["5", "Tindak Lanjut", "Sistem", "Jadwal muncul di petugas; ditolak → revisi → Pending."],
  ];
  const n = flow.length, cw = 2.25, gap = 0.15, x0 = 0.7, y0 = 2.35, ch = 3.4;
  flow.forEach((f, i) => {
    const x = x0 + i * (cw + gap);
    card(s, x, y0, cw, ch, { accent: C.gold });
    badge(s, x + cw / 2 - 0.4, y0 + 0.3, 0.8, f[0], C.greenD, C.white);
    s.addText(f[1], { x: x + 0.15, y: y0 + 1.2, w: cw - 0.3, h: 0.4, fontSize: 13.5, bold: true, color: C.greenD, align: "center", fontFace: "Georgia" });
    s.addText("Peran: " + f[2], { x: x + 0.15, y: y0 + 1.6, w: cw - 0.3, h: 0.35, fontSize: 10, bold: true, color: C.gold, align: "center", fontFace: "Arial" });
    s.addText(f[3], { x: x + 0.15, y: y0 + 1.95, w: cw - 0.3, h: 1.3, fontSize: 10, color: C.mute, align: "center", fontFace: "Arial", lineSpacingMultiple: 1.02 });
    if (i < n - 1) s.addText("→", { x: x + cw - 0.01, y: y0 + 1.2, w: gap + 0.05, h: 0.6, fontSize: 18, bold: true, color: C.gold, align: "center", valign: "middle", fontFace: "Georgia" });
  });
  s.addText("Offline-ready · Otomatis jadwal saat disetujui · Validasi RLS per kabupaten & foto via signed URL.", { x: 0.7, y: 6.05, w: 11.9, h: 0.4, fontSize: 11.5, italic: true, color: C.mute, fontFace: "Arial" });
  footer(s, 9);
}
/* ============ SLIDE 10 — GALERI ============ */
{
  const s = pptx.addSlide(); bg(s); header(s, "06 · Antarmuka", "Galeri antarmuka FVMS");
  const shots = [
    ["dashboard", "Dashboard", "Kartu statistik & ringkasan harian."],
    ["schedules", "Jadwal", "Daftar kunjungan harian & filter."],
    ["visit", "Kunjungan", "Validasi GPS, foto & timeline."],
    ["reports", "Laporan", "Grafik & rekap per petugas."],
    ["lahan", "Pengajuan Lahan", "Alur persetujuan terpandu."],
  ];
  const cw = 2.3, gap = 0.15, x0 = 0.7, y0 = 1.95, fw = cw - 0.3, fh = 1.5, ch = 3.25;
  shots.forEach((sh, i) => {
    const x = x0 + i * (cw + gap);
    card(s, x, y0, cw, ch);
    const img = path.join(ASSETS, "shot-" + sh[0] + ".png");
    if (fs.existsSync(img)) s.addImage({ path: img, x: x + 0.15, y: y0 + 0.15, w: fw, h: fh, sizing: { type: "cover", w: fw, h: fh } });
    s.addShape(RECT, { x: x + 0.15, y: y0 + 0.15, w: fw, h: fh, fill: { type: "none" }, line: { color: C.line, width: 1 } });
    s.addText(sh[1], { x: x + 0.18, y: y0 + 0.15 + fh + 0.1, w: cw - 0.36, h: 0.35, fontSize: 13, bold: true, color: C.ink, fontFace: "Georgia" });
    s.addText(sh[2], { x: x + 0.18, y: y0 + 0.15 + fh + 0.45, w: cw - 0.36, h: 0.7, fontSize: 9.5, color: C.mute, fontFace: "Arial", lineSpacingMultiple: 1.02 });
  });
  s.addText("Gambar merupakan representasi antarmuka FVMS. Screenshot asli akan disisipkan dari proposal/assets/shot-*.png bila tersedia.", { x: 0.7, y: 6.4, w: 11.9, h: 0.35, fontSize: 9.5, italic: true, color: C.mute, fontFace: "Arial" });
  footer(s, 10);
}
/* ============ SLIDE 11 — MANFAAT ============ */
{
  const s = pptx.addSlide(); bg(s); header(s, "07 · Manfaat", "Nilai langsung bagi perkebunan Anda");
  const left = [
    ["Transparansi penuh", "Setiap kunjungan tervalidasi & terlihat real-time."],
    ["Hemat waktu & biaya", "Otomatisasi rekap bebas admin berjam-jam."],
    ["Akurasi data", "Tanpa salah ketik & versi file berbeda."],
  ];
  const right = [
    ["Skalabilitas", "Ribuan petugas & hektar, satu sistem."],
    ["Akuntabilitas", "Audit trail jelas per petugas & lokasi."],
    ["Keputusan cepat", "Data lapangan langsung ke tangan manajemen."],
  ];
  const cw = 5.8, x0 = 0.7, y0 = 1.95, ch = 4.3;
  [left, right].forEach((col, ci) => {
    const x = x0 + ci * (cw + 0.4);
    card(s, x, y0, cw, ch, { accent: C.green });
    col.forEach((b, i) => {
      const y = y0 + 0.4 + i * 1.27;
      badge(s, x + 0.35, y + 0.02, 0.5, String(i + 1), C.gold, C.greenD);
      s.addText(b[0], { x: x + 1.0, y, w: cw - 1.3, h: 0.45, fontSize: 15, bold: true, color: C.ink, fontFace: "Georgia" });
      s.addText(b[1], { x: x + 1.0, y: y + 0.45, w: cw - 1.3, h: 0.7, fontSize: 12, color: C.mute, fontFace: "Arial", lineSpacingMultiple: 1.03 });
    });
  });
  footer(s, 11);
}
/* ============ SLIDE 12 — KEAMANAN ============ */
{
  const s = pptx.addSlide(); bg(s); header(s, "08 · Keamanan & Compliance", "Fondasi yang andal & aman");
  const sec = [
    ["Supabase", "Platform BaaS dewasa, enkripsi & isolasi data bawaan."],
    ["Row Level Security", "Akses per peran & kabupaten; bawaan database."],
    ["Rate-limited auth", "Throttle login/OTP; perlindungan brute-force."],
    ["Signed URLs", "Foto lahan diumumkan via URL bertanda waktu."],
    ["Rate limiting", "Throttle OTP/password; perlindungan brute-force."],
    ["Audit-ready", "Log aktivitas & status jelas untuk kepatuhan."],
  ];
  const cw = 3.85, ch = 2.25, gx = 0.7, gy = 1.9, gap = 0.2;
  sec.forEach((b, i) => {
    const col = i % 3, row = Math.floor(i / 3), x = gx + col * (cw + gap), y = gy + row * (ch + 0.22);
    card(s, x, y, cw, ch, { accent: C.greenL });
    s.addText("⚜", { x: x + 0.3, y: y + 0.22, w: 0.6, h: 0.6, fontSize: 24, color: C.gold, align: "center", fontFace: "Georgia" });
    s.addText(b[0], { x: x + 1.0, y: y + 0.28, w: cw - 1.2, h: 0.55, fontSize: 14.5, bold: true, color: C.ink, valign: "middle", fontFace: "Georgia" });
    s.addText(b[1], { x: x + 0.3, y: y + 1.1, w: cw - 0.6, h: 1.0, fontSize: 11.5, color: C.mute, fontFace: "Arial", lineSpacingMultiple: 1.03 });
  });
  footer(s, 12);
}
/* ============ SLIDE 12b — ENTERPRISE READINESS ============ */
{
  const s = pptx.addSlide(); bg(s); header(s, "08 · Kesiapan Enterprise", "Transparan: kekuatan saat ini & area pengembangan");
  const cols = [
    { title: "Sudah Matang ✅", accent: C.green, items: [
      "Row-Level Security di semua tabel; skop role & kabupaten.",
      "Storage privat + signed URL; rate-limit login (brute-force).",
      "CSP & security headers; logger JSON + request-ID.",
      "Backup harian + PITR; opsi self-host (Docker).",
    ]},
    { title: "Perlu Dikembangkan 🟡", accent: C.gold, items: [
      "SSO / IdP korporat (SAML / OIDC / AD).",
      "Audit trail immutable + retensi & kepatuhan.",
      "DR runbook (RTO/RPO) + uji restore.",
      "Penetration test eksternal pra-adopsi.",
    ]},
  ];
  const cw = 5.8, x0 = 0.7, y0 = 1.95, ch = 4.3;
  cols.forEach((col, ci) => {
    const x = x0 + ci * (cw + 0.4);
    card(s, x, y0, cw, ch, { accent: col.accent });
    s.addText(col.title, { x: x + 0.3, y: y0 + 0.25, w: cw - 0.6, h: 0.5, fontSize: 16, bold: true, color: C.ink, fontFace: "Georgia" });
    s.addText(col.items.map((t) => ({ text: t, options: { bullet: { code: "2022" }, breakLine: true, paraSpaceAfter: 12 } })),
      { x: x + 0.35, y: y0 + 1.0, w: cw - 0.7, h: ch - 1.2, fontSize: 12.5, color: C.ink, fontFace: "Arial", valign: "top", lineSpacingMultiple: 1.05 });
  });
  footer(s, 13);
}
/* ============ SLIDE 14 — INTEGRASI ============ */
{
  const s = pptx.addSlide(); bg(s); header(s, "09 · Integrasi & Skalabilitas", "Terhubung & siap tumbuh");
  const intg = [
    ["Web modern (Next.js)", "PWA installable, akses HP & desktop tanpa install."],
    ["Supabase real-time", "Database & auth terkelola, sinkron instan."],
    ["Export & API", "Laporan Excel & jalur integrasi sistem lain."],
    ["Otomatisasi cron", "Notifikasi & pengingat jalan otomatis di server."],
    ["Multi-region", "Cocok kebun lintas kabupaten & provinsi."],
    ["Scale-out", "Dirancang untuk skala besar: ratusan petugas, ribuan hektar."],
  ];
  const cw = 3.85, ch = 2.25, gx = 0.7, gy = 1.9, gap = 0.2;
  intg.forEach((b, i) => {
    const col = i % 3, row = Math.floor(i / 3), x = gx + col * (cw + gap), y = gy + row * (ch + 0.22);
    card(s, x, y, cw, ch, { accent: C.gold });
    s.addText("◆", { x: x + 0.3, y: y + 0.25, w: 0.5, h: 0.5, fontSize: 18, color: C.green, align: "center", fontFace: "Arial" });
    s.addText(b[0], { x: x + 0.9, y: y + 0.3, w: cw - 1.1, h: 0.55, fontSize: 14, bold: true, color: C.greenD, valign: "middle", fontFace: "Georgia" });
    s.addText(b[1], { x: x + 0.3, y: y + 1.05, w: cw - 0.6, h: 1.0, fontSize: 11.5, color: C.mute, fontFace: "Arial", lineSpacingMultiple: 1.03 });
  });
  footer(s, 14);
}
/* ============ SLIDE 15 — DEPLOYMENT & ROADMAP ============ */
{
  const s = pptx.addSlide(); bg(s); header(s, "10 · Deployment & Roadmap", "Cara memulai");
  const dep = [
    ["Web", "Host Vercel/setara; env Supabase.", "Akses cepat, tanpa install."],
    ["Android", "APK via TWA (auto-version).", "Buka di Play Store / file APK."],
    ["Docker", "Image siap jalan.", "On-premise / internal."],
  ];
  const road = [["Fase 1", "Pilot kebun: import & kunjungan."], ["Fase 2", "Rollout regional + laporan manajemen."], ["Fase 3", "Integrasi & perluasan fitur."]];
  const cw = 3.85, ch = 2.95, gx = 0.7, gy = 1.9, gap = 0.2;
  dep.forEach((d, i) => {
    const x = gx + i * (cw + gap);
    card(s, x, gy, cw, ch, { accent: C.green });
    s.addText(d[0], { x: x + 0.3, y: gy + 0.3, w: cw - 0.6, h: 0.5, fontSize: 17, bold: true, color: C.greenD, fontFace: "Georgia" });
    s.addText(d[1], { x: x + 0.3, y: gy + 0.95, w: cw - 0.6, h: 1.0, fontSize: 12, color: C.mute, fontFace: "Arial", lineSpacingMultiple: 1.03 });
    s.addText("✓ " + d[2], { x: x + 0.3, y: gy + 2.05, w: cw - 0.6, h: 0.7, fontSize: 12, bold: true, color: C.green, fontFace: "Arial" });
  });
  const ry = gy + ch + 0.3;
  card(s, 0.7, ry, 11.9, 1.0, { accent: C.gold });
  s.addText(road.map((r, i) => ({ text: (i ? "     →     " : "") + r[0] + ": " + r[1], options: { bold: i === 0, color: i === 0 ? C.greenD : C.ink } })),
    { x: 1.0, y: ry + 0.2, w: 11.3, h: 0.6, fontSize: 13, fontFace: "Georgia", valign: "middle" });
  footer(s, 15);
}
/* ============ SLIDE 16 — FAQ ============ */
{
  const s = pptx.addSlide(); bg(s); header(s, "10 · FAQ & Keberatan", "Jawaban jujur untuk peninjau enterprise");
  const faq = [
    ["Lock-in vendor?", "Tumpukan open-source; opsi self-host Docker membebaskan dari lock-in."],
    ["SSO korporat?", "Belum; masuk roadmap prioritas. Mitigasi: manajemen akun terpusat dulu."],
    ["Kedaulatan data?", "Region dapat dipilih; atau self-host di infrastruktur sendiri."],
    ["Skala & SLA?", "Cloud-native auto-scale; SLO internal & status page perlu disepakati."],
    ["Keamanan teraudit?", "Kontrol kuat sudah ada; pentest eksternal disarankan pra-adopsi."],
    ["Integrasi sistem?", "REST API v1 (skop role) sudah ada; webhook/HRIS rencana."],
  ];
  const cw = 3.85, ch = 2.25, gx = 0.7, gy = 1.9, gap = 0.2;
  faq.forEach((f, i) => {
    const col = i % 3, row = Math.floor(i / 3), x = gx + col * (cw + gap), y = gy + row * (ch + 0.22);
    card(s, x, y, cw, ch, { accent: C.greenL });
    s.addText("Q  " + f[0], { x: x + 0.3, y: y + 0.25, w: cw - 0.6, h: 0.5, fontSize: 13.5, bold: true, color: C.greenD, fontFace: "Georgia" });
    s.addText(f[1], { x: x + 0.3, y: y + 0.85, w: cw - 0.6, h: 1.3, fontSize: 11, color: C.mute, fontFace: "Arial", lineSpacingMultiple: 1.04 });
  });
  footer(s, 16);
}
/* ============ SLIDE 17 — PENAWARAN ============ */
{
  const s = pptx.addSlide(); bg(s); header(s, "10 · Langkah Adopsi", "Skala adopsi & dukungan");
  const plans = [
    ["PILOT", "Cocok uji", C.gold, ["1 kebun percobaan", "Setup & import data", "Pelatihan dasar", "Dukungan email"]],
    ["STANDAR", "Untuk operasional", C.green, ["Multi-kebun regional", "Notifikasi & laporan", "Pelatihan tim", "Dukungan prioritas"]],
    ["ENTERPRISE", "Skala perusahaan", C.greenD, ["Lintas provinsi", "Integrasi & kustom", "SLA & dedi", "On-premise opsional"]],
  ];
  const cw = 3.85, ch = 4.3, gx = 0.7, gy = 1.9, gap = 0.2;
  plans.forEach((p, i) => {
    const x = gx + i * (cw + gap);
    card(s, x, gy, cw, ch);
    s.addShape(RECT, { x, y: gy, w: cw, h: 0.72, fill: { color: p[2] }, line: { width: 0 } });
    s.addText(p[0], { x, y: gy + 0.05, w: cw, h: 0.62, fontSize: 18, bold: true, color: C.white, align: "center", valign: "middle", fontFace: "Georgia" });
    s.addText(p[1], { x: x + 0.2, y: gy + 0.9, w: cw - 0.4, h: 0.4, fontSize: 12.5, italic: true, color: C.mute, align: "center", fontFace: "Georgia" });
    s.addText(p[3].map((t) => ({ text: t, options: { bullet: { code: "2022" }, breakLine: true, paraSpaceAfter: 9 } })),
      { x: x + 0.35, y: gy + 1.45, w: cw - 0.7, h: 2.5, fontSize: 12.5, color: C.ink, fontFace: "Arial", valign: "top", lineSpacingMultiple: 1.05 });
    s.addText("[Cakupan]", { x: x + 0.2, y: gy + ch - 0.55, w: cw - 0.4, h: 0.4, fontSize: 13, bold: true, color: p[2], align: "center", fontFace: "Georgia" });
  });
  footer(s, 17);
}
/* ============ SLIDE 16 — CALL TO ACTION ============ */
{
  const s = pptx.addSlide(); bg(s, C.greenXD);
  s.addShape(RECT, { x: 0.3, y: 0.3, w: W - 0.6, h: H - 0.6, fill: { color: C.greenXD, transparency: 100 }, line: { color: C.gold, width: 1, transparency: 45 } });
  s.addShape(OVAL, { x: W - 3.2, y: -1.9, w: 4.4, h: 4.4, fill: { color: C.gold, transparency: 90 }, line: { width: 0 } });
  s.addText("MARI MULAI", { x: 0.95, y: 1.7, w: 11, h: 0.5, fontSize: 15, bold: true, color: C.gold, charSpacing: 4, fontFace: "Georgia" });
  s.addText("Wujudkan kunjungan lapangan yang terukur & transparan", { x: 0.9, y: 2.3, w: 11.5, h: 1.6, fontSize: 33, bold: true, color: C.white, fontFace: "Georgia", lineSpacingMultiple: 1.05 });
  s.addText("Kami siap bantu [Nama Perusahaan] menjalankan pilot FVMS di kebun Anda — cepat, aman, dan terukur.", { x: 0.95, y: 4.0, w: 11, h: 0.8, fontSize: 16, color: C.soft, fontFace: "Georgia" });
  s.addShape(RR, { x: 0.95, y: 5.1, w: 4.3, h: 0.8, rectRadius: 0.12, fill: { color: C.gold }, line: { width: 0 }, shadow: SH });
  s.addText("Jadwalkan Demo", { x: 0.95, y: 5.1, w: 4.3, h: 0.8, fontSize: 16, bold: true, color: C.greenXD, align: "center", valign: "middle", fontFace: "Georgia" });
  s.addText("Akbar Sinyo   ·   akbarsinyotahe@gmail.com   ·   github.com/sin-app", { x: 0.95, y: 6.5, w: 11, h: 0.4, fontSize: 12, color: C.soft, fontFace: "Arial" });
}
/* ============ SLIDE 18 — LAMPIRAN ============ */
{
  const s = pptx.addSlide(); bg(s); header(s, "Lampiran", "Catatan teknis");
  const items = [
    "Frontend: Next.js (App Router) + PWA (offline via Service Worker).",
    "Backend/Auth/DB: Supabase (Postgres + RLS + Storage signed URL).",
    "Notifikasi: real-time (Supabase Realtime) + cron harian via serverless.",
    "Android: Trusted Web Activity (TWA) — versi otomatis setiap rilis.",
    "Deployment: Vercel (web) · Docker image (on-premise opsional).",
    "Data: import massal dari Excel; export laporan ke Excel.",
    "Keamanan: rate-limiting login/OTP, RLS, audit trail, validasi GPS.",
  ];
  s.addText(items.map((t) => ({ text: t, options: { bullet: { code: "2022", indent: 18 }, breakLine: true, paraSpaceAfter: 11 } })),
    { x: 0.9, y: 2.0, w: 11.5, h: 4.2, fontSize: 14, color: C.ink, fontFace: "Arial", valign: "top", lineSpacingMultiple: 1.1 });
  footer(s, 18);
}
/* ============ SLIDE 18 — TERIMA KASIH ============ */
{
  const s = pptx.addSlide(); bg(s, C.greenXD);
  s.addShape(OVAL, { x: W - 3.2, y: -1.9, w: 4.4, h: 4.4, fill: { color: C.gold, transparency: 90 }, line: { width: 0 } });
  s.addShape(OVAL, { x: -1.4, y: H - 2.3, w: 3.6, h: 3.6, fill: { color: C.greenL, transparency: 87 }, line: { width: 0 } });
  s.addText("TERIMA KASIH", { x: 0, y: 2.6, w: W, h: 1.0, fontSize: 46, bold: true, color: C.white, align: "center", fontFace: "Georgia" });
  s.addShape(RECT, { x: W / 2 - 1.5, y: 3.75, w: 3.0, h: 0.04, fill: { color: C.gold }, line: { width: 0 } });
  s.addText("FVMS — Field Visit Management System", { x: 0, y: 3.95, w: W, h: 0.5, fontSize: 18, color: C.goldL, align: "center", fontFace: "Georgia" });
  s.addText("Akbar Sinyo   ·   github.com/sin-app", { x: 0, y: 4.6, w: W, h: 0.4, fontSize: 13, color: C.soft, align: "center", fontFace: "Arial" });
}

pptx.writeFile({ fileName: path.join(__dirname, "proposal", "FVMS-Proposal.pptx") }).then((f) => console.log("Saved:", f)).catch((e) => { console.error(e); process.exit(1); });
