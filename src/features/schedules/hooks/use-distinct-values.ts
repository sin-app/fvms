"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchDistinctFilterValues } from "../api/schedule-client";

export function useDistinctFilterValues() {
  return useQuery({
    queryKey: ["schedules", "distinct-values"],
    queryFn: fetchDistinctFilterValues,
    staleTime: 5 * 60 * 1000,
  });
}