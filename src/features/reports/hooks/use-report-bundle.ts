"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchReportBundle } from "../api/report-client";
import type { ReportFilters } from "../types";

export function useReportBundle(filters: ReportFilters) {
  return useQuery({
    queryKey: ["report-bundle", filters],
    queryFn: () => fetchReportBundle(filters),
    placeholderData: (prev) => prev,
    staleTime: 30_000,
  });
}
