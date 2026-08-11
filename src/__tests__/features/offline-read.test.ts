import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach } from "vitest";
import {
  offlineRowToSchedule,
  filterOfflineSchedules,
  loadOfflineScheduleRows,
} from "@/features/schedules/services/offline-read";
import { getOfflineDb, type OfflineScheduleRow } from "@/lib/offline/db";

const baseRow = (over: Partial<OfflineScheduleRow>): OfflineScheduleRow => ({
  id: "s-1",
  visit_date: "2026-08-10",
  user_id: "u-1",
  kabupaten_id: "k-1",
  kecamatan_id: "c-1",
  desa_id: "d-1",
  status: "pending",
  label: null,
  block_no: "B01",
  no_plot: "P01",
  member_name: "Pak Budi",
  document_no: "DOC-1",
  nis: "NIS-1",
  cgr: "CGR-A",
  cgr_code: null,
  ph_tanah: null,
  tgl_tanam: "2026-01-01",
  real_tanam_ha: null,
  gagal_tanam: null,
  sisa_di_lahan_ha: null,
  detaseling: null,
  tgl_panen: null,
  real_panen: null,
  rencana_panen: null,
  panen_keterangan: null,
  notes: null,
  varietas: null,
  latitude: null,
  longitude: null,
  accuracy: null,
  visit_time: null,
  updated_at: "2026-08-10T00:00:00Z",
  kabupaten_name: "Kab. A",
  kecamatan_name: "Kec. A",
  desa_name: "Desa A",
  user_name: "Petugas 1",
  ...over,
});

describe("offline-read", () => {
  beforeEach(async () => {
    const db = getOfflineDb();
    await db.transaction("rw", db.schedules, async () => {
      await db.schedules.clear();
    });
  });

  it("menormalkan nama join terdenormalisasi ke bentuk Schedule", () => {
    const s = offlineRowToSchedule(baseRow({ document_no: "2026/Ciherang/001" }));
    expect(s.kabupaten?.name).toBe("Kab. A");
    expect(s.kecamatan?.name).toBe("Kec. A");
    expect(s.desa?.name).toBe("Desa A");
    expect(s.users?.name).toBe("Petugas 1");
    expect(s.varietas).toBe("Ciherang");
    expect("kabupaten_name" in s).toBe(false);
    expect("user_name" in s).toBe(false);
  });

  it("memfilter status, label, region, dan rentang tanggal", () => {
    const rows = [
      baseRow({ id: "1", status: "pending", label: "hijau", visit_date: "2026-08-10" }),
      baseRow({ id: "2", status: "completed", visit_date: "2026-09-01" }),
      baseRow({ id: "3", status: "pending", label: "merah", visit_date: "2026-08-20" }),
    ].map(offlineRowToSchedule);

    expect(filterOfflineSchedules(rows, { status: "pending" }).map((r) => r.id)).toEqual(["1", "3"]);
    expect(filterOfflineSchedules(rows, { label: "hijau" }).map((r) => r.id)).toEqual(["1"]);
    expect(filterOfflineSchedules(rows, { kabupaten_id: "k-1", desa_id: "d-9" })).toEqual([]);
    expect(filterOfflineSchedules(rows, { date_from: "2026-08-11", date_to: "2026-09-01" }).map((r) => r.id)).toEqual(["2", "3"]);
  });

  it("memfilter teks ilike/like, block multi-select, dan panen", () => {
    const rows = [
      baseRow({ id: "1", member_name: "Pak Budi", document_no: "2026/Ciherang/001", block_no: "B01" }),
      baseRow({ id: "2", member_name: "Ibu Sari", document_no: "2026/IR64/002", block_no: "B01" }),
      baseRow({ id: "3", member_name: "Pak Budi", document_no: "2026/Ciherang/003", block_no: "B02", tgl_panen: "2026-08-01" }),
      baseRow({ id: "4", member_name: "Pak Joko", document_no: "KJM/JMP-18/AMP-V/2026/133", block_no: "B03" }),
    ].map(offlineRowToSchedule);

    expect(filterOfflineSchedules(rows, { member_name: "budi" }).map((r) => r.id)).toEqual(["1", "3"]);
    expect(filterOfflineSchedules(rows, { varietas: "cih" }).map((r) => r.id)).toEqual(["1", "3"]);
    // varietas diekstrak dari segmen kedua document_no: KJM/JMP-18/... -> JMP-18
    expect(filterOfflineSchedules(rows, { varietas: "jmp" }).map((r) => r.id)).toEqual(["4"]);
    expect(rows[3].varietas).toBe("JMP-18");
    expect(filterOfflineSchedules(rows, { block_no: ["B01"] }).map((r) => r.id)).toEqual(["1", "2"]);
    expect(filterOfflineSchedules(rows, { panen_status: "panen" }).map((r) => r.id)).toEqual(["3"]);
  });

  it("memuat baris offline tersortir per tanggal", async () => {
    const db = getOfflineDb();
    await db.schedules.bulkPut([
      baseRow({ id: "a", visit_date: "2026-08-10" }),
      baseRow({ id: "b", visit_date: "2026-07-01", user_id: "u-2" }),
      baseRow({ id: "c", visit_date: "2026-08-01" }),
    ]);

    const rows = await loadOfflineScheduleRows({ user_id: "u-1" });
    expect(rows.map((r) => r.id)).toEqual(["c", "a"]);
    expect(rows[0].kabupaten?.name).toBe("Kab. A");
  });
});