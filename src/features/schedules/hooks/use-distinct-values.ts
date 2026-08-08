"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { fetchDistinctFilterValues } from "../api/schedule-client";
import type { DistinctFiltersInput } from "../types";

export function useDistinctFilterValues(relations?: DistinctFiltersInput) {
  return useQuery({
    queryKey: ["schedules", "distinct-values", relations ? JSON.stringify(relations) : "none"],
    queryFn: () => fetchDistinctFilterValues(relations),
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000,
  });
}