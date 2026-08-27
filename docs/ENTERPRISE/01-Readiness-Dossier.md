# FVMS — Enterprise Readiness Dossier (Untuk IT / Engineering)

**Dokumen:** Dossier Kesiapan Enterprise · **Audiens:** Tim IT / Engineering / Keamanan
**Versi:** 1.0 · **Tanggal:** 2026-08-25

> Tujuan: memberi bukti arsitektur, keamanan, dan operasional FVMS sehingga
> tim IT dapat melakukan *security review* & keputusan adopsi. Setiap klaim
> dibubuhi status: ✅ sudah ada · 🟡 sebagian / perlu penyempurnaan · 🔴 rencana.

---

## 1. Arsitektur (Ringkas)

- **Pola:** Clean Architecture + struktur *feature-based*; pemisahan Presentation
  → Application → Domain → Infrastructure.
- **Frontend:** Next.js **16.3** (App Router, React Server Components, Server
  Actions), React **19.2**, TypeScript *strict*, Tailwind **4** + shadcn/ui.
- **Backend / Data:** Supabase — PostgreSQL **15**, Supabase Auth, Supabase
  Storage (bukkit privat), **Row-Level Security** pada semua tabel.
- **Klien data:** TanStack Query **5.101** (cache/offline), TanStack Table **8.21**.
- **Spesifik domain:** ExcelJS (import), Leaflet **1.9** + react-leaflet **5**
  (peta), FullCalendar **6.1** (kalender), Dexie **4.4** (IndexedDB/offline),
  Serwist **9.5** (PWA service worker), web-push **3.6**.
- **Tes:** Vitest **4.1** + Testing Library, Playwright **1.61** (E2E).

```
[ Browser / PWA / Android TWA ]
        │  HTTPS + CSP
        ▼
[ Vercel Edge ] → Next.js (Server Components + Server Actions)
        │  Supabase SDK (JWT session)
        ▼
[ Supabase ] ── PostgreSQL (RLS) · Auth · Storage (privat, signed URL)
```

---

## 2. Postur Keamanan ✅

| Kontrol | Status | Catatan |
|---|---|---|
| **Auth & sesi** | ✅ | Supabase Auth (email/password, bcrypt); JWT; `app_metadata.role` menggerakkan RLS. |
| **Row-Level Security** | ✅ | Aktif di **semua** tabel; skop role + `assigned_kabupaten_ids` (QC) dienforce di DB **dan** aplikasi (`getAuthContext`/`canAccessSchedule`/`qcKabupatenScope`). |
| **Rate-limit login** | ✅ | 5 req/menit/IP + tabel `rate_limits`; reset password sama. |
| **Rate-limit API** | ✅ | API key *soft-limit* 300 req/menit/key. |
| **API key** | ✅ | Disimpan **hashed (sha256)**; plaintext hanya ditampilkan sekali. |
| **Storage** | ✅ | Bukit `visit-photos` **privat**; hanya dilayani via *signed URL* jangka pendek. |
| **HTTP security headers** | ✅ | CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, COOP/CORP (`next.config.ts`). |
| **Secrets** | ✅ | `src/lib/config.ts` *fail-fast*; service-role key hanya di server. |
| **Logging** | ✅ | Logger JSON terstruktur + request-ID; endpoint `/health` & `/ready`. |

**Catatan jujur:** belum ada *penetration test* eksternal tercatat; disarankan
dilakukan sebagai gerbang adopsi.

---

## 3. Tata Kelola Data & Kepatuhan 🟡

| Topik | Status | Catatan |
|---|---|---|
| **Residensi data** | ✅/🔴 | Default region Supabase (mis. Singapura). Opsi **self-host** (Docker) memungkinkan data di infrastruktur lokal. |
| **PII** | 🟡 | Data lapangan (lokasi/GPS, foto) bersifat sensitif; akses dibatasi RLS + signed URL. Kebijakan retensi eksplisit **perlu ditetapkan**. |
| **Audit trail** | 🟡 | Tabel `activity_logs` ada sebagai dasar; *immutable audit* + retensi + *data-subject rights* masih **rencana** (V3.0). |
| **Compliance (SOC 2 / GDPR)** | 🔴 | Belum; masuk peta jalan V3.0. |

---

## 4. Skalabilitas & SLA 🟡

- **Target NFR (dokumen):** ~1.000 konkuren, ~100.000 jadwal/tahun, ~500 petugas.
- **Path skala:** read replica, PgBouncer, partisi tabel — saat ini baru berupa
  *future concern*, belum ada hasil *load-test* terpublikasi.
