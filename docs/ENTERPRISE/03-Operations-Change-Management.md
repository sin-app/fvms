# FVMS — Operations & Change Management (Untuk Tim Operasional)

**Dokumen:** Operasional & Manajemen Perubahan · **Audiens:** Tim Operasional / Lapangan
**Versi:** 1.0 · **Tanggal:** 2026-08-25

> Tujuan: menjelaskan dampak harian, rencana pelatihan, dan cara meluncurkan
> FVMS tanpa mengganggu operasi lapangan.

---

## 1. Ringkasan untuk Operasional

FVMS menggantikan penyebaran & rekap Excel manual dengan satu aplikasi di
ponsel. Petugas cukup **buka aplikasi → lihat jadwal → isi kunjungan (GPS+foto)
→ selesai**; laporan terbentuk otomatis. Tidak perlu lagi kirim file antar pihak.

---

## 2. Alur Kerja: Sebelum vs Sesudah

| Tahap | Sebelum (Excel manual) | Sesudah (FVMS) |
|---|---|---|
| Penjadwalan | File disebar via email/WA | Admin import Excel → otomatis masuk sistem |
| Hari-H kunjungan | Bawa/ingat jadwal dari file | Lihat di dashboard ponsel (hari ini/besok) |
| Eksekusi | Catat di kertas/Excel, foto terpisah | Isi status, tangkap GPS, unggah foto di aplikasi |
| Pemantauan | Rekap akhir periode | Manajemen lihat progres **real-time** |
| Pelaporan | Rekap manual berjam-jam | Laporan & export otomatis (PDF/Excel) |
| Bukti & audit | Tidak ada | GPS + foto tersimpan, terlacak |

---

## 3. Manfaat Harian per Peran

- **Petugas Produksi:** jadwal di genggaman, isi kunjungan cepat, foto/GPS otomatis
  tersimpan, tidak perlu rekap malam hari.
- **QC:** pantau kunjungan di kabupaten tugasnya, isi catatan/foto/GPS, beri
  label (hijau/kuning/merah) langsung dari lapangan.
- **Admin:** kelola user & master data, import jadwal massal, lihat laporan semua
  wilayah, atur API key untuk integrasi.

---

## 4. Rencana Pelatihan (Kurikulum Usulan)

| Sesi | Peserta | Isi | Durasi |
|---|---|---|---|
| Kick-off | Semua | Mengapa FVMS, alur singkat | 30 mnt |
| Admin | Admin/IT | User, master data, import, API key | 2 jam |
| Produksi | Petugas | Login, lihat jadwal, isi kunjungan, foto/GPS | 1,5 jam |
| QC | QC | Skop kabupaten, catatan, label | 1,5 jam |
| Sandbox | Semua | Latihan di data uji | 1 jam |

Materi pelatihan akan disiapkan sebagai panduan SOP (lihat §7).

---

## 5. Manajemen Perubahan

- **Komunikasi:** sosialisasi manfaat ("lebih sedikit rekap, lebih banyak lapangan").
- **Champion:** tunjuk 1–2 pengguna teladan per wilayah untuk membantu rekan.
- **Pilot:** uji di 1 kabupaten/1 tim selama 6 minggu sebelum perluasan.
- **Umpan balik:** kanal survei/saran selama pilot; penyempurnaan cepat.
- **Cut-over:** jadwalkan di akhir periode Excel agar tidak ada data terpisah.

---

## 6. Model Dukungan (Usulan)

- **Level 1:** FAQ + panduan SOP + champion wilayah.
- **Level 2:** admin internal / tim IT perusahaan.
- **Level 3:** pengembang/mitra pemelihara (sesuai kontrak adopsi).
- **Jam layanan:** disepakati bersama (mis. hari kerja 08–17); insiden kritis
  via saluran prioritas.

---

## 7. SOP Harian (Ringkas)

**Petugas Produksi**
1. Buka FVMS → Dashboard (lihat kunjungan hari ini).
2. Buka jadwal → mulai kunjungan → isi status & catatan.
3. Tangkap GPS (pastikan akurasi layak) → unggah foto.
4. Simpan; data tersinkron (atau tersimpan offline bila tanpa sinyal).

**QC**
1. Buka FVMS → filter kabupaten tugas.
2. Tinjau kunjungan → lengkapi catatan/foto/GPS bila perlu.
3. Beri label (hijau/kuning/merah) sesuai temuan.

**Admin**
1. Import jadwal (Excel) → verifikasi hasil & notifikasi.
2. Kelola user & master data.
3. Pantau laporan; atur API key untuk integrasi BI/ERP.

---

## 8. Fase Rollout (Usulan)

1. **Persiapan (Minggu 1–2):** setup akun, migrasi data Excel, pelatihan.
2. **Pilot (Minggu 3–8):** 1 kabupaten/1 tim; ukur KPI; kumpul umpan balik.
3. **Perluasan (bulan 3+):** rollout bertahap per wilayah; integrasi SSO/HRIS.
4. **Stabilisasi:** pemantauan, penyempurnaan, SLA & DR finalisasi.

---

*Pendukung:* `00-Executive-Summary.md`, `01-Readiness-Dossier.md`,
`02-Objection-Handling-FAQ.md`.
