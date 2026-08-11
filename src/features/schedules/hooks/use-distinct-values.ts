"use client";

import { useLocalQuery } from "@/lib/offline/use-local-query";
import { loadOfflineDistinctValues } from "../services/offline-read";
import type { DistinctFiltersInput } from "../types";

export function useDistinctFilterValues(relations?: DistinctFiltersInput) {
  return useLocalQuery({
    queryKey: ["schedules", "distinct-values", relations ? JSON.stringify(relations) : "none"],
    queryFn: () => loadOfflineDistinctValues(relations),
  });
}