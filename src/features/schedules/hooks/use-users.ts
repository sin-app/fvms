"use client";

import { useLocalQuery } from "@/lib/offline/use-local-query";
import { useSync } from "@/lib/offline/sync-context";
import { fetchAllFieldOfficers } from "../api/users-client";
import { loadOfflineOfficers } from "../services/offline-read";

export function useAllUsers(kabupatenId?: string) {
  const { online } = useSync();
  return useLocalQuery({
    queryKey: ["users", "field-officers", kabupatenId, online],
    queryFn: async () => {
      const offline = await loadOfflineOfficers(kabupatenId);
      if (offline.length > 0) return offline;
      if (online) return fetchAllFieldOfficers(kabupatenId);
      return [];
    },
  });
}
