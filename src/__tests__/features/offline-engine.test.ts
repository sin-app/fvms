import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getOfflineDb,
  type OfflineVisitPhoto,
  type OutboxEntry,
} from "@/lib/offline/db";
import { hydrateOffline, pendingOutboxCount, pushOutbox, syncUserContext } from "@/lib/offline/engine";

type CallRecord = { table: string; method: string; args: unknown[] };

function createFakeSupabase(scripts: { [table: string]: unknown[] | (() => unknown[]) }) {
  const calls: CallRecord[] = [];

  function builder(table: string, resolver: () => unknown) {
    const target: Record<string, unknown> = {};
    const b = new Proxy(target, {
      get(_, prop: string) {
        if (prop === "then") {
          return (onFulfilled?: (v: unknown) => unknown) => {
            const result = resolver();
            return Promise.resolve(result).then(onFulfilled);
          };
        }
        if (prop === "select" || prop === "is" || prop === "limit" || prop === "eq" || prop === "in" || prop === "order" || prop === "maybeSingle" || prop === "single") {
          return (...args: unknown[]) => {
            calls.push({ table, method: prop, args });
            return b;
          };
        }
        if (prop === "upsert" || prop === "update" || prop === "delete" || prop === "insert") {
          return (...args: unknown[]) => {
            calls.push({ table, method: prop, args });
            return Promise.resolve({ data: null, error: null });
          };
        }
        return undefined;
      },
    });
    return b;
  }

  const supabase: Record<string, unknown> = {
    from: (table: string) => {
      calls.push({ table, method: "from", args: [] });
      const script = scripts[table] ?? [];
      const rows = typeof script === "function" ? script() : script;
      return builder(table, () => ({ data: rows, error: null }));
    },
    storage: {
      from: (bucket: string) => ({
        upload: (...args: unknown[]) => {
          calls.push({ table: `storage:${bucket}`, method: "upload", args });
          return Promise.resolve({ data: { path: args[0] }, error: null });
        },
        remove: (...args: unknown[]) => {
          calls.push({ table: `storage:${bucket}`, method: "remove", args });
          return Promise.resolve({ data: {}, error: null });
        },
      }),
    },
  };

  return { supabase: supabase as never, calls };
}

const user = {
  id: "u-123",
  role: "produksi" as const,
  assignedKabupatenIds: [],
};

