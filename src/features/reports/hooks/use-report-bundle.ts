"use client";

import { useLocalQuery } from "@/lib/offline/use-local-query";
import { loadOfflineReportRows, buildOfflineReportData } from "../services/offline-report";
import type { ReportFilters, ReportData } from "../types";
import type { ReportRow } from "../types/report-data";

export function useReportBundle(filters: ReportFilters) {
  return useLocalQuery<{ data: ReportData; rows: ReportRow[] }>({
    queryKey: ["report-bundle", filters],
    queryFn: async () => {
      const rows = await loadOfflineReportRows(filters);
      return { rows, data: buildOfflineReportData(rows) };
    },
  });
}
