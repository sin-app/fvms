"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchDistinctCgr } from "../api/schedule-client";

export function useAllCgr() {
  return useQuery({
    queryKey: ["cgr", "distinct"],
    queryFn: fetchDistinctCgr,
    staleTime: 5 * 60 * 1000,
  });
}
