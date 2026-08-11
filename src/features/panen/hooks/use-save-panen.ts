"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { savePanenAction } from "../actions/panen-actions";
import { queuePanenSave } from "@/features/visits/services/visit-client";
import { useSync } from "@/lib/offline/sync-context";

export interface SavePanenInput {
  scheduleId: string;
  tgl_panen?: string | null;
  panen_keterangan?: string | null;
}

/**
 * Menyimpan data panen. Online: server action; luring: antrean outbox
 * (produksi tanpa auto-complete; QC/admin menetapkan completed).
 */
export function useSavePanen() {
  const queryClient = useQueryClient();
  const { online } = useSync();

  return useMutation({
    mutationFn: async (data: SavePanenInput): Promise<void> => {
      if (!online) {
        await queuePanenSave({
          scheduleId: data.scheduleId,
          tgl_panen: data.tgl_panen,
          panen_keterangan: data.panen_keterangan,
        });
        toast.success("Data panen tersimpan (luring) — akan disinkronkan");
        return;
      }
      const fd = new FormData();
      fd.set("schedule_id", data.scheduleId);
      if (data.tgl_panen) fd.set("tgl_panen", data.tgl_panen);
      if (data.panen_keterangan) fd.set("panen_keterangan", data.panen_keterangan);
      const result = await savePanenAction({ success: false }, fd);
      if (!result.success) throw new Error(result.error);
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ["visit", vars.scheduleId] });
      queryClient.invalidateQueries({ queryKey: ["visit-timeline", vars.scheduleId] });
      queryClient.invalidateQueries({ queryKey: ["schedules"] });
      queryClient.invalidateQueries({ queryKey: ["schedule"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["calendar"] });
      toast.success("Data panen berhasil disimpan");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
