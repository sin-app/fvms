import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase/admin-client", () => ({
  createAdminClient: vi.fn(),
}));

vi.mock("@/lib/supabase/server-client", () => ({
  createClient: vi.fn(),
}));

import { createAdminClient } from "@/lib/supabase/admin-client";
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
