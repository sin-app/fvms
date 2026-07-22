"use client";

import { useEffect } from "react";
import { registerSw } from "@/lib/sw-register";

export function SwRegistrant() {
  useEffect(() => { registerSw(); }, []);
  return null;
}
