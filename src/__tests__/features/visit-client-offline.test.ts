import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getOfflineDb } from "@/lib/offline/db";
import { pendingOutboxCount, pushOutbox } from "@/lib/offline/engine";
import {
  queueScheduleUpdate,
  queueScheduleShift,
  queueScheduleDelete,
  queuePanenSave,
  queueVisitNotesUpdate,
  queuePhotoUpload,
  queuePhotoDelete,
  queuePhotoCaptionUpdate,
  getOfflineVisitDetail,
} from "@/features/visits/services/visit-client";

import { createFakeSupabase } from "../helpers/fake-supabase";

const scheduleRow = {
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
  document_no: null,
  nis: null,
  cgr: null,
  cgr_code: null,
  ph_tanah: null,
  tgl_tanam: null,
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
};

beforeEach(async () => {
  const db = getOfflineDb();
  await db.transaction("rw", [db.schedules, db.visitNotes, db.visitPhotos, db.outbox, db.meta], async () => {
    await Promise.all([
      db.schedules.clear(),
      db.visitNotes.clear(),
      db.visitPhotos.clear(),
      db.outbox.clear(),
      db.meta.clear(),
    ]);
  });
  await getOfflineDb().schedules.put({ ...scheduleRow });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("queueScheduleUpdate", () => {
  it("menolak completed untuk produksi dan gagal_total saat luring", async () => {
    await expect(
      queueScheduleUpdate({ id: "s-1", status: "completed", role: "produksi" }),
    ).rejects.toThrow("Hanya QC yang dapat menandai selesai");
    await expect(
      queueScheduleUpdate({ id: "s-1", status: "gagal_total", role: "qc" }),
    ).rejects.toThrow("hanya bisa diubah saat online");
    await expect(
      queueScheduleUpdate({ id: "s-1", status: "gagal_total", role: "produksi" }),
    ).rejects.toThrow("hanya bisa diubah saat online");
  });

  it("memperbolehkan completed untuk QC/admin saat luring", async () => {
    await queueScheduleUpdate({ id: "s-1", status: "completed", role: "qc" });
    const local = await getOfflineDb().schedules.get("s-1");
    expect(local?.status).toBe("completed");
    const entries = await getOfflineDb().outbox.toArray();
    expect(entries).toHaveLength(1);
    expect(entries[0].payload.status).toBe("completed");
  });

  it("mengupdate baris lokal + outbox untuk status non-final", async () => {
    await queueScheduleUpdate({ id: "s-1", status: "in_progress", latitude: -6.2, longitude: 106.8 });
    const local = await getOfflineDb().schedules.get("s-1");
    expect(local?.status).toBe("in_progress");
    expect(local?.latitude).toBe(-6.2);
    expect(local?.longitude).toBe(106.8);

    const entries = await getOfflineDb().outbox.toArray();
    expect(entries).toHaveLength(1);
    expect(entries[0].table).toBe("schedules");
    expect(entries[0].payload.status).toBe("in_progress");
    expect(entries[0].payload.latitude).toBe(-6.2);
    expect(entries[0].payload).not.toHaveProperty("label");
  });

  it("pushOutbox meneruskan hanya field yang diizinkan", async () => {
    await queueScheduleUpdate({ id: "s-1", status: "gagal_partial", label: null });
    const { supabase, calls } = createFakeSupabase({});
    const result = await pushOutbox({ supabase, limit: 10 });
    expect(result.pushed).toBe(1);

    const update = calls.find((c) => c.method === "update");
    expect(update).toBeDefined();
    const payload = update!.args[0] as Record<string, unknown>;
    expect(payload.status).toBe("gagal_partial");
    expect(payload.label).toBeNull();
    expect(Object.keys(payload).sort()).toEqual(["label", "status"]);
  });
});

describe("queueScheduleShift", () => {
  it("menggeser tanggal lokal + outbox shift", async () => {
    await queueScheduleShift("s-1", 1);
    const local = await getOfflineDb().schedules.get("s-1");
    expect(local?.visit_date).toBe("2026-08-11");

    const entries = await getOfflineDb().outbox.toArray();
    expect(entries).toHaveLength(1);
    expect(entries[0].table).toBe("schedules");
    expect(entries[0].action).toBe("shift");
    expect(entries[0].payload.days).toBe(1);
  });

  it("pushOutbox menggeser tanggal dari nilai server", async () => {
    await queueScheduleShift("s-1", -1);
    const { supabase, calls } = createFakeSupabase({
      schedules: [{ id: "s-1", visit_date: "2026-08-10" }],
    });
    const result = await pushOutbox({ supabase, limit: 10 });
    expect(result.pushed).toBe(1);

    const update = calls.find((c) => c.method === "update");
    expect(update).toBeDefined();
    expect((update!.args[0] as { visit_date?: string }).visit_date).toBe("2026-08-09");
  });

  it("menolak days 0 / bukan integer", async () => {
    await expect(queueScheduleShift("s-1", 0)).rejects.toThrow("Jumlah hari tidak valid");
    await expect(queueScheduleShift("s-1", 1.5)).rejects.toThrow("Jumlah hari tidak valid");
  });
});

describe("queueScheduleDelete", () => {
  it("menghapus baris lokal + outbox delete", async () => {
    await queueScheduleDelete("s-1");
    expect(await getOfflineDb().schedules.get("s-1")).toBeUndefined();

    const entries = await getOfflineDb().outbox.toArray();
    expect(entries).toHaveLength(1);
    expect(entries[0].action).toBe("delete");
  });

  it("pushOutbox melakukan soft delete", async () => {
    await queueScheduleDelete("s-1");
    const { supabase, calls } = createFakeSupabase({});
    const result = await pushOutbox({ supabase, limit: 10 });
    expect(result.pushed).toBe(1);

    const update = calls.find((c) => c.method === "update");
    expect(update).toBeDefined();
    expect((update!.args[0] as { deleted_at?: string }).deleted_at).toBeDefined();
  });
});

describe("queuePanenSave", () => {
  it("produksi: menyimpan panen tanpa auto-complete", async () => {
    await queuePanenSave({
      scheduleId: "s-1",
      tgl_panen: "2026-08-15",
      panen_keterangan: "Panen sukses",
      role: "produksi",
    });
    const local = await getOfflineDb().schedules.get("s-1");
    expect(local?.tgl_panen).toBe("2026-08-15");
    expect(local?.status).toBe("pending");

    const entries = await getOfflineDb().outbox.toArray();
    expect(entries).toHaveLength(1);
    expect(entries[0].payload.tgl_panen).toBe("2026-08-15");
    expect(entries[0].payload).not.toHaveProperty("_auto_complete");
  });

  it("qc: tgl_panen otomatis completed (lokal + payload)", async () => {
    await queuePanenSave({ scheduleId: "s-1", tgl_panen: "2026-08-15", role: "qc" });
    const local = await getOfflineDb().schedules.get("s-1");
    expect(local?.status).toBe("completed");

    const entries = await getOfflineDb().outbox.toArray();
    expect(entries[0].payload._auto_complete).toBe(true);
  });

  it("produksi: membersihkan panen tidak memicu completed (status re-derive)", async () => {
    await queuePanenSave({ scheduleId: "s-1", tgl_panen: "2026-08-15", role: "qc" });
    await queuePanenSave({ scheduleId: "s-1", tgl_panen: null, role: "produksi" });
    const local = await getOfflineDb().schedules.get("s-1");
    expect(local?.tgl_panen).toBeNull();
    expect(local?.status).toBe("pending");
  });

  it("pushOutbox: _auto_complete diterapkan untuk qc, diabaikan untuk produksi", async () => {
    await queuePanenSave({ scheduleId: "s-1", tgl_panen: "2026-08-15", role: "qc" });
    const { supabase, calls } = createFakeSupabase({});
    const result = await pushOutbox({
      supabase,
      limit: 10,
      user: { id: "u-1", role: "qc", assignedKabupatenIds: ["k-1"] },
    });
    expect(result.pushed).toBe(1);

    const update = calls.find((c) => c.method === "update");
    const payload = update!.args[0] as Record<string, unknown>;
    expect(payload.status).toBe("completed");
    expect(payload.tgl_panen).toBe("2026-08-15");
    expect(payload).not.toHaveProperty("_auto_complete");
  });

  it("pushOutbox: produksi tidak mendapat status completed walau payload membawa status", async () => {
    const { supabase, calls } = createFakeSupabase({});
    const db = getOfflineDb();
    await db.outbox.put({
      id: "o-1",
      table: "schedules",
      action: "upsert",
      entity_id: "s-1",
      payload: { status: "completed" },
      created_at: Date.now(),
      attempts: 0,
      last_error: null,
    });
    const result = await pushOutbox({
      supabase,
      limit: 10,
      user: { id: "u-1", role: "produksi", assignedKabupatenIds: [] },
    });
    expect(result.pushed).toBe(0);
    expect(result.failed).toBe(1);
    const entry = await db.outbox.get("o-1");
    expect(entry?.last_error).toContain("completed hanya untuk QC/admin");
    expect(calls.filter((c) => c.method === "update")).toHaveLength(0);
  });
});

describe("queueVisitNotesUpdate", () => {
  it("menulis catatan lokal + outbox lalu push replays", async () => {
    await queueVisitNotesUpdate({
      schedule_id: "s-1",
      observation: "Tanaman sehat",
      problem: "Hama ringan",
    });
    const local = await getOfflineDb().visitNotes.get("s-1");
    expect(local?.observation).toBe("Tanaman sehat");

    const { supabase, calls } = createFakeSupabase({});
    const result = await pushOutbox({ supabase, limit: 10 });
    expect(result.pushed).toBe(1);

    const upsert = calls.find((c) => c.method === "upsert");
    expect(upsert?.args[1]).toEqual({ onConflict: "schedule_id" });
  });
});

describe("queuePhotoUpload/queuePhotoDelete/queuePhotoCaptionUpdate", () => {
  it("upload: blob lokal + outbox, push uploads storage lalu row", async () => {
    const blob = new Blob(["fake-jpeg"], { type: "image/jpeg" });
    await queuePhotoUpload({ scheduleId: "s-1", blob, mimeType: "image/jpeg", userId: "u-1" });

    const photos = await getOfflineDb().visitPhotos.toArray();
    expect(photos).toHaveLength(1);
    expect(photos[0].blob).toBeInstanceOf(Blob);

    const { supabase, calls } = createFakeSupabase({});
    const result = await pushOutbox({ supabase, limit: 10 });
    expect(result.pushed).toBe(1);

    const upload = calls.find((c) => c.method === "upload");
    expect(upload).toBeDefined();
    expect(String(upload!.args[0])).toContain("s-1");
    const upsert = calls.find((c) => c.method === "upsert");
    expect(upsert).toBeDefined();
    await expect(pendingOutboxCount()).resolves.toBe(0);
  });

  it("keterangan caption: update lokal + outbox", async () => {
    const blob = new Blob(["fake-jpeg"], { type: "image/jpeg" });
    const photo = await queuePhotoUpload({ scheduleId: "s-1", blob, mimeType: "image/jpeg", userId: "u-1" });

    await queuePhotoCaptionUpdate(photo.id, "s-1", "Kondisi lahan basah");
    const local = await getOfflineDb().visitPhotos.get(photo.id);
    expect(local?.caption).toBe("Kondisi lahan basah");

    const db = getOfflineDb();
    await db.outbox.clear();
    await queuePhotoCaptionUpdate(photo.id, "s-1", "Caption final");
    const entries = await db.outbox.toArray();
    expect(entries).toHaveLength(1);
    expect(entries[0].payload.caption).toBe("Caption final");
  });

  it("delete: hapus lokal + hapus storage & row saat push", async () => {
    const blob = new Blob(["fake-jpeg"], { type: "image/jpeg" });
    const photo = await queuePhotoUpload({ scheduleId: "s-1", blob, mimeType: "image/jpeg", userId: "u-1" });
    const db = getOfflineDb();
    await db.outbox.clear();

    await queuePhotoDelete(photo.id);
    expect(await db.visitPhotos.get(photo.id)).toBeUndefined();

    const { supabase, calls } = createFakeSupabase({});
    const result = await pushOutbox({ supabase, limit: 10 });
    expect(result.pushed).toBe(1);

    const remove = calls.find((c) => c.method === "remove");
    expect(remove).toBeDefined();
    expect(String(remove!.args[0])).toContain(photo.url);
    const del = calls.find((c) => c.method === "delete");
    expect(del).toBeDefined();
  });
});

describe("getOfflineVisitDetail", () => {
  it("mengembalikan schedule + notes + photos", async () => {
    await queueVisitNotesUpdate({ schedule_id: "s-1", observation: "OK" });
    await queuePhotoUpload({ scheduleId: "s-1", blob: new Blob(["x"], { type: "image/jpeg" }), mimeType: "image/jpeg", userId: "u-1" });

    const detail = await getOfflineVisitDetail("s-1");
    expect(detail.schedule?.status).toBe("pending");
    expect(detail.notes?.observation).toBe("OK");
    expect(detail.photos).toHaveLength(1);
  });
});