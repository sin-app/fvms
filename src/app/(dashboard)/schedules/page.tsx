"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Plus, Calendar, FileDown } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { ScheduleTable, ScheduleForm, ScheduleFilters } from "@/features/schedules";
import { createScheduleAction } from "@/features/schedules/actions/schedule-actions";
import { useDebounce } from "@/hooks/use-debounce";
import { exportPdf } from "@/lib/export/pdf";
import { useAuth } from "@/features/auth/components/auth-context";
import { dateString } from "@/lib/utils/date";
import { addDays } from "date-fns";
import { LoadingState } from "@/components/shared/loading-state";
import {
  loadPersistedFilters,
  savePersistedFilters,
} from "@/features/schedules/services/filter-persist";

export default function SchedulesPage() {
  const queryClient = useQueryClient();
  const { user, isLoading } = useAuth();
  const isProduksi = user?.role === "produksi";
  const isAdmin = user?.role === "admin";
  const [showDeleted, setShowDeleted] = useState(false);
  const [memberName, setMemberName] = useState("");
  const [userId, setUserId] = useState("");
  const [blockNo, setBlockNo] = useState<string[]>([]);
  const [noPlot, setNoPlot] = useState("");
  const [nis, setNis] = useState("");
  const [documentNo, setDocumentNo] = useState("");
  const [status, setStatus] = useState("all");
  const [cgr, setCgr] = useState("");
  const [kabupatenId, setKabupatenId] = useState("");
  const [kecamatanId, setKecamatanId] = useState("");
  const [desaId, setDesaId] = useState("");
  const [dateRange, setDateRange] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [varietas, setVarietas] = useState("");
  const [panenStatus, setPanenStatus] = useState("all");
  const [label, setLabel] = useState("all");
  const [showCreate, setShowCreate] = useState(false);
  const [filtersReady, setFiltersReady] = useState(false);
  const restoredFor = useRef<string | null>(null);

  // Pulihkan filter tersimpan (sessionStorage per user) saat halaman dimuat
  // atau user login — agar filter "menetap" saat kembali dari halaman visit.
  useEffect(() => {
    if (!user?.id) return;
    if (restoredFor.current === user.id) return;
    restoredFor.current = user.id;
    const p = loadPersistedFilters(user.id);
    setMemberName(p.member_name ?? "");
    setUserId(p.user_id ?? "");
    setBlockNo(p.block_no ?? []);
    setNoPlot(p.no_plot ?? "");
    setNis(p.nis ?? "");
    setDocumentNo(p.document_no ?? "");
    setStatus(p.status ?? "all");
    setCgr(p.cgr ?? "");
    setKabupatenId(p.kabupaten_id ?? "");
    setKecamatanId(p.kecamatan_id ?? "");
    setDesaId(p.desa_id ?? "");
    setDateRange(p.date_range ?? "");
    setDateFrom(p.date_from ?? "");
    setDateTo(p.date_to ?? "");
    setVarietas(p.varietas ?? "");
    setPanenStatus(p.panen_status ?? "all");
    setLabel(p.label ?? "all");
    setFiltersReady(true);
  }, [user?.id]);

  // Terapkan cakupan yang sama persis dengan kartu dashboard ("Lihat semua")
  // → ?range=today|upcoming + ?kabupaten=&kecamatan=, dan reset filter lain
  // agar daftar menampilkan data real yang identik dengan dashboard.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const range = params.get("range");
    if (range !== "today" && range !== "upcoming") return;

    setMemberName("");
    setUserId("");
    setBlockNo([]);
    setNoPlot("");
    setNis("");
    setDocumentNo("");
    setStatus("all");
    setCgr("");
    setDesaId("");
    setVarietas("");
    setPanenStatus("all");
    setLabel("all");
    setKabupatenId(params.get("kabupaten") ?? "");
    setKecamatanId(params.get("kecamatan") ?? "");

    if (range === "today") {
      const t = dateString(new Date());
      setDateRange("today");
      setDateFrom(t);
      setDateTo(t);
    } else {
      const tmr = dateString(addDays(new Date(), 1));
      setDateRange("custom");
      setDateFrom(tmr);
      setDateTo("");
    }
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (!user?.id) return;
    savePersistedFilters(user.id, {
      member_name: memberName,
      user_id: userId,
      block_no: blockNo,
      no_plot: noPlot,
      nis,
      document_no: documentNo,
      status,
      cgr,
      kabupaten_id: kabupatenId,
      kecamatan_id: kecamatanId,
      desa_id: desaId,
      date_range: dateRange,
      date_from: dateFrom,
      date_to: dateTo,
      varietas,
      panen_status: panenStatus,
      label,
    });
  }, [user?.id, memberName, userId, blockNo, noPlot, nis, documentNo, status, cgr, kabupatenId, kecamatanId, desaId, dateRange, dateFrom, dateTo, varietas, panenStatus, label]);

  const debouncedMemberName = useDebounce(memberName, 450);
  const debouncedVarietas = useDebounce(varietas, 450);

  async function handleDownloadPdf() {
    const { fetchScheduleRows } = await import("@/features/schedules/api/schedule-client");
    const schedules = await fetchScheduleRows(filters);
    const rows = (schedules ?? []).map((s) => ({
      date: s.visit_date,
      petugas: s.users?.name ?? "—",
      kabupaten: s.kabupaten?.name ?? "—",
      kecamatan: s.kecamatan?.name ?? "—",
      desa: s.desa?.name ?? "—",
      cgr: s.cgr ?? "—",
      block_plot: [s.block_no, s.no_plot].filter(Boolean).join("/") || "—",
      member: s.member_name ?? "—",
      doc_no: s.document_no ?? "—",
      nis: s.nis ?? "—",
      ph_tanah: s.ph_tanah?.toString() ?? "—",
      real_tanam: s.real_tanam_ha?.toString() ?? "—",
      gagal_tanam: s.gagal_tanam?.toString() ?? "—",
      label: s.label ?? "—",
      sisa_lahan: s.sisa_di_lahan_ha?.toString() ?? "—",
      panen: s.tgl_panen ?? s.real_panen ?? (s.rencana_panen ? "Renc: "+s.rencana_panen : "—"),
      status: s.status,
    }));
    if (!rows.length) return;
    const columns = [
      { header: "Tanggal", dataKey: "date" },
      ...(isProduksi ? [] : [{ header: "Petugas", dataKey: "petugas" }]),
      { header: "Kabupaten", dataKey: "kabupaten" },
      { header: "Kecamatan", dataKey: "kecamatan" },
      { header: "Desa", dataKey: "desa" },
      { header: "CGR", dataKey: "cgr" },
      { header: "Block/Plot", dataKey: "block_plot" },
      { header: "Member", dataKey: "member" },
      { header: "Doc No", dataKey: "doc_no" },
      { header: "NIS", dataKey: "nis" },
      { header: "PH Tanah", dataKey: "ph_tanah" },
      { header: "Real Tanam", dataKey: "real_tanam" },
      { header: "Gagal Tanam", dataKey: "gagal_tanam" },
      { header: "Label", dataKey: "label" },
      { header: "Sisa Lahan", dataKey: "sisa_lahan" },
      { header: "Panen", dataKey: "panen" },
      { header: "Status", dataKey: "status" },
    ];
    exportPdf(
      isProduksi ? "Jadwal Kunjungan Saya" : "Daftar Jadwal Kunjungan",
      columns,
      rows,
      `jadwal-${new Date().toISOString().split("T")[0]}.pdf`,
    );
  }

  const filters = {
    member_name: debouncedMemberName || undefined,
    block_no: blockNo.length > 0 ? blockNo : undefined,
    no_plot: noPlot || undefined,
    nis: nis || undefined,
    document_no: documentNo || undefined,
    status: status !== "all" ? status : undefined,
    user_id: isProduksi ? undefined : (userId || undefined),
    cgr: cgr || undefined,
    kabupaten_id: kabupatenId || undefined,
    kecamatan_id: kecamatanId || undefined,
    desa_id: desaId || undefined,
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
    varietas: debouncedVarietas || undefined,
    panen_status: panenStatus !== "all" ? panenStatus : undefined,
    label: label !== "all" ? label : undefined,
    includeDeleted: isAdmin ? (showDeleted || undefined) : undefined,
  };

  const relations = {
    member_name: debouncedMemberName || undefined,
    varietas: debouncedVarietas || undefined,
    kabupaten_id: kabupatenId || undefined,
    kecamatan_id: kecamatanId || undefined,
    desa_id: desaId || undefined,
    block_no: blockNo.length > 0 ? blockNo : undefined,
    no_plot: noPlot || undefined,
    nis: nis || undefined,
    document_no: documentNo || undefined,
    cgr: cgr || undefined,
  };

  if (isLoading || !user || !filtersReady) return <LoadingState variant="card" />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Jadwal Kunjungan"
        description="Kelola jadwal kunjungan lapangan"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleDownloadPdf}>
              <FileDown className="h-4 w-4 mr-1.5" />
              PDF
            </Button>
            <Link href="/schedules/calendar">
              <Button variant="outline" size="sm">
                <Calendar className="h-4 w-4 mr-1.5" />
                Kalender
              </Button>
            </Link>
            <Button size="sm" onClick={() => setShowCreate(true)} disabled={showDeleted}>
              <Plus className="h-4 w-4 mr-1.5" />
              Buat Jadwal
            </Button>
          </div>
        }
      />

      <ScheduleFilters
        memberName={memberName}
        onMemberNameChange={setMemberName}
        blockNo={blockNo}
        onBlockNoChange={setBlockNo}
        noPlot={noPlot}
        onNoPlotChange={setNoPlot}
        nis={nis}
        onNisChange={setNis}
        documentNo={documentNo}
        onDocumentNoChange={setDocumentNo}
        status={status}
        onStatusChange={setStatus}
        userId={userId}
        onUserIdChange={setUserId}
        cgr={cgr}
        onCgrChange={setCgr}
        kabupatenId={kabupatenId}
        onKabupatenChange={setKabupatenId}
        kecamatanId={kecamatanId}
        onKecamatanChange={setKecamatanId}
        desaId={desaId}
        onDesaChange={setDesaId}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        dateFrom={dateFrom}
        dateTo={dateTo}
        onDateFromChange={setDateFrom}
        onDateToChange={setDateTo}
        varietas={varietas}
        onVarietasChange={setVarietas}
        panenStatus={panenStatus}
        onPanenStatusChange={setPanenStatus}
        label={label}
        onLabelChange={setLabel}
        hidePetugasFilter={isProduksi}
        relations={relations}
        showDeleted={showDeleted}
        onShowDeletedChange={setShowDeleted}
      />

      <ScheduleTable filters={filters} />

      <ScheduleForm
        action={createScheduleAction}
        open={showCreate}
        onOpenChange={setShowCreate}
        onSuccess={() => {
          setShowCreate(false);
          queryClient.invalidateQueries({ queryKey: ["schedules"] });
          queryClient.invalidateQueries({ queryKey: ["dashboard"] });
          queryClient.invalidateQueries({ queryKey: ["calendar"] });
          queryClient.invalidateQueries({ queryKey: ["cgr"] });
        }}
      />
    </div>
  );
}
