"use client";

import { STATUS_VALUES } from "@/lib/constants/status";
import { useActionState, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, XCircle, CheckCircle2, UserCheck, Eye, MapPin } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { PageHeader } from "@/components/shared/page-header";
import { formatDate } from "@/lib/utils/date";
import { useSync } from "@/lib/offline/sync-context";
import { cancelLandProposalOffline } from "../services/land-proposal-client";
import type { ActionResponse } from "@/types/common";
import type { AuthContext } from "@/lib/auth/authorization";
import type { LandProposal, LandProposalStatus } from "@/types";
import { ProposalForm } from "./proposal-form";
import { ProposalPhotos } from "./proposal-photos";
import { RejectDialog } from "./reject-dialog";
import { AssignPetugasDialog } from "./assign-petugas-dialog";
import { ProposalDetailDialog } from "./proposal-detail-dialog";
import { ProposalFilters, type RegionOption } from "./proposal-filters";
import {
  createLandProposalAction,
  updateLandProposalAction,
  cancelLandProposalAction,
  approveLandProposalAction,
} from "../actions/land-proposal-actions";

const STATUS_BADGE: Record<LandProposalStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Menunggu", variant: "secondary" },
  approved: { label: "Disetujui", variant: "default" },
  rejected: { label: "Ditolak", variant: "destructive" },
  cancelled: { label: "Dibatalkan", variant: "outline" },
};

interface ProposalListProps {
  proposals: LandProposal[];
  currentUser: AuthContext;
}

