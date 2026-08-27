# FVMS — Objection-Handling FAQ (Keberatan Umum Enterprise)

**Dokumen:** FAQ Penanganan Keberatan · **Audiens:** Semua pihak peninjau (Eksekutif/IT/Ops)
**Versi:** 1.0 · **Tanggal:** 2026-08-25

> Setiap jawaban **jujur**: membedakan fakta saat ini (`✅ sudah`), sebagian
> (`🟡`), dan rencana (`🔴`). Tujuannya agar tidak ada klaim berlebih di depan
> pengambil keputusan.

---

### Q1. "Apakah kita terkunci pada vendor (lock-in) Supabase/Vercel?"
**A:** Sebagian besar tumpukan bersifat *open-source* — Next.js, PostgreSQL,
dan kode FVMS sendiri tidak berlisensi per-user. Supabase pada intinya adalah
PostgreSQL + Auth + Storage; data dapat dipindahkan ke PostgreSQL mandiri.
Selain itu **sudah tersedia image Docker standalone** (`Dockerfile` +
`docker-compose.yml`) sehingga FVMS dapat di-*self-host* penuh di infrastruktur
perusahaan. Risiko lock-in **rendah** dan dapat dihilangkan dengan opsi self-host.

### Q2. "Apakah mendukung SSO korporat (SAML/OIDC/AD/LDAP)?"
**A:** 🔴 **Belum saat ini.** Autentikasi saat ini via email/password (Supabase
Auth). Integrasi SSO masuk peta jalan (V2.1/V3.0) dan merupakan prioritas jika
kebijakan perusahaan mewajibkannya. **Mitigasi jangka pendek:** pengelolaan
akun terpusat via admin + import otomatis dari Excel; **jangka menengah:**
implementasi SSO sebelum rollout nasional.

### Q3. "Di mana data kami disimpan? Bagaimana dengan kedaulatan data?"
**A:** 🟡 Default region Supabase (mis. Singapura). Jika kebijakan mewajibkan
data di dalam negeri/infrastruktur sendiri, FVMS dapat **self-host** (Docker) di
data center perusahaan — jalur ini sudah tersedia. Keputusan residensi data
ditetapkan bersama sebelum go-live.

### Q4. "Bisakah menangani volume & skala perusahaan kita?"
**A:** 🟡 Target NFR yang didokumentasikan: ~1.000 pengguna konkuren, ~100.000
jadwal/tahun, ~500 petugas. Arsitektur *cloud-native* (Vercel + Supabase)
mendukung auto-scale. Namun **belum ada hasil load-test publik**. Rekomendasi:
lakukan uji beban pada pilot sebelum rollout nasional.

### Q5. "Seperti apa jaminan SLA & dukungan (support)?"
**A:** 🟡 Saat ini belum ada komitmen SLA khusus FVMS; SLA infrastruktur merujuk
penyedia (Vercel/Supabase). Untuk adopsi enterprise, disarankan menetapkan SLO
internal (error rate, P95 latency) + model dukungan (tim internal / mitra). Ini
perlu disepakati di kontrak adopsi.

### Q6. "Apakah sudah diaudit keamanannya?"
**A:** 🟡 Kontrol keamanan sudah kuat (RLS di semua tabel, auth rate-limited,
storage privat + signed URL, CSP/headers, logger terstruktur). Namun **belum ada
penetration test eksternal tercatat**. Rekomendasi: lakukan pentest + security
review sebagai gerbang sebelum pilot penuh.

### Q7. "Apakah memenuhi aksesibilitas & compliance (WCAG/GDPR)?"
**A:** 🟡 UI mengikuti praktik aksesibilitas dasar (target sentuh, navigasi
keyboard, label screen-reader). Compliance formal (SOC 2 / GDPR / audit trail
immutable + retensi) masih 🔴 rencana (V3.0). Kebijakan retensi data perlu
ditetapkan bersama.

### Q8. "Klaim 'offline' — seberapa matang?"
**A:** 🟡 Mode offline **sudah nyata**: bacaan offline (IndexedDB/Dexie),
kunjungan dapat diedit offline, foto dikompresi & disinkron saat online, dengan
guard status final. Namun **sinkronisasi penuh + resolusi konflik** masih dalam
peta jalan. Aplikasi Android (TWA) membutuhkan koneksi untuk instalasi/init;
offline berlaku untuk penggunaan sesi. Klaim disampaikan proporsional.

### Q9. "Berapa biayanya (TCO)?"
**A:** 🟡 FVMS *open-source* (tanpa lisensi per-user). Biaya utama = infrastruktur
+ pemeliharaan. Perkiraan order-of-magnitude: jalur SaaS ratusan–ribuan USD/bulan
(skala menengah); jalur self-host = biaya infra + tim internal. Angka pasti
 perlu validasi bersama (lihat `00-Executive-Summary.md` §7).

### Q10. "Bisa integrasi ke sistem kita (SAP/Oracle/HRIS/BI)?"
**A:** 🟡 **REST API v1 sudah ada** (Bearer key, skop role) untuk ekspos data ke
BI/ERP. Integrasi masuk langsung ke HRIS/ERP dan webhook masih 🔴 rencana.
Import Excel sudah otomatis membentuk user & master data. Roadmap: SSO + webhook
(V2.1).

### Q11. "Bagaimana jika data hilang?"
**A:** ✅ *Soft delete* (tidak hapus fisik) + backup harian Supabase + PITR.
🔴 Belum ada DR runbook RTO/RPO terukur & uji restore. Rekomendasi: tetapkan
RPO/RTO + lakukan *restore drill* sebelum go-live.

### Q12. "Risiko orang kunci (key-person) pada pengembang tunggal?"
**A:** 🟡 Kode *open-source* & terdokumentasi (16 doc + README) mengurangi risiko.
Mitigasi: serah-terima pengetahuan, akses repo perusahaan, dan (opsional) dukungan
mitra/pemeliharaan berkelanjutan dalam kontrak adopsi.

### Q13. "Fitur 'Pengajuan Lahan' — sudah matang atau baru rencana?"
**A:** 🟡 Fitur ini ada di kode (`land-proposals`) namun narasi deck lebih
menonjolkannya daripada dokumen PRD formal. Akan direkonsiliasi: jika tidak
menjadi prioritas perusahaan, dapat dikesampingkan tanpa mengganggu inti
(jadwal/kunjungan/laporan).

---

*Pendukung:* `01-Readiness-Dossier.md` (detail teknis tiap topik di atas),
`00-Executive-Summary.md`, `03-Operations-Change-Management.md`.
