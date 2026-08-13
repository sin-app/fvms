"use client";

import Link from "next/link";
import { MapPin, CalendarCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ReusableDialog } from "@/components/shared/reusable-dialog";
import { ProposalPhotos } from "./proposal-photos";
import { formatDate } from "@/lib/utils/date";
import type { LandProposal, LandProposalStatus } from "@/types";

const STATUS_BADGE: Record<LandProposalStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Menunggu", variant: "secondary" },
  approved: { label: "Disetujui", variant: "default" },
  rejected: { label: "Ditolak", variant: "destructive" },
  cancelled: { label: "Dibatalkan", variant: "outline" },
};

interface ProposalDetailDialogProps {
  proposal: LandProposal;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProposalDetailDialog({ proposal, open, onOpenChange }: ProposalDetailDialogProps) {
  const badge = STATUS_BADGE[proposal.status];
  const location = [proposal.kabupaten?.name, proposal.kecamatan?.name, proposal.desa?.name]
    .filter(Boolean)
    .join(" → ");

  const rows: { label: string; value?: string | null }[] = [
    { label: "Block No", value: proposal.block_no },
    { label: "No Plot", value: proposal.no_plot },
    { label: "Member Name", value: proposal.member_name },
    { label: "Document No", value: proposal.document_no },
    { label: "NIS", value: proposal.nis },
    { label: "CGR", value: proposal.cgr },
    { label: "CGR Code", value: proposal.cgr_code },
    { label: "PH Tanah", value: proposal.ph_tanah != null ? String(proposal.ph_tanah) : null },
    { label: "Real Tanam (HA)", value: proposal.real_tanam_ha != null ? String(proposal.real_tanam_ha) : null },
    { label: "Detaseling", value: proposal.detaseling },
    { label: "Tgl Tanam", value: proposal.tgl_tanam ? formatDate(proposal.tgl_tanam) : null },
    { label: "Rencana Panen", value: proposal.rencana_panen ? formatDate(proposal.rencana_panen) : null },
  ];

  return (
    <ReusableDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Detail Pengajuan"
      description={`Diajukan ${formatDate(proposal.created_at)} oleh ${proposal.proposed_by_user?.name ?? "—"}`}
      className="sm:max-w-xl max-h-[90vh] overflow-y-auto"
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={badge.variant}>{badge.label}</Badge>
          {location && <span className="text-sm text-muted-foreground">{location}</span>}
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-3">
          {rows.map((r) =>
            r.value ? (
              <div key={r.label} className="min-w-0">
                <p className="text-xs text-muted-foreground">{r.label}</p>
                <p className="truncate">{r.value}</p>
              </div>
            ) : null,
          )}
        </div>

        {proposal.latitude != null && proposal.longitude != null && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-green-50 border border-green-200">
            <MapPin className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
            <div className="text-sm text-green-800">
              <p>
                {proposal.latitude.toFixed(6)}, {proposal.longitude.toFixed(6)}
              </p>
              {proposal.accuracy != null && (
                <p className="text-green-600 text-xs mt-0.5">
                  Akurasi: ±{proposal.accuracy.toFixed(0)}m
                </p>
              )}
            </div>
          </div>
        )}

        {proposal.notes && (
          <div>
            <p className="text-xs text-muted-foreground mb-1">Catatan</p>
            <p className="text-sm">{proposal.notes}</p>
          </div>
        )}

        {proposal.review_note && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200">
            <p className="text-xs text-red-500 mb-1">Catatan penolakan</p>
            <p className="text-sm text-red-800">{proposal.review_note}</p>
          </div>
        )}

        {proposal.status === "approved" && proposal.created_schedule_id && (
          <Link
            href={`/visits/${proposal.created_schedule_id}`}
            className="inline-flex items-center gap-1.5 text-sm text-brand hover:underline"
          >
            <CalendarCheck className="h-4 w-4" />
            Lihat jadwal hasil pengajuan (tanggal kunjungan{" "}
            {proposal.created_schedule?.visit_date
              ? formatDate(proposal.created_schedule.visit_date)
              : "—"}
            )
          </Link>
        )}

        {proposal.photos && proposal.photos.length > 0 && (
          <div className="border-t pt-3">
            <ProposalPhotos proposalId={proposal.id} photos={proposal.photos} />
          </div>
        )}
      </div>
    </ReusableDialog>
  );
}