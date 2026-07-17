"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchAllFieldOfficers } from "../api/users-client";

export function useAllUsers() {
  return useQuery({
    queryKey: ["users", "field-officers"],
    queryFn: fetchAllFieldOfficers,
    staleTime: 5 * 60 * 1000,
  });
}
