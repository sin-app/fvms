"use client";

import { useState } from "react";
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

export default function SchedulesPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isProduksi = user?.role === "produksi";
  const [memberName, setMemberName] = useState("");
  const [blockNo, setBlockNo] = useState("");
  const [noPlot, setNoPlot] = useState("");
  const [nis, setNis] = useState("");
  const [status, setStatus] = useState("all");
  const [cgr, setCgr] = useState("");
  const [userId, setUserId] = useState("");
  const [kabupatenId, setKabupatenId] = useState("");
  const [kecamatanId, setKecamatanId] = useState("");
  const [dateRange, setDateRange] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [varietas, setVarietas] = useState("");
  const [panenStatus, setPanenStatus] = useState("all");
  const [label, setLabel] = useState("all");
  const [showCreate, setShowCreate] = useState(false);

  const debouncedMemberName = useDebounce(memberName, 300);

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
    block_no: blockNo.trim() || undefined,
    no_plot: noPlot.trim() || undefined,
    nis: nis.trim() || undefined,
    status: status !== "all" ? status : undefined,
    user_id: isProduksi ? undefined : (userId || undefined),
    cgr: cgr.trim() || undefined,
    kabupaten_id: kabupatenId || undefined,
    kecamatan_id: kecamatanId || undefined,
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
    varietas: varietas.trim() || undefined,
    panen_status: panenStatus !== "all" ? panenStatus : undefined,
    label: label !== "all" ? label : undefined,
  };

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
            <Button size="sm" onClick={() => setShowCreate(true)}>
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
