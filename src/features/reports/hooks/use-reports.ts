"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchReportData } from "../api/report-client";
import type { ReportFilters } from "../types";

export function useReportData(filters: ReportFilters) {
  return useQuery({
    queryKey: ["report-data", filters],
    queryFn: () => fetchReportData(filters),
  });
}
