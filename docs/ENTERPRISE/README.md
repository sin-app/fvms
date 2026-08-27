# Paket Adopsi Internal Enterprise — FVMS

Kumpulan dokumen untuk mengajukan FVMS agar dipahami & dianggap layak oleh
standar perusahaan besar (Eksekutif, IT/Engineering, Operasional).

## Cara menyajikan (urutan saran)
1. **Eksekutif / C-level** → `00-Executive-Summary.md` (+ deck slide 1–2, 16 CTA)
2. **Tim IT / Engineering** → `01-Readiness-Dossier.md` (+ deck slide 8, 12b Kesiapan Enterprise, 13 Integrasi)
3. **Tim Operasional** → `03-Operations-Change-Management.md` (+ deck slide 4–7, 11 Manfaat)
4. **Peninjau / Q&A** → `02-Objection-Handling-FAQ.md` (+ deck slide 16 FAQ)

## Isi dokumen
| File | Audiens | Isi |
|---|---|---|
| `00-Executive-Summary.md` | Eksekutif | Masalah, solusi, nilai bisnis, KPI, risiko, TCO, *the ask*. |
| `01-Readiness-Dossier.md` | IT/Eng | Arsitektur, keamanan, compliance, integrasi, skala, hosting, backup/DR, tes. |
| `02-Objection-Handling-FAQ.md` | Semua | 13 keberatan umum enterprise + jawaban jujur (status ✅/🟡/🔴). |
| `03-Operations-Change-Management.md` | Operasional | Alur sebelum/sesudah, manfaat harian, pelatihan, change mgmt, SOP, rollout. |

## Aset presentasi
- `proposal/FVMS-Penjelasan-Fungsional.pdf` — **penjelasan fungsional** (tanpa bahasa
  teknis): apa yang sistem lakukan, manfaat, peran, alur kerja, & langkah adopsi.
  Cocok untuk eksekutif & operasional. Istilah asing dijelaskan formal di Glosarium.
- `proposal/FVMS-Penjelasan-Fungsional.docx` — **versi DOCX** dari penjelasan fungsional
  (hasil `node gen-functional-docx.js`), dapat diedit langsung di Word.
- `proposal/FVMS-Penjelasan-Enterprise.pdf` — **dokumen lengkap** (bisnis + teknis/IT)
  hasil `node gen-enterprise-pdf.js`; berisi keempat dokumen di atas + `GLOSARIUM.md`.
- `proposal/FVMS-Proposal.pptx` — deck (18 slide) hasil `node build-proposal.js`.
- `proposal/assets/shot-*.png` — screenshot asli UI (dashboard, schedules, visit, reports, lahan).
- Per-role screenshot (admin/produksi/QC): jalankan `capture-screenshots.js` secara
  lokal dengan akun masing-masing (Chromium tidak dapat dijalankan di sandbox ini).

## Catatan kejujuran
Beberapa kontrol enterprise masih **rencana** (🔴): SSO/IdP korporat, audit trail
immutable + retensi, DR runbook RTO/RPO, penetration test eksternal. Hal ini
dicantumkan terbuka di Dossier & FAQ agar tidak ada klaim berlebih di depan
pengambil keputusan.
