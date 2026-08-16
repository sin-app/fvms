import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach } from "vitest";
import { getOfflineDb } from "@/lib/offline/db";
import { pushOutbox } from "@/lib/offline/engine";
import {
  saveLandProposalOffline,
  cancelLandProposalOffline,
} from "@/features/land-proposals/services/land-proposal-client";
import { createFakeSupabase } from "../helpers/fake-supabase";

function buildForm(overrides: Record<string, string> = {}): FormData {
  const fd = new FormData();
  fd.set("kabupaten_id", "k-1");
  fd.set("kecamatan_id", "c-1");
  fd.set("desa_id", "d-1");
  fd.set("block_no", "B01");
  fd.set("ph_tanah", "6.5");
  fd.set("real_tanam_ha", "2.3");
  fd.set("latitude", "-6.2");
  fd.set("longitude", "106.8");
  fd.set("accuracy", "10");
  for (const [k, v] of Object.entries(overrides)) fd.set(k, v);
  return fd;
}

const seedProposal = {
  id: "lp-1",
  proposed_by: "u-1",
  reviewed_by: null,
  kabupaten_id: "k-1",
  kecamatan_id: "c-1",
  desa_id: "d-1",
  block_no: null,
  no_plot: null,
  document_no: null,
  member_name: null,
  cgr: null,
  cgr_code: null,
  nis: null,
  ph_tanah: null,
  real_tanam_ha: null,
  detaseling: null,
  tgl_tanam: null,
  rencana_panen: null,
  notes: null,
  latitude: null,
  longitude: null,
  accuracy: null,
  status: "pending",
  review_note: null,
  created_schedule_id: null,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
  deleted_at: null,
};

beforeEach(async () => {
  const db = getOfflineDb();
  await db.transaction("rw", [db.landProposals, db.outbox, db.meta], async () => {
    await db.landProposals.clear();
    await db.outbox.clear();
    await db.meta.clear();
  });
});

describe("saveLandProposalOffline", () => {
  it("create: tulis lokal + outbox insert, push ke server membawa GPS", async () => {
    const res = await saveLandProposalOffline(buildForm(), { id: "u-1" }, false);
    expect(res.success).toBe(true);

    const rows = await getOfflineDb().landProposals.toArray();
    expect(rows).toHaveLength(1);
    expect(rows[0]!.status).toBe("pending");
    expect(rows[0]!.latitude).toBe(-6.2);
    expect(rows[0]!.proposed_by).toBe("u-1");

    const entries = await getOfflineDb().outbox.toArray();
    expect(entries).toHaveLength(1);
    expect(entries[0]!.table).toBe("land_proposals");
    expect(entries[0]!.action).toBe("insert");

    const { supabase, calls } = createFakeSupabase({});
    const result = await pushOutbox({
      supabase,
      limit: 10,
      user: { id: "u-1", role: "produksi", assignedKabupatenIds: [] },
    });
    expect(result.pushed).toBe(1);

    const insert = calls.find((c) => c.method === "insert");
    expect(insert).toBeDefined();
    const payload = insert!.args[0] as Record<string, unknown>;
    expect(payload.kabupaten_id).toBe("k-1");
    expect(payload.status).toBe("pending");
    expect(payload.latitude).toBe(-6.2);
    expect(payload.longitude).toBe(106.8);
  });

  it("create: menolak validasi gagal (tanpa kabupaten)", async () => {
    const fd = new FormData();
    fd.set("kecamatan_id", "c-1");
    fd.set("desa_id", "d-1");
    const res = await saveLandProposalOffline(fd, { id: "u-1" }, false);
    expect(res.success).toBe(false);
    expect(res.error).toContain("Validasi");
    expect(await getOfflineDb().outbox.count()).toBe(0);
  });

  it("edit: upsert + pertahankan status lokal, tanpa status di payload", async () => {
    await getOfflineDb().landProposals.put({ ...seedProposal, status: "rejected" });
    const res = await saveLandProposalOffline(buildForm({ id: "lp-1", block_no: "B99" }), { id: "u-1" }, true);
    expect(res.success).toBe(true);

    const row = await getOfflineDb().landProposals.get("lp-1");
    expect(row?.block_no).toBe("B99");
    expect(row?.status).toBe("rejected");

    const entries = await getOfflineDb().outbox.toArray();
    expect(entries[0]!.action).toBe("upsert");
    expect(entries[0]!.payload).not.toHaveProperty("status");
  });

  it("pushOutbox memanggil onLandProposalInserted untuk proposal luring", async () => {
    await saveLandProposalOffline(buildForm(), { id: "u-1" }, false);
    const outboxEntry = (await getOfflineDb().outbox.toArray())[0]!;
    const notified: string[] = [];
    const { supabase } = createFakeSupabase({});
    const result = await pushOutbox({
      supabase,
      limit: 10,
      user: { id: "u-1", role: "produksi", assignedKabupatenIds: [] },
      onLandProposalInserted: async (proposalId, kabupatenId) => {
        notified.push(`${proposalId}:${kabupatenId}`);
      },
    });
    expect(result.pushed).toBe(1);
    expect(notified).toEqual([`${outboxEntry.entity_id}:k-1`]);
  });
});

describe("cancelLandProposalOffline", () => {
  it("ubah status lokal + outbox upsert cancelled", async () => {
    await getOfflineDb().landProposals.put({ ...seedProposal });
    const res = await cancelLandProposalOffline("lp-1");
    expect(res.success).toBe(true);

    const row = await getOfflineDb().landProposals.get("lp-1");
    expect(row?.status).toBe("cancelled");

    const entries = await getOfflineDb().outbox.toArray();
    expect(entries).toHaveLength(1);
    expect(entries[0]!.table).toBe("land_proposals");
    expect(entries[0]!.action).toBe("upsert");
    expect(entries[0]!.payload.status).toBe("cancelled");
  });
});
