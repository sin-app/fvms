"use client";

import { LogOut } from "lucide-react";
import { logoutAction } from "@/features/auth/actions/auth-actions";

export function LogoutButton() {
  return (
    <form action={logoutAction}>
      <button
        type="submit"
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <LogOut className="h-4 w-4" />
        Logout
      </button>
    </form>
  );
}