- **SLA:** klaim "99.9% uptime" merujuk SLA Vercel; belum ada komitmen terukur
  khusus FVMS. Disarankan tetapkan SLO internal (error rate, P95 latency) + status page.

---

## 5. Opsi Hosting

| Jalur | Kelebihan | Catatan |
|---|---|---|
| **SaaS (Vercel + Supabase)** | Cepat, minim ops, auto-scale | Data di cloud penyedia; perlu tinjau residensi. |
| **Self-host (Docker standalone)** | Kontrol penuh, data lokal, bebas lock-in | Butuh VM/DB + tim ops; cron notifikasi dijadwalkan di host. |

`Dockerfile` + `docker-compose.yml` + image `ghcr.io` **sudah tersedia** ✅.

---

## 6. Integrasi & Interoperabilitas

- **REST API v1** ✅ — Bearer API-key, skop per role, CORS:
  - `GET /api/v1/schedules` (paginated, role-scoped)
  - `GET /api/v1/reports` (agregat, filter tanggal/user/kabupaten)
  - `GET/POST/DELETE /api/v1/keys` (manajemen key, admin)
  - Body error standar `{ error: { message, code } }`.
- **SSO / IdP (SAML, OIDC, LDAP/AD)** 🔴 — belum; masuk peta jalan V2.1/V3.0.
  *Ini biasanya syarat mutlak enterprise → prioritas integrasi.*
- **Webhook / sinkronisasi kalender** 🔴 — rencana V2.1.
- **Sumber master (HRIS/ERP)** 🟡 — import Excel sudah otomatis bentuk user &
  master data; integrasi langsung ke HRIS/ERP masih perlu dikembangkan.

---

## 7. Observability 🟡

- ✅ Logger terstruktur + request-ID; endpoint `/health` & `/ready`.
- ✅ Vercel Analytics; Sentry *opsional*.
- 🟡 Belum ada *centralized tracing*, *status page*, atau *on-call* terkodifikasi.

---

## 8. Backup & Disaster Recovery 🟡

- ✅ Supabase: backup harian + Point-in-Time Recovery (PITR).
- ⚠️ Dokumentasi retensi **tidak konsisten** (doc A: 30 hari + 7 hari PITR;
  doc B: 7 hari + 7 hari PITR). Perlu disatukan.
- 🔴 Belum ada **DR runbook** dengan RTO/RPO eksplisit & uji *restore*.
- **Rekomendasi:** tetapkan RPO/RTO, buat runbook, dan lakukan *restore drill*
  sebelum go-live.

---

## 9. Testing & Kualitas 🟡

- ✅ Piramida tes: unit (Vitest) → integrasi (MSW) → komponen → E2E (Playwright).
- ✅ Gerbang kualitas: 0 error TS, 0 warning lint, Lighthouse >90, axe-core 0 kritis.
- ⚠️ **Jumlah coverage tidak konsisten** antar-doc (54 vs 200+ vs >80%). Perlu
  satu laporan coverage **berdate & otoritatif** (jalankan `npm run test:coverage`).

---

## 10. Celah yang Perlu Ditutup (Daftar Jujur)

| # | Item | Prioritas | Status |
|---|---|---|---|
| 1 | **SSO / IdP korporat** | Tinggi | 🔴 rencana |
| 2 | **DR runbook + RTO/RPO + restore drill** | Tinggi | 🔴 belum |
| 3 | **Audit trail immutable + retensi & kepatuhan** | Sedang | 🔴 rencana |
| 4 | **Penetration test eksternal** | Sedang | 🔴 belum |
| 5 | **Rekonsiliasi status enum doc↔code** (`on_the_way/cancelled` → `gagal_partial/gagal_total`) | Rendah | 🟡 doc usang |
| 6 | **Laporan coverage otoritatif** | Rendah | 🟡 inkonsisten |
| 7 | **Observability terpusat + status page** | Sedang | 🟡 sebagian |

---

## 11. Rekomendasi Teknis untuk Adopsi

1. **Gerbang keamanan:** pentest + security review (RLS/Auth/Storage) sebelum pilot penuh.
2. **Integrasi SSO** sebagai prasyarat bila kebijakan perusahaan mewajibkannya.
3. **Penetapan tata kelola:** retensi data, RPO/RTO, runbook DR, kebijakan akses.
4. **Pilot terbatas** untuk membuktikan skala & UX sebelum rollout nasional.

---

*Pendukung:* `00-Executive-Summary.md`, `02-Objection-Handling-FAQ.md`,
`03-Operations-Change-Management.md`.
