"use client";

import { useState } from "react";
import { Sprout, Calendar } from "lucide-react";
import { useFormState } from "react-dom";
import { Button } from "@/components/ui/button";
import { savePanenAction } from "../actions/panen-actions";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils/date";

interface PanenCardProps {
  scheduleId: string;
  tglPanen: string | null;
  panenKeterangan: string | null;
  editable: boolean;
}

export function PanenCard({ scheduleId, tglPanen, panenKeterangan, editable }: PanenCardProps) {
  const [state, formAction] = useFormState(savePanenAction, { success: false });
  const [editing, setEditing] = useState(false);
  const isHarvested = !!tglPanen;

  if (!editing) {
    return (
      <div className="rounded-xl border p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sprout className={cn("h-5 w-5", isHarvested ? "text-green-500" : "text-muted-foreground")} />
            <h3 className="text-sm font-semibold">Status Panen</h3>
          </div>
          {editable && (
            <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
              {isHarvested ? "Ubah" : "Isi"}
            </Button>
          )}
        </div>
        {isHarvested ? (
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="font-medium text-green-600 dark:text-green-400">Sudah Panen</span>
              <span className="text-muted-foreground">{formatDate(tglPanen)}</span>
            </div>
            {panenKeterangan && (
              <p className="text-xs text-muted-foreground ml-5.5">{panenKeterangan}</p>
            )}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">Belum ada data panen</p>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-xl border p-5 space-y-3">
      <div className="flex items-center gap-2">
        <Sprout className="h-5 w-5 text-green-500" />
        <h3 className="text-sm font-semibold">Data Panen</h3>
      </div>
      <form action={formAction} className="space-y-3">
        <input type="hidden" name="schedule_id" value={scheduleId} />
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Tanggal Panen</label>
          <input
            type="date"
            name="tgl_panen"
            defaultValue={tglPanen ?? ""}
            className="h-10 rounded-lg border border-input bg-background px-3 py-2 text-sm w-full"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Keterangan</label>
          <textarea
            name="panen_keterangan"
            defaultValue={panenKeterangan ?? ""}
            rows={2}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm resize-none"
          />
        </div>
        {state?.error && (
          <p className="text-xs text-red-500">{state.error}</p>
        )}
        <div className="flex gap-2">
          <Button type="submit" size="sm">Simpan</Button>
          <Button type="button" variant="outline" size="sm" onClick={() => setEditing(false)}>
            Batal
          </Button>
        </div>
      </form>
    </div>
  );
}