beforeEach(async () => {
  const db = getOfflineDb();
  await db.transaction("rw", [db.schedules, db.visitNotes, db.visitPhotos, db.regions, db.outbox, db.meta], async () => {
    await Promise.all([
      db.schedules.clear(),
      db.visitNotes.clear(),
      db.visitPhotos.clear(),
      db.regions.clear(),
      db.outbox.clear(),
      db.meta.clear(),
    ]);
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("syncUserContext", () => {
  it("menormalisasi role dan kabupaten scope", () => {
    const ctx = syncUserContext({ id: "x", role: "qc", assigned_kabupaten_ids: ["a", null, "b"] as (string | null)[] });
    expect(ctx.role).toBe("qc");
    expect(ctx.assignedKabupatenIds).toEqual(["a", "b"]);
    expect(syncUserContext({ id: "y" }).role).toBe("produksi");
  });
});

describe("hydrateOffline", () => {
  it("menyimpan schedules (dengan join denormalisasi), notes, dan regions scoped produksi", async () => {
    const { supabase, calls } = createFakeSupabase({
      schedules: [
        {
          id: "s1", visit_date: "2026-08-10", user_id: user.id, kabupaten_id: "k1",
          kecamatan_id: "c1", desa_id: "d1", status: "pending", label: null,
          block_no: "A1", no_plot: "12", member_name: "Bud", document_no: "DOC-1",
          nis: "123", cgr: "C1", cgr_code: null, ph_tanah: "6.5", tgl_tanam: null,
          real_tanam_ha: null, gagal_tanam: null, sisa_di_lahan_ha: null, detaseling: null,
          tgl_panen: null, real_panen: null, rencana_panen: null, varietas: "V1",
          updated_at: "2026-08-01T00:00:00Z",
          kabupaten: { name: "Kab A" }, kecamatan: { name: "Kec A" }, desa: { name: "Desa A" },
          users: { name: "Budi" },
        },
      ],
      visit_notes: [{ schedule_id: "s1", observation: "ok", problem: null, recommend: null, additional: null, updated_at: "x" }],
      kabupaten: [{ id: "k1", name: "Kab A" }],
      kecamatan: [{ id: "c1", name: "Kec A", kabupaten_id: "k1" }],
      desa: [{ id: "d1", name: "Desa A", kecamatan_id: "c1" }],
    });

    const result = await hydrateOffline({ supabase, user });

    expect(result.schedules).toBe(1);
    expect(result.visitNotes).toBe(1);
    expect(result.regions).toBe(3);

    const db = getOfflineDb();
    const row = await db.schedules.get("s1");
    expect(row?.member_name).toBe("Bud");
    expect(row?.kabupaten_name).toBe("Kab A");
    expect(row?.kecamatan_name).toBe("Kec A");
    expect(row?.desa_name).toBe("Desa A");
    expect(row?.user_name).toBe("Budi");
    expect((await db.visitNotes.get("s1"))?.observation).toBe("ok");
    expect(await db.regions.count()).toBe(3);

    const scoped = calls.filter((c) => c.table === "schedules" && c.method === "eq");
    expect(scoped.some((c) => c.args[0] === "user_id" && c.args[1] === user.id)).toBe(true);
  });

  it("scoping QC memakai in kabupaten tugas", async () => {
    const qc = { id: "q1", role: "qc" as const, assignedKabupatenIds: ["k9"] };
    const { supabase, calls } = createFakeSupabase({
      schedules: [], visit_notes: [], kabupaten: [], kecamatan: [], desa: [],
    });
    await hydrateOffline({ supabase, user: qc });
    const scoped = calls.find((c) => c.table === "schedules" && c.method === "in");
    expect(scoped?.args).toEqual(["kabupaten_id", ["k9"]]);
  });
});

describe("pushOutbox", () => {
  it("menjalankan upsert visit_notes dan menghapus antrean", async () => {
    const db = getOfflineDb();
    const entry: OutboxEntry = {
      id: "o1", table: "visit_notes", action: "upsert", entity_id: "s1",
      payload: { schedule_id: "s1", observation: "baru" },
      created_at: Date.now(), attempts: 0, last_error: null,
    };
    await db.outbox.put(entry);

    const { supabase, calls } = createFakeSupabase({});
    const result = await pushOutbox({ supabase, user });

    expect(result.pushed).toBe(1);
    expect(await db.outbox.count()).toBe(0);
    const upsert = calls.find((c) => c.table === "visit_notes" && c.method === "upsert");
    expect(upsert?.args[0]).toEqual({ schedule_id: "s1", observation: "baru" });
    expect(upsert?.args[1]).toEqual({ onConflict: "schedule_id" });
  });

  it("upload foto: storage dulu, baru insert visit_photos", async () => {
    const db = getOfflineDb();
    const photo: OfflineVisitPhoto = {
      id: "p1", schedule_id: "s1", url: "u-123/visits/s1/p1.jpg",
      caption: null, file_size: 100, mime_type: "image/jpeg",
      created_at: "2026-08-10T00:00:00Z", blob: new Blob(["x"], { type: "image/jpeg" }),
    };
    await db.visitPhotos.put(photo);
    await db.outbox.put({
      id: "o2", table: "visit_photos", action: "upsert", entity_id: "p1",
      payload: { id: "p1", schedule_id: "s1", url: photo.url, caption: null, file_size: 100, mime_type: "image/jpeg" },
      created_at: Date.now(), attempts: 0, last_error: null,
    });

    const { supabase, calls } = createFakeSupabase({});
    const result = await pushOutbox({ supabase, user });

    expect(result.pushed).toBe(1);
    const upload = calls.find((c) => c.method === "upload");
    expect(upload?.args[0]).toBe(photo.url);
    expect(upload?.args[1]).toBeInstanceOf(Blob);
    const insert = calls.find((c) => c.table === "visit_photos" && c.method === "upsert");
    expect(insert?.args[1]).toEqual({ onConflict: "id" });
  });

  it("entry yang gagal tetap disimpan + attempts naik", async () => {
    const db = getOfflineDb();
    await db.outbox.put({
      id: "o3", table: "schedules", action: "upsert", entity_id: "s1",
      payload: { status: "completed" },
      created_at: Date.now(), attempts: 0, last_error: null,
    });

    const failing = {
      from: (table: string) => {
        if (table !== "schedules") throw new Error("unexpected");
        const target: Record<string, unknown> = {};
        return new Proxy(target, {
          get: (_, prop: string) => {
            if (prop === "update") {
              return () => ({
                eq: () => Promise.resolve({ data: null, error: { message: "RLS violation" } }),
              });
            }
            return () => target;
          },
        });
      },
      storage: { from: () => ({ upload: vi.fn(), remove: vi.fn() }) },
    };

    const result = await pushOutbox({ supabase: failing as never, user });
    expect(result.pushed).toBe(0);
    expect(result.failed).toBe(1);
    const kept = await db.outbox.get("o3");
    expect(kept?.attempts).toBe(1);
    expect(kept?.last_error).toContain("RLS violation");
  });

  it("pendingOutboxCount menghitung sisa antrean", async () => {
    const db = getOfflineDb();
    await db.outbox.bulkPut([
      { id: "a", table: "visit_notes", action: "upsert", entity_id: "s1", payload: {}, created_at: 1, attempts: 0, last_error: null },
      { id: "b", table: "visit_notes", action: "upsert", entity_id: "s2", payload: {}, created_at: 2, attempts: 0, last_error: null },
    ]);
    expect(await pendingOutboxCount()).toBe(2);
  });
});