"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ReusableDialog } from "@/components/shared/reusable-dialog";
import { RegionSelector } from "@/features/master-data";
import { ProposalGps } from "./proposal-gps";
import { cn } from "@/lib/utils";
import type { ActionResponse } from "@/types/common";
import type { LandProposal } from "@/types";

interface ProposalFormProps {
  action: (prev: ActionResponse, formData: FormData) => Promise<ActionResponse>;
  defaultValues?: LandProposal;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProposalForm({
  action,
  defaultValues,
  open,
  onOpenChange,
}: ProposalFormProps) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    async (prev: ActionResponse, formData: FormData) => {
      const result = await action(prev, formData);
      if (result.success) {
        onOpenChange(false);
        router.refresh();
      }
      return result;
    },
    { success: false },
  );

  const [kabupatenId, setKabupatenId] = useState(defaultValues?.kabupaten_id ?? "");
  const [kecamatanId, setKecamatanId] = useState(defaultValues?.kecamatan_id ?? "");
  const [desaId, setDesaId] = useState(defaultValues?.desa_id ?? "");

  const isEditing = !!defaultValues;

  return (
    <ReusableDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? "Edit Pengajuan Lahan" : "Ajukan Lahan Baru"}
      description="Isi detail lahan yang akan ditanam (persetujuan QC/Admin)"
      className="sm:max-w-xl max-h-[90vh] overflow-y-auto"
    >
      <form action={formAction} className="space-y-4">
        {defaultValues && <input type="hidden" name="id" value={defaultValues.id} />}

        <RegionSelector
          kabupatenId={kabupatenId}
          kecamatanId={kecamatanId}
          desaId={desaId}
          onKabupatenChange={(id) => {
            setKabupatenId(id);
            setKecamatanId("");
            setDesaId("");
          }}
          onKecamatanChange={(id) => {
            setKecamatanId(id);
            setDesaId("");
          }}
          onDesaChange={(id) => setDesaId(id)}
        />

        <input type="hidden" name="kabupaten_id" value={kabupatenId} />
        <input type="hidden" name="kecamatan_id" value={kecamatanId} />
        <input type="hidden" name="desa_id" value={desaId} />

        {state.fieldErrors?.kabupaten_id && (
          <p className="text-sm text-destructive">{state.fieldErrors.kabupaten_id[0]}</p>
        )}

        <div className="grid gap-x-4 gap-y-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-1">
            <Label htmlFor="block_no">Block No</Label>
            <Input id="block_no" name="block_no" defaultValue={defaultValues?.block_no ?? ""} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="no_plot">No Plot</Label>
            <Input id="no_plot" name="no_plot" defaultValue={defaultValues?.no_plot ?? ""} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="member_name">Member Name</Label>
            <Input id="member_name" name="member_name" defaultValue={defaultValues?.member_name ?? ""} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="document_no">Document No</Label>
            <Input id="document_no" name="document_no" defaultValue={defaultValues?.document_no ?? ""} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="nis">NIS</Label>
            <Input id="nis" name="nis" defaultValue={defaultValues?.nis ?? ""} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="cgr">CGR</Label>
            <Input id="cgr" name="cgr" defaultValue={defaultValues?.cgr ?? ""} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="cgr_code">CGR Code</Label>
            <Input id="cgr_code" name="cgr_code" defaultValue={defaultValues?.cgr_code ?? ""} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="ph_tanah">PH Tanah</Label>
            <Input
              id="ph_tanah"
              name="ph_tanah"
              type="number"
              step="0.01"
              defaultValue={defaultValues?.ph_tanah ?? ""}
              className={cn(state.fieldErrors?.ph_tanah && "border-destructive")}
            />
            {state.fieldErrors?.ph_tanah && (
              <p className="text-sm text-destructive">{state.fieldErrors.ph_tanah[0]}</p>
            )}
          </div>
          <div className="space-y-1">
            <Label htmlFor="real_tanam_ha">Real Tanam (HA)</Label>
            <Input
              id="real_tanam_ha"
              name="real_tanam_ha"
              type="number"
              step="0.01"
              defaultValue={defaultValues?.real_tanam_ha ?? ""}
              className={cn(state.fieldErrors?.real_tanam_ha && "border-destructive")}
            />
            {state.fieldErrors?.real_tanam_ha && (
              <p className="text-sm text-destructive">{state.fieldErrors.real_tanam_ha[0]}</p>
            )}
          </div>
          <div className="space-y-1">
            <Label htmlFor="detaseling">Detaseling</Label>
            <Input id="detaseling" name="detaseling" defaultValue={defaultValues?.detaseling ?? ""} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="tgl_tanam">Tgl Tanam</Label>
            <Input id="tgl_tanam" name="tgl_tanam" type="date" defaultValue={defaultValues?.tgl_tanam ?? ""} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="rencana_panen">Rencana Panen</Label>
            <Input id="rencana_panen" name="rencana_panen" type="date" defaultValue={defaultValues?.rencana_panen ?? ""} />
          </div>
          <div className="sm:col-span-2 lg:col-span-3 space-y-1">
            <Label htmlFor="notes">Catatan</Label>
            <Textarea
              id="notes"
              name="notes"
              defaultValue={defaultValues?.notes ?? ""}
              placeholder="Catatan tambahan (opsional)"
              className="min-h-[2.5rem]"
            />
          </div>
        </div>

        <div className="border-t pt-4 mt-2">
          <ProposalGps
            defaultLatitude={defaultValues?.latitude}
            defaultLongitude={defaultValues?.longitude}
            defaultAccuracy={defaultValues?.accuracy}
          />
        </div>

        {state.error && <p className="text-sm text-destructive">{state.error}</p>}

        <div className="flex justify-end gap-2 pt-2 sticky bottom-0 bg-background pb-1">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? "Menyimpan..." : isEditing ? "Simpan" : "Ajukan"}
          </Button>
        </div>
      </form>
    </ReusableDialog>
  );
}