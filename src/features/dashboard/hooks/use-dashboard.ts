"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchDashboardData } from "../api/dashboard-client";

export function useDashboard() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: fetchDashboardData,
    refetchInterval: 30_000,
  });
}
