"use client";

import { useState, Fragment } from "react";
import Link from "next/link";
import { Eye, Pencil, Trash2, CheckCheck, XCircle, CalendarPlus, CalendarMinus, Loader2, Sprout } from "lucide-react";
import { useSchedules, useDeleteSchedule, useShiftScheduleDate } from "../hooks/use-schedules";
import { LoadingState } from "@/components/shared/loading-state";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { formatDateDay, isTodayDate } from "@/lib/utils/date";
import { useAuth } from "@/features/auth/components/auth-context";
import { useBulkAction } from "../hooks/use-schedules";
import { ScheduleForm } from "./schedule-form";
import { updateScheduleAction } from "../actions/schedule-actions";
import type { Schedule } from "@/types";
import type { ScheduleFilters } from "../types";

interface ScheduleTableProps {
  filters: ScheduleFilters;
}

export function ScheduleTable({ filters }: ScheduleTableProps) {
  const [page, setPage] = useState(1);
  const { data, isLoading, isFetching, isError, refetch } = useSchedules({ ...filters, page });
  const deleteSchedule = useDeleteSchedule();
  const bulkAction = useBulkAction();
  const { user } = useAuth();
  const [deleting, setDeleting] = useState<Schedule | null>(null);
  const [editing, setEditing] = useState<Schedule | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkDelete, setShowBulkDelete] = useState(false);
  const [optimisticDates, setOptimisticDates] = useState<Record<string, string>>({});

  const isAdmin = user?.role === "admin";
  const canDelete = user?.role === "admin";
  const canBulkShift = user?.role === "admin" || user?.role === "qc";
  const shiftSchedule = useShiftScheduleDate();

  function canShift(schedule: Schedule) {
    if (user?.role === "admin" || user?.role === "qc") return true;
    return schedule.user_id === user?.id;
  }

  function handleShiftInstant(schedule: Schedule, days: number) {
    const base = optimisticDates[schedule.id] ?? schedule.visit_date;
    const next = new Date(base + "T00:00:00");
    next.setDate(next.getDate() + days);
    const nextStr = next.toISOString().split("T")[0];
    setOptimisticDates((prev) => ({ ...prev, [schedule.id]: nextStr }));
    shiftSchedule.mutate({ id: schedule.id, days }, {
      onError: () =>
        setOptimisticDates((prev) => {
          const { [schedule.id]: _removed, ...rest } = prev;
          return rest;
        }),
    });
  }

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
  if (isError && !data) return <ErrorState onRetry={refetch} />;

  if (!data?.data.length) {
    return (
      <EmptyState
        title="Tidak ada jadwal"
        description="Belum ada jadwal kunjungan. Import dari Excel atau buat jadwal baru."
        action={{ label: "Import Excel", href: "/import" }}
      />
    );
  }

  const allSelected = data.data.length > 0 && selectedIds.size === data.data.length;

  return (
    <div>
      {isFetching && (
        <div className="flex items-center justify-center gap-2 mb-3 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Memuat ulang...
        </div>
      )}
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
                onClick={() => handleBulk("on_the_way")}
                disabled={bulkAction.isPending}
              >
                🚗 On The Way
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulk("in_progress")}
                disabled={bulkAction.isPending}
              >
                📋 In Progress
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
          {canBulkShift && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulk("shift_forward")}
                disabled={bulkAction.isPending}
              >
                <CalendarPlus className="h-4 w-4 mr-1" />
                +1 Hari
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulk("shift_backward")}
                disabled={bulkAction.isPending}
              >
                <CalendarMinus className="h-4 w-4 mr-1" />
                -1 Hari
              </Button>
            </>
          )}
          {canDelete && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowBulkDelete(true)}
              disabled={bulkAction.isPending}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Hapus
            </Button>
          )}
        </div>
      )}

      <div className="rounded-xl border overflow-hidden">
        <div className="overflow-x-auto min-w-0">
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
                <th className="text-left p-3 text-sm font-medium text-muted-foreground whitespace-nowrap">Kabupaten</th>
                <th className="text-left p-3 text-sm font-medium text-muted-foreground whitespace-nowrap">Kecamatan</th>
                <th className="text-left p-3 text-sm font-medium text-muted-foreground whitespace-nowrap">Desa</th>
                <th className="text-left p-3 text-sm font-medium text-muted-foreground whitespace-nowrap">Petugas</th>
                <th className="text-left p-3 text-sm font-medium text-muted-foreground whitespace-nowrap">CGR</th>
                <th className="text-left p-3 text-sm font-medium text-muted-foreground whitespace-nowrap">Block/Plot</th>
                <th className="text-left p-3 text-sm font-medium text-muted-foreground whitespace-nowrap">Member</th>
                <th className="text-left p-3 text-sm font-medium text-muted-foreground whitespace-nowrap">Doc No</th>
                <th className="text-left p-3 text-sm font-medium text-muted-foreground whitespace-nowrap">NIS</th>
                <th className="text-right p-3 text-sm font-medium text-muted-foreground whitespace-nowrap">PH Tanah</th>
                <th className="text-right p-3 text-sm font-medium text-muted-foreground whitespace-nowrap">Real Tanam (HA)</th>
                <th className="text-left p-3 text-sm font-medium text-muted-foreground whitespace-nowrap">Panen</th>
                <th className="text-left p-3 text-sm font-medium text-muted-foreground whitespace-nowrap">Status</th>
                <th className="text-right p-3 text-sm font-medium text-muted-foreground whitespace-nowrap">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {data.data.map((schedule, idx) => {
                const displayDate = optimisticDates[schedule.id] ?? schedule.visit_date;
                const prev = data.data[idx - 1];
                const showGroup = !prev || (optimisticDates[prev.id] ?? prev.visit_date) !== displayDate;
                return (
                  <Fragment key={schedule.id}>
                    {showGroup && (
                      <tr className="bg-muted/70">
                          <td colSpan={15} className="p-2.5 px-3">
                          <div className="flex items-center gap-2 text-sm font-semibold">
                            {formatDateDay(displayDate)}
                            {isTodayDate(displayDate) && (
                              <span className="text-xs font-medium text-primary bg-primary/10 rounded-full px-2 py-0.5">
                                Hari ini
                              </span>
                            )}
                            <span className="text-xs font-normal text-muted-foreground">
                              ({data.data.filter((s) => (optimisticDates[s.id] ?? s.visit_date) === displayDate).length} jadwal)
                            </span>
                          </div>
                        </td>
                      </tr>
                    )}
                    <tr
                      className="border-b last:border-0 hover:bg-muted/50 transition-colors"
                    >
                      <td className="p-3">
                        <Checkbox
                          checked={selectedIds.has(schedule.id)}
                          onCheckedChange={() => toggleSelect(schedule.id)}
                          aria-label={`Pilih ${(schedule as unknown as { desa?: { name: string } }).desa?.name ?? schedule.id}`}
                        />
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
                        {schedule.users?.name ?? schedule.user?.name ?? "—"}
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
                      <td className="p-3 text-sm whitespace-nowrap">
                        {schedule.document_no ?? "—"}
                      </td>
                      <td className="p-3 text-sm whitespace-nowrap">
                        {schedule.nis ?? "—"}
                      </td>
                      <td className="p-3 text-sm text-right whitespace-nowrap">
                        {schedule.ph_tanah ?? "—"}
                      </td>
                      <td className="p-3 text-sm text-right whitespace-nowrap">
                        {schedule.real_tanam_ha ?? "—"}
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        {schedule.tgl_panen ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-950 rounded-full px-2 py-0.5">
                            <Sprout className="h-3 w-3" />
                            Panen
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
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
                          {canDelete && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setEditing(schedule)}
                              aria-label="Edit"
                              title="Edit"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          )}
                          {canDelete && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleting(schedule)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                          {canShift(schedule) && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleShiftInstant(schedule, 1)}
                              aria-label="Geser +1 hari"
                              title="Geser +1 hari"
                            >
                              <CalendarPlus className="h-4 w-4" />
                            </Button>
                          )}
                          {canShift(schedule) && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleShiftInstant(schedule, -1)}
                              aria-label="Kembalikan -1 hari"
                              title="Kembalikan -1 hari"
                            >
                              <CalendarMinus className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  </Fragment>
                );
              })}
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

      {editing && (
        <ScheduleForm
          action={updateScheduleAction}
          defaultValues={editing}
          open={!!editing}
          onOpenChange={(o) => { if (!o) setEditing(null); }}
        />
      )}
    </div>
  );
}
