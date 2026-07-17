# Wireframe Documentation

## 1. Login Page

```
┌─────────────────────────────┐
│                             │
│          [Logo]             │
│    Field Visit Management   │
│                             │
│  ┌─────────────────────┐   │
│  │ Email               │   │
│  └─────────────────────┘   │
│                             │
│  ┌─────────────────────┐   │
│  │ Password            │   │
│  └─────────────────────┘   │
│                             │
│  ┌─────────────────────┐   │
│  │     Masuk           │   │
│  └─────────────────────┘   │
│                             │
│     Lupa Password?          │
│                             │
└─────────────────────────────┘
```

## 2. Dashboard (Mobile)

```
┌─────────────────────────────┐
│ ☰ Hari Ini          🔔 👤 │
├─────────────────────────────┤
│ ┌─────┐ ┌─────┐ ┌─────┐    │
│ │Hari │ │Bulan│ │Selesai│   │
│ │ Ini │ │ Ini │ │       │   │
│ │  3  │ │ 12  │ │  45   │   │
│ └─────┘ └─────┘ └─────┘    │
│                             │
│ Jadwal Hari Ini             │
│ ┌───────────────────────┐   │
│ │ 📍 Kecamatan A        │   │
│ │   Desa X              │   │
│ │             ◉ Pending │   │
│ └───────────────────────┘   │
│ ┌───────────────────────┐   │
│ │ 📍 Kecamatan B        │   │
│ │   Desa Y              │   │
│ │             ◉ Pending │   │
│ └───────────────────────┘   │
│                             │
│ Aktivitas Terbaru          │
│ • Completed Desa Z  10:30  │
│ • Upload 3 foto     09:15  │
│ • Mulai kunjungan   08:00  │
│                             │
├─────────────────────────────┤
│ 🏠  📅  📋  👤  ☰           │
└─────────────────────────────┘
```

## 3. Dashboard (Desktop)

```
┌──────────┬──────────────────────────────────┐
│          │  Dashboard                🔔 👤  │
│ [Logo]   ├──────────────────────────────────┤
│          │  ┌──────┐ ┌──────┐ ┌──────┐     │
│ 🏠 Dash  │  │Hari  │ │Bulan │ │Seles│     │
│ 📋 Sched │  │ Ini  │ │ Ini  │ │ ai   │     │
│ 📅 Calen │  │  3   │ │  12  │ │ 45   │     │
│ 📁 Maste │  └──────┘ └──────┘ └──────┘     │
│   Kabup  │                                  │
│   Kecam  │  Jadwal Hari Ini                 │
│   Desa   │  ┌────────────────────────┐      │
│ 📤 Impo  │  │ 📍 Kecamatan A         │      │
│ 📊 Repo  │  │   Desa X               │      │
│ 👥 Users │  │               ◉ Pending│      │
│ 🔔 Notif │  └────────────────────────┘      │
│          │  ┌────────────────────────┐      │
│          │  │ 📍 Kecamatan B         │      │
│          │  │   Desa Y               │      │
│          │  │               ◉ Pending│      │
│          │  └────────────────────────┘      │
│          │                                  │
│          │  Aktivitas Terbaru               │
│          │  • Completed Desa Z  10:30       │
│          │  • Upload 3 foto     09:15       │
│          │  • Mulai kunjungan   08:00       │
│          │                                  │
└──────────┴──────────────────────────────────┘
```

## 4. Schedule List

```
┌─────────────────────────────┐
│ ← Jadwal           + Tambah │
├─────────────────────────────┤
│ 🔍 Cari lokasi...           │
│                             │
│ [Semua Status ▾] [Bulan ▾]  │
│                             │
│ ┌───────────────────────┐   │
│ │ 15 Jul 2024           │   │
│ │ 📍 Kab. A > Kec. B    │   │
│ │         ◉ Completed   │   │
│ │          🕐 08:30     │   │
│ └───────────────────────┘   │
│ ┌───────────────────────┐   │
│ │ 15 Jul 2024           │   │
│ │ 📍 Kab. A > Kec. C    │   │
│ │         ◉ In Progress │   │
│ └───────────────────────┘   │
│ ┌───────────────────────┐   │
│ │ 16 Jul 2024           │   │
│ │ 📍 Kab. D > Kec. E    │   │
│ │         ◉ Pending     │   │
│ └───────────────────────┘   │
│                             │
│          « 1 2 3 »          │
├─────────────────────────────┤
│ 🏠  📅  📋  👤  ☰           │
└─────────────────────────────┘
```

## 5. Visit Detail

```
┌─────────────────────────────┐
│ ← Detail Kunjungan    ⚙️   │
├─────────────────────────────┤
│ Status: ◉ Pending           │
│ [Ubah Status ▾]             │
│                             │
│ Informasi                   │
│ 📅 15 Juli 2024             │
│ 📍 Kabupaten A              │
│ 📍 Kecamatan B              │
│ 📍 Desa C                   │
│                             │
│ Lokasi GPS                  │
│ ┌───────────────────────┐   │
│ │    [Map Preview]      │   │
│ │                       │   │
│ │ [Ambil Lokasi]        │   │
│ └───────────────────────┘   │
│                             │
│ Catatan Kunjungan          │
│ Observasi                   │
│ ┌───────────────────────┐   │
│ │                       │   │
│ └───────────────────────┘   │
│ Masalah                    │
│ ┌───────────────────────┐   │
│ │                       │   │
│ └───────────────────────┘   │
│ Rekomendasi                │
│ ┌───────────────────────┐   │
│ │                       │   │
│ └───────────────────────┘   │
│                             │
│ Foto Dokumentasi            │
│ + Tambah Foto               │
│ [Foto1] [Foto2] [Foto3]    │
│                             │
│ ┌───────────────────────┐   │
│ │       Simpan          │   │
│ └───────────────────────┘   │
├─────────────────────────────┤
│ 🏠  📅  📋  👤  ☰           │
└─────────────────────────────┘
```

