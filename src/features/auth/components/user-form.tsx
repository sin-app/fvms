"use client";

import { useActionState, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ReusableDialog } from "@/components/shared/reusable-dialog";
import { cn } from "@/lib/utils";
import { useAllKabupaten } from "@/features/master-data";
import type { ActionResponse } from "@/types/common";
import type { User, UserRole } from "@/types";

interface UserFormProps {
  action: (prev: ActionResponse, formData: FormData) => Promise<ActionResponse>;
  defaultValues?: User;
  onSuccess?: () => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserForm({ action, defaultValues, onSuccess, open, onOpenChange }: UserFormProps) {
  const [state, formAction, pending] = useActionState(
    async (prev: ActionResponse, formData: FormData) => {
      const result = await action(prev, formData);
      if (result.success && onSuccess) onSuccess();
      return result;
    },
    { success: false },
  );

  const { data: kabupaten } = useAllKabupaten();
  const [role, setRole] = useState<UserRole>(defaultValues?.role ?? "produksi");
  const [selectedKab, setSelectedKab] = useState<string[]>(
    defaultValues?.assigned_kabupaten_ids ?? [],
  );

  // Reset selection when the dialog opens for a different user.
  useEffect(() => {
    setRole(defaultValues?.role ?? "produksi");
    setSelectedKab(defaultValues?.assigned_kabupaten_ids ?? []);
  }, [defaultValues, open]);

  function toggleKab(id: string) {
    setSelectedKab((prev) =>
      prev.includes(id) ? prev.filter((k) => k !== id) : [...prev, id],
    );
  }

  const isEditing = !!defaultValues;

  return (
    <ReusableDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? "Edit Pengguna" : "Tambah Pengguna"}
      description={isEditing ? "Ubah data pengguna" : "Buat akun pengguna baru"}
    >
      <form action={formAction} className="space-y-4">
        {defaultValues && <input type="hidden" name="id" value={defaultValues.id} />}

        <div className="space-y-2">
          <Label htmlFor="name">Nama</Label>
          <Input
            id="name"
            name="name"
            defaultValue={defaultValues?.name ?? ""}
            placeholder="Nama lengkap"
            className={cn(state.fieldErrors?.name && "border-destructive")}
          />
          {state.fieldErrors?.name && (
            <p className="text-sm text-destructive">{state.fieldErrors.name[0]}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            defaultValue={defaultValues?.email ?? ""}
            placeholder="email@example.com"
            className={cn(state.fieldErrors?.email && "border-destructive")}
          />
          {state.fieldErrors?.email && (
            <p className="text-sm text-destructive">{state.fieldErrors.email[0]}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="role">Role</Label>
          <select
            id="role"
            name="role"
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
            className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="admin">Admin</option>
            <option value="qc">QC</option>
            <option value="produksi">Produksi</option>
          </select>
        </div>

        {role === "qc" && (
          <div className="space-y-2">
            <Label>Wilayah Tugas (Kabupaten)</Label>
            <div className="max-h-40 overflow-y-auto rounded-lg border border-input p-2 space-y-1">
              {(kabupaten ?? []).map((k) => (
                <label key={k.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={selectedKab.includes(k.id)}
                    onChange={() => toggleKab(k.id)}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  {k.name}
                </label>
              ))}
              {(kabupaten ?? []).length === 0 && (
                <p className="text-xs text-muted-foreground">Belum ada data kabupaten.</p>
              )}
            </div>
            <input type="hidden" name="assigned_kabupaten_ids" value={selectedKab.join(",")} />
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="phone">Telepon</Label>
          <Input
            id="phone"
            name="phone"
            defaultValue={defaultValues?.phone ?? ""}
            placeholder="08xxxxxxxxxx"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="is_active"
            name="is_active"
            value="true"
            defaultChecked={defaultValues?.is_active ?? true}
            className="h-4 w-4 rounded border-gray-300"
          />
          <Label htmlFor="is_active">Akun aktif</Label>
        </div>

        {state.error && (
          <p className="text-sm text-destructive">{state.error}</p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? "Menyimpan..." : isEditing ? "Simpan" : "Buat"}
          </Button>
        </div>
      </form>
    </ReusableDialog>
  );
}
