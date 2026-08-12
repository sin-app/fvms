"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ReusableDialog } from "@/components/shared/reusable-dialog";
import { rejectLandProposalAction } from "../actions/land-proposal-actions";
import type { ActionResponse } from "@/types/common";
import type { LandProposal } from "@/types";

interface RejectDialogProps {
  proposal: LandProposal;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RejectDialog({ proposal, open, onOpenChange }: RejectDialogProps) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    async (prev: ActionResponse, formData: FormData) => {
      const result = await rejectLandProposalAction(prev, formData);
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
      title="Tolak Pengajuan"
      description={`Pengajuan ${proposal.member_name ?? proposal.block_no ?? "lahan"} — catatan wajib diisi.`}
    >
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="id" value={proposal.id} />
        <div className="space-y-2">
          <Label htmlFor="review_note">Catatan Penolakan</Label>
          <Textarea
            id="review_note"
            name="review_note"
            placeholder="Alasan penolakan (wajib)"
            className="min-h-[6rem]"
          />
          {state.fieldErrors?.review_note && (
            <p className="text-sm text-destructive">{state.fieldErrors.review_note[0]}</p>
          )}
        </div>

        {state.error && <p className="text-sm text-destructive">{state.error}</p>}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button type="submit" variant="destructive" disabled={pending}>
            {pending ? "Menyimpan..." : "Tolak Pengajuan"}
          </Button>
        </div>
      </form>
    </ReusableDialog>
  );
}