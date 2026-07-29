"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchAllFieldOfficers } from "../api/users-client";

export function useAllUsers(kabupatenId?: string) {
  return useQuery({
    queryKey: ["users", "field-officers", kabupatenId],
    queryFn: () => fetchAllFieldOfficers(kabupatenId),
    staleTime: 5 * 60 * 1000,
  });
}
