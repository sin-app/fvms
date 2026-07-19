"use client";

import { useActionState } from "react";
import { updateProfileAction } from "@/features/auth/actions/auth-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { User } from "@/types";
import type { ActionResponse } from "@/types/common";
import { LogoutButton } from "./logout-button";

const initialState: ActionResponse = { success: false };

interface ProfileFormProps {
  user: User;
}

export function ProfileForm({ user }: ProfileFormProps) {
  const [state, formAction, pending] = useActionState(
    updateProfileAction,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nama Lengkap</Label>
        <Input
          id="name"
          name="name"
          defaultValue={user.name}
          className={cn(state.fieldErrors?.name && "border-destructive")}
        />
        {state.fieldErrors?.name && (
          <p className="text-sm text-destructive">
            {state.fieldErrors.name[0]}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          value={user.email}
          disabled
          className="bg-muted"
        />
        <p className="text-xs text-muted-foreground">
          Email tidak dapat diubah
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Nomor Telepon</Label>
        <Input
          id="phone"
          name="phone"
          defaultValue={user.phone ?? ""}
          placeholder="08xxxxxxxxxx"
          className={cn(state.fieldErrors?.phone && "border-destructive")}
        />
        {state.fieldErrors?.phone && (
          <p className="text-sm text-destructive">
            {state.fieldErrors.phone[0]}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Role</Label>
        <Input
          value={
            user.role === "admin"
              ? "Administrator"
              : user.role === "qc"
                ? "QC"
                : "Produksi"
          }
          disabled
          className="bg-muted"
        />
      </div>

      {state.success && (
        <div className="rounded-lg bg-green-50 p-3 text-sm text-green-700">
          Profile berhasil diperbarui
        </div>
      )}

      {state.error && (
        <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          {state.error}
        </div>
      )}

      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Menyimpan..." : "Simpan Perubahan"}
        </Button>
        <LogoutButton />
      </div>
    </form>
  );
}
