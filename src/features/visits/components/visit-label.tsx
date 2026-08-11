"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateLabelAction } from "@/features/schedules/actions/schedule-actions";
import { queueScheduleUpdate } from "@/features/visits/services/visit-client";
import { useSync } from "@/lib/offline/sync-context";
import { toast } from "sonner";

interface VisitLabelProps {
  scheduleId: string;
  currentLabel: string | null;
  editable?: boolean;
}

const LABEL_OPTIONS = [
  { value: "hijau", label: "Hijau", dot: "bg-green-500" },
  { value: "kuning", label: "Kuning", dot: "bg-yellow-400" },
  { value: "merah", label: "Merah", dot: "bg-red-500" },
];

export function VisitLabel({ scheduleId, currentLabel, editable }: VisitLabelProps) {
  const [showOptions, setShowOptions] = useState(false);
  const queryClient = useQueryClient();
  const { online } = useSync();

  const mutation = useMutation({
    mutationFn: async (label: string | null) => {
      if (!online) {
        await queueScheduleUpdate({ id: scheduleId, label: label || null });
        toast.success("Label tersimpan (luring) — akan disinkronkan");
        return;
      }
      const fd = new FormData();
      fd.set("id", scheduleId);
      fd.set("label", label ?? "");
      const result = await updateLabelAction({ success: false }, fd);
      if (!result.success) throw new Error(result.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["visit", scheduleId] });
      queryClient.invalidateQueries({ queryKey: ["schedule"] });
      queryClient.invalidateQueries({ queryKey: ["schedules"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Label berhasil diupdate");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const current = LABEL_OPTIONS.find((o) => o.value === currentLabel);

  if (!editable) {
    return current ? (
      <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full ${
        current.dot === "bg-green-500" ? "bg-green-100 text-green-800" :
        current.dot === "bg-yellow-400" ? "bg-yellow-100 text-yellow-800" :
        "bg-red-100 text-red-800"
      }`}>
        <span className={`h-2 w-2 rounded-full ${current.dot}`} />
        {current.label}
      </span>
    ) : null;
  }

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowOptions(!showOptions)}
        className={
          current
            ? current.dot === "bg-green-500"
              ? "text-green-700 bg-green-50 border-green-200"
              : current.dot === "bg-yellow-400"
                ? "text-yellow-700 bg-yellow-50 border-yellow-200"
                : "text-red-700 bg-red-50 border-red-200"
            : ""
        }
      >
        {current ? (
          <>
            <span className={`h-2 w-2 rounded-full ${current.dot}`} />
            {current.label}
          </>
        ) : (
          "Label"
        )}
      </Button>

      {showOptions && (
        <div className="absolute top-full mt-1 left-0 bg-popover border rounded-lg shadow-lg z-50 min-w-[150px]">
          <div className="p-1">
            {current && (
              <button
                onClick={() => { mutation.mutate(null); setShowOptions(false); }}
                disabled={mutation.isPending}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-muted transition-colors disabled:opacity-50"
              >
                Hapus Label
              </button>
            )}
            {LABEL_OPTIONS.filter((o) => o.value !== currentLabel).map((opt) => (
              <button
                key={opt.value}
                onClick={() => { mutation.mutate(opt.value); setShowOptions(false); }}
                disabled={mutation.isPending}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-muted transition-colors disabled:opacity-50"
              >
                <span className={`h-2 w-2 rounded-full ${opt.dot}`} />
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
