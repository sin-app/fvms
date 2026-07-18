"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, Trash2, CheckCheck, XCircle } from "lucide-react";
import { useSchedules, useDeleteSchedule } from "../hooks/use-schedules";
import { LoadingState } from "@/components/shared/loading-state";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { formatDateShort } from "@/lib/utils/date";
import { useAuth } from "@/features/auth/components/auth-context";
import { useBulkAction } from "../hooks/use-schedules";
import type { Schedule } from "@/types";
import type { ScheduleFilters } from "../types";

interface ScheduleTableProps {
  filters: ScheduleFilters;
}

export function ScheduleTable({ filters }: ScheduleTableProps) {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, refetch } = useSchedules({ ...filters, page });
  const deleteSchedule = useDeleteSchedule();
  const bulkAction = useBulkAction();
  const { user } = useAuth();
  const [deleting, setDeleting] = useState<Schedule | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkDelete, setShowBulkDelete] = useState(false);

  const isAdmin = user?.role === "admin";

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (!data?.data.length) return;
    if (selectedIds.size === data.data.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(data.data.map((s) => s.id)));
    }
  }

  async function handleBulk(action: string) {
    await bulkAction.mutateAsync({ ids: Array.from(selectedIds), action });
    setSelectedIds(new Set());
    setShowBulkDelete(false);
  }

  async function handleDelete() {
    if (!deleting) return;
    await deleteSchedule.mutateAsync(deleting.id);
    setDeleting(null);
  }

  if (isLoading) return <LoadingState variant="table" />;
  if (isError) return <ErrorState onRetry={refetch} />;

  if (!data?.data.length) {
    return (
      <EmptyState
        title="Tidak ada jadwal"
        description="Belum ada jadwal kunjungan. Import dari Excel atau buat jadwal baru."
        action={{ label: "Import Excel", onClick: () => window.location.href = "/import" }}
      />
    );
  }

  const allSelected = data.data.length > 0 && selectedIds.size === data.data.length;

  return (
    <div>
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-2 mb-3 p-3 rounded-lg border bg-muted/30">
          <span className="text-sm text-muted-foreground mr-auto">
            {selectedIds.size} dipilih
          </span>
          {isAdmin && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulk("approve")}
                disabled={bulkAction.isPending}
              >
                <CheckCheck className="h-4 w-4 mr-1" />
                Setujui
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulk("cancel")}
                disabled={bulkAction.isPending}
              >
                <XCircle className="h-4 w-4 mr-1" />
                Batalkan
              </Button>
            </>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowBulkDelete(true)}
            disabled={bulkAction.isPending}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Hapus
          </Button>
        </div>
      )}

      <div className="rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="p-3 w-10">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={toggleSelectAll}
                    aria-label="Pilih semua"
                  />
                </th>
                <th className="text-left p-3 text-sm font-medium text-muted-foreground whitespace-nowrap">Tanggal</th>
                <th className="text-left p-3 text-sm font-medium text-muted-foreground whitespace-nowrap">Kabupaten</th>
                <th className="text-left p-3 text-sm font-medium text-muted-foreground whitespace-nowrap">Kecamatan</th>
                <th className="text-left p-3 text-sm font-medium text-muted-foreground whitespace-nowrap">Desa</th>
                <th className="text-left p-3 text-sm font-medium text-muted-foreground whitespace-nowrap">CGR</th>
                <th className="text-left p-3 text-sm font-medium text-muted-foreground whitespace-nowrap">Block/Plot</th>
                <th className="text-left p-3 text-sm font-medium text-muted-foreground whitespace-nowrap">Member</th>
                <th className="text-right p-3 text-sm font-medium text-muted-foreground whitespace-nowrap">Real Tanam (HA)</th>
                <th className="text-left p-3 text-sm font-medium text-muted-foreground whitespace-nowrap">Status</th>
                <th className="text-right p-3 text-sm font-medium text-muted-foreground whitespace-nowrap">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {data.data.map((schedule) => (
                <tr
                  key={schedule.id}
                  className="border-b last:border-0 hover:bg-muted/50 transition-colors"
                >
                  <td className="p-3">
                    <Checkbox
                      checked={selectedIds.has(schedule.id)}
                      onCheckedChange={() => toggleSelect(schedule.id)}
                      aria-label={`Pilih ${(schedule as unknown as { desa?: { name: string } }).desa?.name ?? schedule.id}`}
                    />
                  </td>
                  <td className="p-3 text-sm whitespace-nowrap">
                    {formatDateShort(schedule.visit_date)}
                  </td>
                  <td className="p-3 text-sm">
                    {(schedule as unknown as { kabupaten?: { name: string } }).kabupaten?.name ?? "—"}
                  </td>
                  <td className="p-3 text-sm">
                    {(schedule as unknown as { kecamatan?: { name: string } }).kecamatan?.name ?? "—"}
                  </td>
                  <td className="p-3 text-sm">
                    {(schedule as unknown as { desa?: { name: string } }).desa?.name ?? "—"}
                  </td>
                  <td className="p-3 text-sm whitespace-nowrap">
                    {schedule.cgr ?? "—"}
                    {schedule.cgr_code ? <span className="text-muted-foreground text-xs block">{schedule.cgr_code}</span> : null}
                  </td>
                  <td className="p-3 text-sm whitespace-nowrap">
                    {schedule.block_no ?? "—"}
                    {schedule.no_plot ? <span className="text-muted-foreground text-xs block">Plot: {schedule.no_plot}</span> : null}
                  </td>
                  <td className="p-3 text-sm">
                    {schedule.member_name ?? "—"}
                  </td>
                  <td className="p-3 text-sm text-right whitespace-nowrap">
                    {schedule.real_tanam_ha ?? "—"}
                  </td>
                  <td className="p-3">
                    <StatusBadge status={schedule.status} size="sm" />
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/visits/${schedule.id}`}
                        className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-muted transition-colors"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleting(schedule)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            Sebelumnya
          </Button>
          <span className="text-sm text-muted-foreground">
            {page} / {data.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= data.totalPages}
            onClick={() => setPage(page + 1)}
          >
            Selanjutnya
          </Button>
        </div>
      )}

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Hapus Jadwal?"
        message="Yakin ingin menghapus jadwal ini?"
        confirmLabel="Hapus"
        variant="destructive"
        onConfirm={handleDelete}
        loading={deleteSchedule.isPending}
      />

      <ConfirmDialog
        open={showBulkDelete}
        onOpenChange={setShowBulkDelete}
        title="Hapus Jadwal Terpilih?"
        message={`Yakin ingin menghapus ${selectedIds.size} jadwal?`}
        confirmLabel="Hapus Semua"
        variant="destructive"
        onConfirm={() => handleBulk("delete")}
        loading={bulkAction.isPending}
      />
    </div>
  );
}
