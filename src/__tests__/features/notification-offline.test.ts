import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach } from "vitest";
import { getOfflineDb } from "@/lib/offline/db";
import { pushOutbox } from "@/lib/offline/engine";
import { createFakeSupabase } from "../helpers/fake-supabase";

beforeEach(async () => {
  const db = getOfflineDb();
  await db.transaction("rw", [db.notifications, db.outbox, db.meta], async () => {
    await db.notifications.clear();
    await db.outbox.clear();
    await db.meta.clear();
  });
});

describe("notifications outbox push", () => {
  it("upsert is_read diteruskan ke server saat push", async () => {
    await getOfflineDb().notifications.put({
      id: "n-1",
      user_id: "u-1",
      title: "Notif",
      message: "Pesan",
      type: "info",
      is_read: false,
      link: null,
      created_at: "2026-01-01T00:00:00Z",
    });
    await getOfflineDb().outbox.put({
      id: "o-1",
      table: "notifications",
      action: "upsert",
      entity_id: "n-1",
      payload: { id: "n-1", is_read: true },
      created_at: Date.now(),
      attempts: 0,
      last_error: null,
    });

    const { supabase, calls } = createFakeSupabase({});
    const result = await pushOutbox({
      supabase,
      limit: 10,
      user: { id: "u-1", role: "produksi", assignedKabupatenIds: [] },
    });
    expect(result.pushed).toBe(1);

    const update = calls.find((c) => c.method === "update");
    expect(update).toBeDefined();
    expect((update!.args[0] as { is_read?: boolean }).is_read).toBe(true);
    const eq = calls.find((c) => c.method === "eq");
    expect(eq!.args).toEqual(["id", "n-1"]);
  });
});
