"use client";

import { useLocalQuery } from "@/lib/offline/use-local-query";
import { useAuth } from "@/features/auth/components/auth-context";
import { loadOfflineDashboard } from "../services/offline-dashboard";
import type { DashboardFilters } from "../types";

export function useDashboard(filters?: DashboardFilters) {
  const { user } = useAuth();
  const role = user?.role === "admin" || user?.role === "qc" ? user.role : "produksi";
  return useLocalQuery({
    queryKey: ["dashboard", filters ?? {}, role],
    queryFn: () => loadOfflineDashboard(role, filters),
    enabled: !!user,
  });
}
