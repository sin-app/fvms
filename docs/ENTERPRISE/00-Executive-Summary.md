# FVMS — Ringkasan Eksekutif (Proposal Adopsi Internal)

**Dokumen:** Ringkasan Eksekutif · **Audiens:** Direksi / C-level / Pengambil Keputusan
**Versi:** 1.0 · **Tanggal:** 2026-08-25 · **Status:** Usulan Adopsi Internal

---

## 1. Ringkasan

FVMS (Field Visit Management System) adalah aplikasi web **mobile-first** yang
menggantikan alur kerja kunjungan lapangan berbasis Excel menjadi sistem
terpusat, digital, dan terukur. Aplikasi ini memungkinkan penjadwalan,
eksekusi (GPS + foto + catatan), pemantauan, dan pelaporan kunjungan lapangan
secara **real-time** — dapat diakses dari ponsel maupun desktop, termasuk
dalam kondisi **offline** (daerah blank-spot).

FVMS bukan sekadar "digitalisasi Excel". Ia menambahkan **akuntabilitas**
(bukti lokasi & foto tersSigned URL privat), **batas akses berlapis** (admin /
QC / petugas produksi), **notifikasi otomatis**, dan **API terbuka** untuk
integrasi ke sistem perusahaan.

> **The ask (ringkas):** Persetujuan untuk menjalankan **pilot terbatas
> (1 kabupaten / 1 tim)** selama 6 minggu, dilanjutkan keputusan adopsi
> penuh berdasarkan KPI yang disepakati.

---

## 2. Masalah Saat Ini (Status Quo)

Hari ini kunjungan lapangan dikelola dengan Excel yang disebarkan manual:

| Dimensi | Kondisi Saat Ini (Excel manual) | Dampak Bisnis |
|---|---|---|
| Visibilitas | Tidak ada pantauan real-time; rekap baru muncul akhir periode | Keterlambatan intervensi, salah satukan tidak terdeteksi |
| Validitas data | Tanpa pembuktian lokasi/foto; rawan kesalahan ketik & entri ganda | Laporan tidak dapat dipertanggungjawabkan |
| Akses | File di email/WA; versi berbeda-beda antar pihak | Kehilangan data, tumpang tindih, tidak ada sumber kebenaran tunggal |
| Pelaporan | Rekap manual berjam-jam | Waktu terbuang, CGK (cycle time) pelaporan tinggi |
| Audit & kepatuhan | Tidak ada jejak siapa mengubah apa | Risiko kepatuhan & pertanggungjawaban |
| Ketahanan | Putus jika file rusak/hilang | Titik gagal tunggal (single point of failure) |

---

## 3. Solusi: Apa yang FVMS Berikan

- **Import Excel massal** (admin): unggah jadwal → petugas & master data otomatis
  terbentuk, jadwal ditambahkan/di-update tanpa duplikasi.
- **Jadwal & Kalender**: telusur per hari, filter ala-Excel (varietas, blok,
  plot, NIS, CGR, member, region, status, label), export PDF/Excel, aksi bulk.
- **Kunjungan (GPS + Foto + Catatan)**: transisi status terkendali, tangkap
  koordinat dengan validasi akurasi, unggah foto ke *bucket* privat.
- **Dashboard & Laporan**: statistik agregat, tren, tabel per-petugas, export.
- **Notifikasi**: lonceng real-time (Supabase Realtime) + pengingat terjadwal.
- **Offline / PWA / Android**: dapat dipasang di ponsel (TWA), tetap terbaca
  di daerah blank-spot, tersinkron saat kembali online.
- **API terbuka (`/api/v1`)**: akses terprogram, skop per role, untuk integrasi
  ke sistem perusahaan (BI, ERP, HRIS).

---

## 4. Nilai Bisnis & Manfaat

| Nilai | Penjelasan untuk Eksekutif |
|---|---|
| **Real-time & terpusat** | Satu sumber kebenaran; manajemen melihat progres harian, bukan mingguan. |
| **Akuntabilitas terbukti** | Bukti GPS + foto → pengurangan disputasi & kesalahan pelaporan. |
| **Efisiensi waktu** | Pelaporan berjam-jam → menit; petugas fokus ke lapangan, bukan rekap. |
| **Cakupan offline** | Tidak bergantung sinyal sempurna; cocok untuk daerah terpencil. |
| **Skalabilitas & biaya** | Arsitektur *cloud-native*; opsi *self-host* (Docker) bila diwajibkan kebijakan. |
| **Audit & kepatuhan** | RLS + logger terstruktur → dasar kepatuhan & jejak aktivitas. |

---

## 5. Dampak yang Diharapkan (KPI Usulan)

Angka di bawah adalah **target usulan** untuk dipilih bersama, bukan klaim
baseline (baseline akan diukur di awal pilot):

- **CGK pelaporan**: turun drastis (jam → menit per kunjungan).
- **Ketepatan waktu kunjungan**: naik (target mis. ≥ 90% on-time).
- **Kelengkapan data**: naik (foto/GPS terlampir ≥ 95%).
- **Adopsi**: % petugas aktif mingguan.
- **Kepuasan pengguna**: skor survei internal.

---

## 6. Risiko & Mitigasi (Ringkas)

| Risiko | Mitigasi yang Sudah Ada / Diusulkan |
|---|---|
| Adopsi lambat | UI intuitif, pelatihan, migrasi data dari Excel otomatis. |
| Akses tidak sah | Row-Level Security (DB) + validasi server + skop kabupaten QC. |
| Kehilangan data | *Soft delete* + backup Supabase + prosedur restore. |
| Gangguan koneksi/Supabase | Mode offline + opsi *self-host* (Docker). |
| Lock-in vendor | Stack *open-source* (Next.js/Supabase); dukungan *self-host*. |

---

## 7. Estimasi Biaya (TCO) — Perkiraan Awal

> Angka berikut **perkiraan order-of-magnitude** untuk validasi, bukan penawaran
> final. Kebutuhan pasti tergantung volume petugas & kebijakan infra perusahaan.

| Jalur | Komponen | Kisaran (bulanan) |
|---|---|---|
| **SaaS (cepat)** | Vercel (hosting) + Supabase (DB/Auth/Storage) + biaya dev/pemeliharaan | Ratusan–ribuan USD/bulan (skala menengah) |
| **Self-host** | VM/DB perusahaan + waktu ops (Docker standalone) | Biaya infra + tim internal |

**Catatan:** FVMS sendiri *open-source* (tanpa lisensi per-user). Biaya terbesar
adalah infrastruktur & pemeliharaan, bukan lisensi software.

---

## 8. Rekomendasi & Langkah Selanjutnya

1. **Setujui pilot 6 minggu** (1 kabupaten / 1 tim) dengan KPI terukur.
2. **Siapkan dukungan integrasi** (SSO korporat & sumber data master) — lihat Dossier IT.
3. **Bentuk tim lintas fungsi**: sponsor eksekutif + IT + operasional lapangan.
4. **Evaluasi & keputusan adopsi** berdasarkan hasil pilot.

---

*Dokumen pendukung:* `01-Readiness-Dossier.md` (untuk IT), `02-Objection-Handling-FAQ.md`
(keberatan umum), `03-Operations-Change-Management.md` (operasional & pelatihan).