export function ProposalList({ proposals, currentUser }: ProposalListProps) {
  const isReviewer = currentUser.role === "admin" || currentUser.role === "qc";
  const [showCreate, setShowCreate] = useState(false);

  // State filter (client-side, karena seluruh proposal scope sudah di-load).
  const [status, setStatus] = useState("");
  const [kabupatenId, setKabupatenId] = useState("");
  const [kecamatanId, setKecamatanId] = useState("");
  const [desaId, setDesaId] = useState("");
  const [search, setSearch] = useState("");
  const showOnlyMine = isReviewer;
  const [onlyMine, setOnlyMine] = useState(false);

  // Opsi wilayah diturunkan dari data yang sudah dimuat (otomatis scoped).
  const { kabupatenOptions, kecamatanOptions, desaOptions } = useMemo(() => {
    const kab = new Map<string, RegionOption>();
    const kec = new Map<string, RegionOption>();
    const des = new Map<string, RegionOption>();
    for (const p of proposals) {
      if (p.kabupaten?.id && p.kabupaten?.name) kab.set(p.kabupaten.id, { id: p.kabupaten.id, name: p.kabupaten.name });
      if (p.kecamatan?.id && p.kecamatan?.name) kec.set(p.kecamatan.id, { id: p.kecamatan.id, name: p.kecamatan.name });
      if (p.desa?.id && p.desa?.name) des.set(p.desa.id, { id: p.desa.id, name: p.desa.name });
    }
    const sort = (m: Map<string, RegionOption>) =>
      [...m.values()].sort((a, b) => a.name.localeCompare(b.name, "id"));
    return {
      kabupatenOptions: sort(kab),
      kecamatanOptions: sort(kec),
      desaOptions: sort(des),
    };
  }, [proposals]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return proposals.filter((p) => {
      if (status && p.status !== status) return false;
      if (kabupatenId && p.kabupaten_id !== kabupatenId) return false;
      if (kecamatanId && p.kecamatan_id !== kecamatanId) return false;
      if (desaId && p.desa_id !== desaId) return false;
      if (showOnlyMine && onlyMine && p.proposed_by !== currentUser.userId) return false;
      if (q) {
        const hay = [
          p.member_name,
          p.block_no,
          p.no_plot,
          p.document_no,
          p.nis,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [proposals, status, kabupatenId, kecamatanId, desaId, search, showOnlyMine, onlyMine, currentUser.userId]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Pengajuan Lahan"
        description={isReviewer ? "Tinjau & setujui pengajuan lahan di wilayah Anda" : "Ajukan lahan baru untuk tanaman baru"}
        actions={
          !isReviewer ? (
            <Button onClick={() => setShowCreate(true)}>
              <Plus className="mr-1 h-4 w-4" /> Ajukan Lahan Baru
            </Button>
          ) : undefined
        }
      />

      {showCreate && (
        <ProposalForm
          action={createLandProposalAction}
          open={showCreate}
          onOpenChange={setShowCreate}
        />
      )}

      <ProposalFilters
        status={status}
        onStatusChange={setStatus}
        kabupatenId={kabupatenId}
        kecamatanId={kecamatanId}
        desaId={desaId}
        onKabupatenChange={(v) => {
          setKabupatenId(v);
          setKecamatanId("");
          setDesaId("");
        }}
        onKecamatanChange={(v) => {
          setKecamatanId(v);
          setDesaId("");
        }}
        onDesaChange={setDesaId}
        kabupatenOptions={kabupatenOptions}
        kecamatanOptions={kecamatanOptions}
        desaOptions={desaOptions}
        search={search}
        onSearchChange={setSearch}
        showOnlyMine={showOnlyMine}
        onlyMine={onlyMine}
        onOnlyMineChange={setOnlyMine}
      />

      {proposals.length === 0 ? (
        <EmptyState
          title="Belum ada pengajuan"
          description={isReviewer ? "Pengajuan lahan dari produksi akan muncul di sini." : "Ajukan lahan baru untuk mulai."}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="Tidak ada yang cocok"
          description="Tidak ada pengajuan yang sesuai dengan filter yang dipilih."
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((p) => (
            <ProposalCard key={p.id} proposal={p} currentUser={currentUser} />
          ))}
        </div>
      )}
    </div>
  );
}

function ProposalCard({ proposal, currentUser }: { proposal: LandProposal; currentUser: AuthContext }) {
  const isOwner = proposal.proposed_by === currentUser.userId;
  const isReviewer = currentUser.role === "admin" || currentUser.role === "qc";
  const isAdmin = currentUser.role === "admin";
  const { online } = useSync();

  const canEdit = isOwner
    ? proposal.status === "pending"
    : isAdmin
      ? proposal.status === STATUS_VALUES.pending || proposal.status === "rejected"
      : false;

  const photoEditable = isAdmin || (isOwner && proposal.status === STATUS_VALUES.pending);

  const [showEdit, setShowEdit] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [showAssign, setShowAssign] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [cancelTarget, setCancelTarget] = useState(false);

  const badge = STATUS_BADGE[proposal.status];
  const title =
    proposal.member_name ?? proposal.document_no ?? [proposal.block_no, proposal.no_plot].filter(Boolean).join("/") ?? "Lahan baru";
  const location = [proposal.kabupaten?.name, proposal.kecamatan?.name, proposal.desa?.name]
    .filter(Boolean)
    .join(" · ");

  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium truncate">{title}</span>
            <Badge variant={badge.variant}>{badge.label}</Badge>
          </div>
          {location && <p className="text-sm text-muted-foreground">{location}</p>}
          <p className="text-xs text-muted-foreground">
            Diajukan {formatDate(proposal.created_at)} oleh {proposal.proposed_by_user?.name ?? "—"}
            {proposal.reviewed_by_user?.name ? ` · Direview ${proposal.reviewed_by_user.name}` : ""}
          </p>
          {proposal.latitude != null && proposal.longitude != null && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {proposal.latitude.toFixed(5)}, {proposal.longitude.toFixed(5)}
              {proposal.accuracy != null ? ` (±${proposal.accuracy.toFixed(0)}m)` : ""}
            </p>
          )}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm sm:grid-cols-3 lg:grid-cols-4">
        <Info label="Block" value={proposal.block_no} />
        <Info label="No Plot" value={proposal.no_plot} />
        <Info label="NIS" value={proposal.nis} />
        <Info label="CGR" value={proposal.cgr} />
        <Info label="Real Tanam" value={proposal.real_tanam_ha != null ? `${proposal.real_tanam_ha} HA` : undefined} />
        <Info label="PH Tanah" value={proposal.ph_tanah != null ? String(proposal.ph_tanah) : undefined} />
        <Info label="Tgl Tanam" value={proposal.tgl_tanam ? formatDate(proposal.tgl_tanam) : undefined} />
        <Info label="Rencana Panen" value={proposal.rencana_panen ? formatDate(proposal.rencana_panen) : undefined} />
      </div>

      {proposal.notes && <p className="mt-2 text-sm text-muted-foreground">{proposal.notes}</p>}
      {proposal.review_note && (
        <p className="mt-2 text-sm text-destructive">Catatan penolakan: {proposal.review_note}</p>
      )}

      {(proposal.photos && proposal.photos.length > 0) || photoEditable ? (
        <div className="mt-3 border-t pt-3">
          <ProposalPhotos
            proposalId={proposal.id}
            photos={proposal.photos ?? []}
            editable={photoEditable}
          />
        </div>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={() => setShowDetail(true)}>
          <Eye className="mr-1 h-4 w-4" /> Detail
        </Button>

        {isReviewer && proposal.status === STATUS_VALUES.pending && (
          <>
            <ApproveButton proposal={proposal} />
            <Button variant="outline" size="sm" onClick={() => setShowReject(true)}>
              <XCircle className="mr-1 h-4 w-4" /> Tolak
            </Button>
          </>
        )}

        {isReviewer && proposal.status === "approved" && proposal.created_schedule_id && (
          <Button size="sm" onClick={() => setShowAssign(true)}>
            <UserCheck className="mr-1 h-4 w-4" /> Assign Petugas
          </Button>
        )}

        {canEdit && (
          <Button variant="outline" size="sm" onClick={() => setShowEdit(true)}>
            <Pencil className="mr-1 h-4 w-4" /> Edit
          </Button>
        )}

        {isOwner && proposal.status === STATUS_VALUES.pending && (
          <Button variant="ghost" size="sm" onClick={() => setCancelTarget(true)}>
            <XCircle className="mr-1 h-4 w-4" /> Batalkan
          </Button>
        )}
      </div>

      {showEdit && (
        <ProposalForm
          action={updateLandProposalAction}
          defaultValues={proposal}
          open={showEdit}
          onOpenChange={setShowEdit}
        />
      )}
      {showReject && (
        <RejectDialog proposal={proposal} open={showReject} onOpenChange={setShowReject} />
      )}
      {showAssign && (
        <AssignPetugasDialog proposal={proposal} open={showAssign} onOpenChange={setShowAssign} />
      )}
      {showDetail && (
        <ProposalDetailDialog proposal={proposal} open={showDetail} onOpenChange={setShowDetail} />
      )}
      {cancelTarget && (
        <ConfirmDialog
          open={cancelTarget}
          onOpenChange={setCancelTarget}
          title="Batalkan Pengajuan"
          message="Yakin ingin membatalkan pengajuan lahan ini?"
          confirmLabel="Batalkan"
          variant="destructive"
          onConfirm={async () => {
            try {
              if (!online) {
                await cancelLandProposalOffline(proposal.id);
              } else {
                const formData = new FormData();
                formData.set("id", proposal.id);
                await cancelLandProposalAction({ success: false }, formData);
              }
            } catch {
              toast.error("Gagal membatalkan pengajuan");
              return;
            }
            setCancelTarget(false);
          }}
        />
      )}
    </Card>
  );
}

function Info({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="min-w-0">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="truncate">{value}</p>
    </div>
  );
}

function ApproveButton({ proposal }: { proposal: LandProposal }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    async (prev: ActionResponse, formData: FormData) => {
      const result = await approveLandProposalAction(prev, formData);
      if (result.success) router.refresh();
      return result;
    },
    { success: false },
  );

  return (
    <form action={formAction}>
      <input type="hidden" name="id" value={proposal.id} />
      <Button type="submit" size="sm" disabled={pending}>
        <CheckCircle2 className="mr-1 h-4 w-4" /> {pending ? "Menyetujui..." : "Setujui"}
      </Button>
      {state.error && <p className="mt-1 text-xs text-destructive">{state.error}</p>}
    </form>
  );
}