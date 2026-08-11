"use client";

import { useQuery } from "@tanstack/react-query";
import { useSync } from "./sync-context";

/**
 * Query baca yang selalu mengambil data dari IndexedDB.
 * - Refetch otomatis saat hydrateVersion naik (sinkron selesai).
 * - placeholderData = data sebelumnya agar tidak ada flash loading.
 */
export function useLocalQuery<T>(options: {
  queryKey: unknown[];
  queryFn: () => Promise<T>;
  enabled?: boolean;
}) {
  const { hydrateVersion } = useSync();
  return useQuery({
    queryKey: [...options.queryKey, "local", hydrateVersion],
    queryFn: options.queryFn,
    enabled: options.enabled ?? true,
    staleTime: 5 * 60_000,
    placeholderData: (prev) => prev,
  });
}
