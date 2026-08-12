"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ReusableDialog } from "@/components/shared/reusable-dialog";
import { useAllUsers } from "@/features/schedules/hooks/use-users";
import { assignPetugasAction } from "../actions/land-proposal-actions";
import type { ActionResponse } from "@/types/common";
import type { LandProposal } from "@/types";

interface AssignPetugasDialogProps {
  proposal: LandProposal;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AssignPetugasDialog({ proposal, open, onOpenChange }: AssignPetugasDialogProps) {
  const router = useRouter();
  const { data: users } = useAllUsers(proposal.kabupaten_id);
  const [petugasId, setPetugasId] = useState("");

  const [state, formAction, pending] = useActionState(
    async (prev: ActionResponse, formData: FormData) => {
      const result = await assignPetugasAction(prev, formData);
      if (result.success) {
        onOpenChange(false);
        router.refresh();
      }
      return result;
    },
    { success: false },
  );

  return (
    <ReusableDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Assign Petugas"
      description="Tugaskan jadwal yang sudah disetujui ke petugas produksi."
    >
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="id" value={proposal.id} />
        <div className="space-y-2">
          <Label htmlFor="user_id">Petugas Produksi</Label>
          <select
            id="user_id"
            name="user_id"
            value={petugasId}
            onChange={(e) => setPetugasId(e.target.value)}
            className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
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

        {state.error && <p className="text-sm text-destructive">{state.error}</p>}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button type="submit" disabled={pending || !petugasId}>
            {pending ? "Menyimpan..." : "Assign"}
          </Button>
        </div>
      </form>
    </ReusableDialog>
  );
}