## 6. Calendar View

```
┌─────────────────────────────┐
│ ← Kalender                  │
├─────────────────────────────┤
│     < Juli 2024 >           │
│  📅 📅 📅 📅 📅 📅 📅      │
│  [Month ▾] [Week ▾] [Day ▾]│
│                             │
│ Min  Sen  Sel  Rab  Kam  Jum Sab │
│              1    2    3    4  │
│  5    6    7    8    9   10  11 │
│                     ●●         │
│ 12   13   14   15   16   17  18 │
│                  ●●● ●●        │
│ 19   20   21   22   23   24  25 │
│ 26   27   28   29   30   31     │
│                             │
│ ● = Kunjungan               │
│ 🔴 Pending  🟢 Completed    │
│ 🟡 Hari Ini 🔵 On The Way   │
│ ⚫ Terlambat                 │
├─────────────────────────────┤
│ 🏠  📅  📋  👤  ☰           │
└─────────────────────────────┘
```

## 7. Excel Import

```
┌─────────────────────────────┐
│ ← Import Excel              │
├─────────────────────────────┤
│ Langkah 1 dari 3: Upload    │
│                             │
│ ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐   │
│  Seret file Excel ke sini  │
│ │     atau klik untuk     │ │
│  memilih file              │
│ └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘   │
│ Format: .xlsx, .xls        │
│ Maks: 10MB                 │
│                             │
│ [Pilih File]                │
│                             │
│ ┌───────────────────────┐   │
│ │   Selanjutnya         │   │
│ └───────────────────────┘   │
├─────────────────────────────┤
│ 🏠  📅  📋  👤  ☰           │
└─────────────────────────────┘
```

## 8. Column Mapping

```
┌─────────────────────────────┐
│ ← Import Excel              │
├─────────────────────────────┤
│ Langkah 2 dari 3: Mapping   │
│                             │
│ Cocokkan kolom Excel        │
│ dengan field sistem:        │
│                             │
│ Kabupaten _____ [Kolom A ▾] │
│ Kecamatan ____ [Kolom B ▾] │
│ Desa _________ [Kolom C ▾] │
│ Tanggal ______ [Kolom D ▾] │
│                             │
│ Terdeteksi otomatis: 3/4   │
│                             │
│ ┌───────────────────────┐   │
│ │         Preview       │   │
│ └───────────────────────┘   │
│                             │
│ Kab  Kec  Desa  Tgl        │
│ ──   ───  ────  ──        │
│ A    X    P     01/07      │
│ A    Y    Q     02/07      │
│ B    Z    R     03/07      │
│                             │
│ [Kembali]     [Import]      │
├─────────────────────────────┤
│ 🏠  📅  📋  👤  ☰           │
└─────────────────────────────┘
```

## 9. Reports Page

```
┌─────────────────────────────┐
│ ← Laporan            Export │
├─────────────────────────────┤
│ Jenis Laporan               │
│ [Harian ▾] [Mingguan ▾]     │
│ [Bulanan ▾]                 │
│                             │
│ Periode                     │
│ [01/07/24] ─ [31/07/24]    │
│                             │
│ Petugas Lapangan            │
│ [Semua ▾]                   │
│                             │
│ Ringkasan                   │
│ Total: 120 | Selesai: 95   │
│ Terlambat: 5 | Batal: 3    │
│                             │
│ ┌───────────┬──────┬──────┐ │
│ │ Petugas   │ Jadwal│ Selesai│
│ ├───────────┼──────┼──────┤ │
│ │ Andi      │  30   │  28  │ │
│ │ Budi      │  25   │  22  │ │
│ │ Cici      │  28   │  25  │ │
│ │ Dedi      │  20   │  15  │ │
│ │ Eka       │  17   │   5  │ │
│ └───────────┴──────┴──────┘ │
│                             │
│ [Download Excel] [PDF]      │
├─────────────────────────────┤
│ 🏠  📅  📋  👤  ☰           │
└─────────────────────────────┘
```

## 10. Notifications

```
┌─────────────────────────────┐
│ ← Notifikasi        ⚙️     │
├─────────────────────────────┤
│ Hari Ini                   │
│ ┌───────────────────────┐   │
│ │ 🔔 3 jadwal hari ini  │   │
│ │      Lihat jadwal →   │   │
│ └───────────────────────┘   │
│                             │
│ Belum Dibaca               │
│ ┌───────────────────────┐   │
│ │ ⚠️ Jadwal terlambat!  │   │
│ │   Kunjungan ke Desa X  │   │
│ │   seharusnya kemarin   │   │
│ │              2 jam lalu│   │
│ └───────────────────────┘   │
│                             │
│ Sebelumnya                 │
│ ┌───────────────────────┐   │
│ │ ℹ️ Jadwal besok:      │   │
│ │   3 kunjungan di      │   │
│ │   Kabupaten A          │   │
│ │             1 hari lalu│   │
│ └───────────────────────┘   │
│                             │
├─────────────────────────────┤
│ 🏠  📅  📋  👤  ☰           │
└─────────────────────────────┘
```

## Key Design Notes

1. **Mobile Bottom Navigation** - Always visible, 5 tabs max
2. **Desktop Sidebar** - Collapsible, shows active route
3. **Status Badges** - Color-coded, pill-shaped, top-right of cards
4. **Cards** - White background, subtle shadow, rounded corners
5. **Buttons** - Full-width on mobile for primary actions
6. **Forms** - Stacked layout, labels above inputs
7. **Navigation** - Top bar shows current page title + back button
8. **Loading** - Skeleton screens matching layout
