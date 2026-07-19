"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ReusableDialog } from "@/components/shared/reusable-dialog";
import { RegionSelector } from "@/features/master-data";
import { cn } from "@/lib/utils";
import { useAllUsers } from "../hooks/use-users";
import type { ActionResponse } from "@/types/common";
import type { Schedule } from "@/types";

interface ScheduleFormProps {
  action: (prev: ActionResponse, formData: FormData) => Promise<ActionResponse>;
  defaultValues?: Schedule;
  onSuccess?: () => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ScheduleForm({
  action,
  defaultValues,
  onSuccess,
  open,
  onOpenChange,
}: ScheduleFormProps) {
  const [state, formAction, pending] = useActionState(
    async (prev: ActionResponse, formData: FormData) => {
      const result = await action(prev, formData);
      if (result.success && onSuccess) onSuccess();
      return result;
    },
    { success: false },
  );

  const { data: users } = useAllUsers();

  const [kabupatenId, setKabupatenId] = useState(defaultValues?.kabupaten_id ?? "");
  const [kecamatanId, setKecamatanId] = useState(defaultValues?.kecamatan_id ?? "");

  const isEditing = !!defaultValues;

  return (
    <ReusableDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? "Edit Jadwal" : "Buat Jadwal Baru"}
      description="Isi detail jadwal kunjungan lapangan"
    >
      <form action={formAction} className="space-y-4">
        {defaultValues && (
          <input type="hidden" name="id" value={defaultValues.id} />
        )}

        <div className="space-y-2">
          <Label htmlFor="user_id">Produksi</Label>
          <select
            id="user_id"
            name="user_id"
            defaultValue={defaultValues?.user_id ?? ""}
            className={cn(
              "flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm",
              state.fieldErrors?.user_id && "border-destructive",
            )}
          >
            <option value="">Pilih Produksi</option>
            {users?.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
          {state.fieldErrors?.user_id && (
            <p className="text-sm text-destructive">{state.fieldErrors.user_id[0]}</p>
          )}
        </div>

        <RegionSelector
          kabupatenId={kabupatenId}
          kecamatanId={kecamatanId}
          desaId={defaultValues?.desa_id ?? ""}
          onKabupatenChange={(id) => {
            setKabupatenId(id);
            setKecamatanId("");
          }}
          onKecamatanChange={(id) => setKecamatanId(id)}
          onDesaChange={() => {}}
        />

        <div className="space-y-2">
          <Label htmlFor="visit_date">Tanggal Kunjungan</Label>
          <Input
            id="visit_date"
            name="visit_date"
            type="date"
            defaultValue={defaultValues?.visit_date ?? ""}
            className={cn(state.fieldErrors?.visit_date && "border-destructive")}
          />
          {state.fieldErrors?.visit_date && (
            <p className="text-sm text-destructive">{state.fieldErrors.visit_date[0]}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Catatan</Label>
          <Textarea
            id="notes"
            name="notes"
            defaultValue={defaultValues?.notes ?? ""}
            placeholder="Catatan tambahan (opsional)"
          />
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
