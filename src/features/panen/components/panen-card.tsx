"use client";

import { useState } from "react";
import { Sprout, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSavePanen } from "../hooks/use-save-panen";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils/date";

interface PanenCardProps {
  scheduleId: string;
  tglPanen: string | null;
  panenKeterangan: string | null;
  editable: boolean;
}

export function PanenCard({ scheduleId, tglPanen, panenKeterangan, editable }: PanenCardProps) {
  const [editing, setEditing] = useState(false);
  const savePanen = useSavePanen();
  const isHarvested = !!tglPanen;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    void savePanen.mutateAsync({
      scheduleId,
      tgl_panen: (fd.get("tgl_panen") as string) || null,
      panen_keterangan: (fd.get("panen_keterangan") as string) || null,
    });
    setEditing(false);
  }

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
      <form onSubmit={handleSubmit} className="space-y-3">
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
        <div className="flex gap-2">
          <Button type="submit" size="sm" disabled={savePanen.isPending}>
            {savePanen.isPending ? "Menyimpan..." : "Simpan"}
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => setEditing(false)}>
            Batal
          </Button>
        </div>
      </form>
    </div>
  );
}
