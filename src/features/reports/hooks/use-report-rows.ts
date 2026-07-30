"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchReportRows } from "../api/report-client";
import type { ReportFilters } from "../types";

export function useReportRows(filters: ReportFilters) {
  return useQuery({
    queryKey: ["report-rows", filters],
    queryFn: () => fetchReportRows(filters),
  });
}
