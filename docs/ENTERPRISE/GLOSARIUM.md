# Glosarium Istilah Asing

Dokumen ini menjelaskan secara formal padanan Bahasa Indonesia untuk istilah
asing/teknis yang digunakan dalam penjelasan FVMS, agar mudah dipahami oleh
seluruh pemangku kepentingan.

| Istilah (asing) | Penjelasan Formal (Bahasa Indonesia) |
|---|---|
| RLS (Row-Level Security) | Keamanan Tingkat Baris: pengaturan hak akses data yang diterapkan langsung di dalam basis data, sehingga setiap baris hanya dapat diakses oleh pengguna yang berhak. |
| PWA (Progressive Web App) | Aplikasi Web Progresif: aplikasi berbasis web yang dapat dipasang di perangkat dan bekerja layaknya aplikasi native, termasuk saat kondisi offline. |
| SSO (Single Sign-On) | Masuk Tunggal: kemampuan pengguna untuk masuk sekali menggunakan identitas perusahaan (misalnya Active Directory) dan langsung mengakses banyak sistem. |
| API (Application Programming Interface) | Antarmuka Pemrograman Aplikasi: cara standar bagi sistem komputer untuk saling bertukar data secara terprogram. |
| REST | Gaya arsitektur untuk layanan API berbasis HTTP; FVMS menyediakan REST API versi 1. |
| JSON (JavaScript Object Notation) | Format pertukaran data berstruktur yang ringan dan mudah dibaca oleh mesin. |
| SLA (Service Level Agreement) | Perjanjian Tingkat Layanan: komitmen resmi mengenai ketersediaan dan kinerja layanan (misalnya waktu aktif 99,9%). |
| TCO (Total Cost of Ownership) | Total Biaya Kepemilikan: seluruh biaya yang dikeluarkan selama siklus hidup sistem (infrastruktur, pemeliharaan, sumber daya manusia). |
| RPO (Recovery Point Objective) | Sasaran Titik Pemulihan: batas maksimal data yang boleh hilang, diukur dari waktu kejadian gagal. |
| RTO (Recovery Time Objective) | Sasaran Waktu Pemulihan: batas waktu maksimal hingga layanan pulih setelah gangguan. |
| DR (Disaster Recovery) | Pemulihan Bencana: rencana dan prosedur untuk memulihkan sistem pasca-insiden besar. |
| MFA (Multi-Factor Authentication) | Autentikasi Multi-Faktor: login yang memerlukan lebih dari satu bukti identitas. |
| CSP (Content Security Policy) | Kebijakan Keamanan Konten: aturan pada peramban untuk mencegah eksekusi kode berbahaya. |
| IdP (Identity Provider) | Penyedia Identitas: layanan yang mengelola identitas pengguna (contoh: Azure AD, Google Workspace). |
| SAML / OIDC | Protokol federasi identitas untuk SSO (SAML 2.0 dan OpenID Connect). |
| LDAP / AD (Active Directory) | Protokol dan direktori identitas perusahaan untuk manajemen akun serta grup. |
| HRIS | Sistem Informasi Sumber Daya Manusia: aplikasi pengelolaan kepegawaian. |
| ERP | Perencanaan Sumber Daya Perusahaan: sistem terpadu untuk proses bisnis (keuangan, rantai pasok, dan lainnya). |
| BI (Business Intelligence) | Kecerdasan Bisnis: analitik dan pelaporan untuk pengambilan keputusan. |
| E2E (End-to-End) | Uji Ujung ke Ujung: pengujian alur lengkap dari perspektif pengguna. |
| CI/CD | Integrasi Berkesinambungan dan Pengiriman Berkesinambungan: otomatisasi pengujian serta penyiapan rilis. |
| CORS | Kebijakan Berbagi Sumber Daya Lintas Asal: aturan yang mengizinkan aplikasi web memanggil API dari domain berbeda. |
| JWT | Token Web JSON: token berisi identitas pengguna yang ditandatangani secara kriptografis untuk sesi login. |
| PITR (Point-in-Time Recovery) | Pemulihan ke Titik Waktu Tertentu: kemampuan mengembalikan basis data ke kondisi pada waktu yang ditentukan. |
| IndexedDB / Dexie | Basis data lokal di peramban untuk penyimpanan offline (Dexie adalah pustaka penanganannya). |
| Service Worker / Serwist | Skrip di latar belakang peramban yang mengaktifkan fungsi offline dan notifikasi PWA. |
| TWA (Trusted Web Activity) | Aktivitas Web Tepercaya: teknik membungkus PWA menjadi aplikasi Android resmi. |
| APK / AAB | Format paket aplikasi Android (APK untuk instalasi langsung, AAB untuk distribusi Play Store). |
| Supabase | Platform backend sumber terbuka berbasis PostgreSQL yang menyediakan basis data, autentikasi, dan penyimpanan. |
| PostgreSQL | Sistem basis data relasional sumber terbuka yang matang dan handal. |
| Soft delete | Penghapusan logis: data tidak dihapus secara fisik, melainkan ditandai tidak aktif agar dapat dipulihkan. |
| Immutable audit | Jejak audit yang tidak dapat diubah (tamper-evident) untuk tujuan kepatuhan. |
| On-premise / Self-host | Penyelenggaraan sistem di infrastruktur milik sendiri (bukan di layanan awan pihak ketiga). |
| Lock-in | Ketergantungan pada satu penyedia sehingga sulit untuk beralih. |
| Webhook | Panggilan balik HTTP otomatis yang dikirim sistem ke sistem lain saat kejadian tertentu terjadi. |
