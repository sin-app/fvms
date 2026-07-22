"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchDashboardData } from "../api/dashboard-client";
import type { DashboardFilters } from "../types";

export function useDashboard(filters?: DashboardFilters) {
  return useQuery({
    queryKey: ["dashboard", filters],
    queryFn: () => fetchDashboardData(filters),
    refetchInterval: 30_000,
    placeholderData: (prev) => prev,
  });
}
