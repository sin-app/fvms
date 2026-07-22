# Entity Relationship Diagram (ERD)

## Database Relationships Overview

```
┌─────────────┐       ┌──────────────┐       ┌──────────────┐
│   users     │       │  kabupaten   │       │  kecamatan   │
├─────────────┤       ├──────────────┤       ├──────────────┤
│ id (PK)     │       │ id (PK)      │       │ id (PK)      │
│ email       │       │ name         │──┐    │ name         │
│ name        │       │ code         │  │    │ code         │
│ role        │       │ is_active    │  │    │ kabupaten_id │── FK
│ assigned_   │       │ created_at   │  │    │ is_active    │
│ kabupaten_  │       │ updated_at   │  │    │ created_at   │
│ ids uuid[]  │       └──────────────┘  │    │ updated_at   │
│ avatar_url  │                        │    └──────┬───────┘
│ is_active   │                        │
│ created_at  │                        │
│ updated_at  │                        │
└──────┬──────┘                        │           │
       │                              │           │
       │ 1                            │ *         │ *
       │                              │           │
       │    ┌─────────────────────────┘           │
       │    │                                     │
       │    │  ┌──────────────────────────────────┘
       │    │  │
       │    │  │    ┌──────────────┐
       │    │  │    │    desa      │
       │    │  │    ├──────────────┤
       │    │  │    │ id (PK)      │
       │    │  └────│ kecamatan_id │── FK
       │    │       │ name         │
       │    │       │ code         │
       │    │       │ is_active    │
       │    │       │ created_at   │
       │    │       │ updated_at   │
       │    │       └──────┬───────┘
       │    │              │
       │    │              │
       │    └──────┐  ┌───┘
       │           │  │
       │           │  │
       │    ┌──────┴──┴──────────┐
       │    │    schedules        │
       │    │  ┌─────────────────┐
       │    │  │ id (PK)        │
       └────┼──│ user_id (FK)   │
            │  │ kabupaten_id   │── FK
            │  │ kecamatan_id   │── FK
             │  │ desa_id        │── FK
             │  │ cgr            │
             │  │ cgr_code       │
             │  │ block_no       │
             │  │ no_plot        │
             │  │ member_name    │
             │  │ document_no    │
             │  │ nis            │
             │  │ tgl_tanam      │
             │  │ ph_tanah       │
             │  │ real_tanam_ha  │
             │  │ gagal_tanam    │
             │  │ sisa_di_lahan_ │
             │  │ ha             │
             │  │ visit_date     │
             │  │ status         │
            │  │ notes          │
            │  │ latitude       │
            │  │ longitude      │
            │  │ visit_time     │
            │  │ created_by     │
            │  │ created_at     │
            │  │ updated_at     │
            │  └───────┬───────┘
            │          │
            │          │
            │          │ 1
            │          │
            │  ┌───────┴────────┐
            │  │  visit_notes   │
            │  │┌──────────────┐│
            │  ││ id (PK)      ││
            │  └─│ schedule_id ││── FK
            │   │ observation  ││
            │   │ problem      ││
            │   │ recommend    ││
            │   │ additional   ││
            │   │ created_at   ││
            │   │ updated_at   ││
            │   └──────────────┘│
            │   └───────────────┘
            │
            │         1
            │
            │  ┌───────┴────────┐
            │  │  visit_photos   │
            │  │┌──────────────┐│
            │  └─│ id (PK)     ││
            │   │ schedule_id  ││── FK
            │   │ url          ││
            │   │ thumbnail    ││
            │   │ caption      ││
            │   │ created_at   ││
            │   └──────────────┘│
            │   └───────────────┘
            │
            │         1
            │
            │  ┌───────┴──────────┐
            │  │  activity_logs    │
            │  │┌────────────────┐│
            │  └─│ id (PK)       ││
            │   │ user_id (FK)   ││
            │   │ action         ││
            │   │ entity_type    ││
            │   │ entity_id      ││
            │   │ metadata (JSON)││
            │   │ ip_address     ││
            │   │ user_agent     ││
            │   │ created_at     ││
            │   └────────────────┘│
            │   └─────────────────┘
            │
            │
            │  ┌────────────────┐
            │  │ notifications   │
            │  │┌──────────────┐│
            │  └─│ id (PK)     ││
            │   │ user_id (FK) ││
            │   │ title        ││
            │   │ message      ││
            │   │ type         ││
            │   │ is_read      ││
            │   │ link         ││
            │   │ created_at   ││
            │   └──────────────┘│
            │   └───────────────┘
            │
            │  ┌──────────────────┐
            │  │  excel_imports    │
            │  │┌────────────────┐│
            │  └─│ id (PK)       ││
            │   │ user_id (FK)   ││
            │   │ filename       ││
            │   │ total_rows     ││
            │   │ success_rows   ││
            │   │ error_rows     ││
            │   │ column_mapping ││ (JSON)
            │   │ status         ││
            │   │ error_log      ││ (JSON)
            │   │ created_at     ││
            │   └────────────────┘│
            │   └─────────────────┘
```

## Table Relationships Summary

| Parent | Child | Type | Foreign Key |
|--------|-------|------|-------------|
| kabupaten | kecamatan | 1:N | kecamatan.kabupaten_id |
| kecamatan | desa | 1:N | desa.kecamatan_id |
| users | schedules | 1:N | schedules.user_id |
| kabupaten | schedules | 1:N | schedules.kabupaten_id |
| kecamatan | schedules | 1:N | schedules.kecamatan_id |
| desa | schedules | 1:N | schedules.desa_id |
| schedules | visit_notes | 1:1 | visit_notes.schedule_id |
| schedules | visit_photos | 1:N | visit_photos.schedule_id |
| users | activity_logs | 1:N | activity_logs.user_id |
| users | notifications | 1:N | notifications.user_id |
| users | excel_imports | 1:N | excel_imports.user_id |

## Key Constraints

1. A Kecamatan must belong to one Kabupaten
2. A Desa must belong to one Kecamatan
3. A Schedule must reference one Kabupaten, Kecamatan, and Desa
4. A Schedule can have zero or one Visit Notes
5. A Schedule can have zero or many Visit Photos
6. Soft delete (deleted_at) for all master data tables
7. Unique constraint on kabupaten.code, kecamatan.code, desa.code
8. Status enum: 'pending', 'on_the_way', 'in_progress', 'completed', 'cancelled'
9. Role enum: 'admin', 'qc', 'produksi'
10. QC users are scoped via `users.assigned_kabupaten_ids uuid[]` (wilayah tugas) — they see/act only on schedules within those kabupaten
