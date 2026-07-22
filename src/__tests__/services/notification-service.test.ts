import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase/admin-client", () => ({
  createAdminClient: vi.fn(),
}));

vi.mock("@/lib/supabase/server-client", () => ({
  createClient: vi.fn(),
}));

import { createAdminClient } from "@/lib/supabase/admin-client";
import {
  createNotification,
  notifyImportCompleted,
  generateDueSoonNotifications,
} from "@/features/notifications/services/notification-service";
import { createClient } from "@/lib/supabase/server-client";
import {
  fetchNotifications,
  fetchUnreadCount,
  markAsReadAction,
  markAllAsReadAction,
} from "@/features/notifications/api/notification-client";

describe("notification-client", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("fetchNotifications", () => {
    it("returns notifications for authenticated user", async () => {
      const mockData = [
        { id: "n1", title: "Test", is_read: false },
        { id: "n2", title: "Test 2", is_read: true },
      ];
      const mockOrder = vi.fn().mockReturnValue({ limit: vi.fn().mockResolvedValue({ data: mockData }) });
      const mockEq = vi.fn().mockReturnValue({ order: mockOrder });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });

      (createClient as ReturnType<typeof vi.fn>).mockResolvedValue({
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } } }) },
      });
      (createAdminClient as ReturnType<typeof vi.fn>).mockReturnValue({
        from: vi.fn().mockReturnValue({ select: mockSelect }),
      });

      const result = await fetchNotifications();
      expect(result).toEqual(mockData);
    });

    it("returns empty array when not authenticated", async () => {
      (createClient as ReturnType<typeof vi.fn>).mockResolvedValue({
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
      });

      const result = await fetchNotifications();
      expect(result).toEqual([]);
    });
  });

  describe("fetchUnreadCount", () => {
    it("returns unread count", async () => {
      const mockEq = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ count: 5 }) });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });

      (createClient as ReturnType<typeof vi.fn>).mockResolvedValue({
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } } }) },
      });
      (createAdminClient as ReturnType<typeof vi.fn>).mockReturnValue({
        from: vi.fn().mockReturnValue({ select: mockSelect }),
      });

      const result = await fetchUnreadCount();
      expect(result).toBe(5);
    });
  });

  describe("markAsReadAction", () => {
    it("updates notification as read", async () => {
      const mockEq2 = vi.fn().mockResolvedValue({ error: null });
      const mockEq = vi.fn().mockReturnValue({ eq: mockEq2 });
      const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });

      (createAdminClient as ReturnType<typeof vi.fn>).mockReturnValue({
        from: vi.fn().mockReturnValue({ update: mockUpdate }),
      });

      await markAsReadAction("n1");
      expect(mockUpdate).toHaveBeenCalledWith({ is_read: true });
      expect(mockEq).toHaveBeenCalledWith("id", "n1");
    });
  });

  describe("markAllAsReadAction", () => {
    it("marks all notifications as read", async () => {
      const mockEq = vi.fn().mockReturnThis();
      const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });

      (createClient as ReturnType<typeof vi.fn>).mockResolvedValue({
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } } }) },
      });
      (createAdminClient as ReturnType<typeof vi.fn>).mockReturnValue({
        from: vi.fn().mockReturnValue({ update: mockUpdate }),
      });

      await markAllAsReadAction();
      expect(mockUpdate).toHaveBeenCalledWith({ is_read: true });
    });
  });
});

describe("notification-service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function mockAdmin(fromReturn: Record<string, unknown>) {
    (createAdminClient as ReturnType<typeof vi.fn>).mockReturnValue({
      from: vi.fn().mockReturnValue(fromReturn),
    });
  }

  it("createNotification inserts with defaults", async () => {
    const insert = vi.fn().mockResolvedValue({ error: null });
    mockAdmin({ insert });

    await createNotification({
      userId: "u1",
      title: "T",
      message: "M",
    });

    expect(insert).toHaveBeenCalledWith({
      user_id: "u1",
      title: "T",
      message: "M",
      type: "info",
      link: null,
    });
  });

  it("notifyImportCompleted reports success and replaced", async () => {
    const insert = vi.fn().mockResolvedValue({ error: null });
    mockAdmin({ insert });

    await notifyImportCompleted("u1", 10, 0, 2);

    const payload = insert.mock.calls[0][0];
    expect(payload.title).toBe("Impor selesai");
    expect(payload.message).toContain("10 jadwal baru");
    expect(payload.message).toContain("2 diperbarui");
    expect(payload.type).toBe("success");
  });

  it("notifyImportCompleted uses warning when errors exist", async () => {
    const insert = vi.fn().mockResolvedValue({ error: null });
    mockAdmin({ insert });

    await notifyImportCompleted("u1", 5, 3, 0);
    expect(insert.mock.calls[0][0].type).toBe("warning");
  });

  it("generateDueSoonNotifications creates one per due schedule", async () => {
    const insert = vi.fn().mockResolvedValue({ error: null });
    const select = vi.fn().mockReturnValue({
      gte: vi.fn().mockReturnValue({
        lte: vi.fn().mockReturnValue({
          neq: vi.fn().mockReturnValue({
            is: vi.fn().mockResolvedValue({
              data: [
                { user_id: "u1", visit_date: "2026-08-01", document_no: "DOC1", member_name: null },
                { user_id: "u2", visit_date: "2026-08-02", document_no: null, member_name: "Budi" },
              ],
            }),
          }),
        }),
      }),
    });
    mockAdmin({ insert, select });

    const count = await generateDueSoonNotifications();
    expect(count).toBe(2);
    expect(insert).toHaveBeenCalledTimes(2);
  });

  it("generateDueSoonNotifications returns 0 when none due", async () => {
    const insert = vi.fn().mockResolvedValue({ error: null });
    const select = vi.fn().mockReturnValue({
      gte: vi.fn().mockReturnValue({
        lte: vi.fn().mockReturnValue({
          neq: vi.fn().mockReturnValue({
            is: vi.fn().mockResolvedValue({ data: [] }),
          }),
        }),
      }),
    });
    mockAdmin({ insert, select });

    expect(await generateDueSoonNotifications()).toBe(0);
    expect(insert).not.toHaveBeenCalled();
  });
});
