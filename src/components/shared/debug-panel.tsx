"use client";

import { useAuth } from "@/features/auth/components/auth-context";
import { usePathname } from "next/navigation";

// Diagnostik sementara: tampilkan state auth & route di layar.
export function DebugPanel() {
  const { user, isLoading } = useAuth();
  const path = usePathname();
  const txt = `build=4a69870 | path=${path} | loading=${isLoading ? 1 : 0} | user=${user ? `${user.role}:${user.id.slice(0, 6)}` : "NULL"}`;
  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 99998,
        background: "#111",
        color: "#0f0",
        font: "11px/1.4 monospace",
        padding: "4px 8px",
        whiteSpace: "pre-wrap",
      }}
    >
      {txt}
    </div>
  );
}
