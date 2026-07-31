"use client";

import { LabelBadge } from "@/components/shared/label-badge";
import { StatusBadge } from "@/components/shared/status-badge";
import type { VisitStatus } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Download, FileDown, Sprout } from "lucide-react";
import { STATUS_LABELS } from "@/lib/constants/status";
import { todayString } from "@/lib/utils/date";
import { exportPdf } from "@/lib/export/pdf";
import type { ReportRow } from "../types/report-data";

interface ReportTableProps {
  rows: ReportRow[];
  onDownload: () => void;
  downloading?: boolean;
}

export function ReportTable({ rows, onDownload, downloading }: ReportTableProps) {

  function handleDownloadPdf() {
    if (!rows.length) return;
    const pdfRows = rows.map((r) => ({
      date: r.visit_date,
      kabupaten: r.kabupaten_name,
      kecamatan: r.kecamatan_name,
      desa: r.desa_name,
      petugas: r.user_name,
      cgr: r.cgr ?? "—",
      blockPlot: `${r.block_no ?? ""}${r.no_plot ? ` / ${r.no_plot}` : ""}`,
      member: r.member_name ?? "—",
      docNo: r.varietas ?? "—",
      nis: r.nis ?? "—",
      phTanah: r.ph_tanah?.toString() ?? "—",
      tglTanam: r.tgl_tanam ?? "—",
      realTanam: r.real_tanam_ha?.toString() ?? "—",
      gagalTanam: r.gagal_tanam?.toString() ?? "—",
      sisaLahan: r.sisa_di_lahan_ha?.toString() ?? "—",
      status: STATUS_LABELS[r.status as keyof typeof STATUS_LABELS] ?? r.status,
      label: r.label ?? "—",
      panen: r.panen_status ?? "—",
    }));
    exportPdf(
      "Laporan Kunjungan Lapangan",
      [
        { header: "Tanggal", dataKey: "date" },
        { header: "Petugas", dataKey: "petugas" },
        { header: "Kabupaten", dataKey: "kabupaten" },
        { header: "Kecamatan", dataKey: "kecamatan" },
        { header: "Desa", dataKey: "desa" },
        { header: "CGR", dataKey: "cgr" },
        { header: "Block/Plot", dataKey: "blockPlot" },
        { header: "Member", dataKey: "member" },
        { header: "Doc No", dataKey: "docNo" },
        { header: "NIS", dataKey: "nis" },
        { header: "PH Tanah", dataKey: "phTanah" },
        { header: "Tgl Tanam", dataKey: "tglTanam" },
        { header: "Real Tanam", dataKey: "realTanam" },
        { header: "Gagal Tanam", dataKey: "gagalTanam" },
        { header: "Sisa Lahan", dataKey: "sisaLahan" },
        { header: "Status", dataKey: "status" },
        { header: "Label", dataKey: "label" },
        { header: "Panen", dataKey: "panen" },
      ],
      pdfRows,
      `laporan-${todayString()}.pdf`,
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-muted-foreground">
          {rows.length} baris data
        </p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleDownloadPdf}>
            <FileDown className="h-4 w-4 mr-1.5" />
            Download PDF
          </Button>
          <Button variant="outline" size="sm" onClick={onDownload} disabled={downloading}>
            <Download className="h-4 w-4 mr-1.5" />
            {downloading ? "Mengunduh..." : "Download Excel"}
          </Button>
        </div>
      </div>

      <div className="rounded-xl border overflow-hidden">
        <div className="overflow-x-auto min-w-0">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-3 text-sm font-medium text-muted-foreground whitespace-nowrap">Tanggal</th>
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
                <th className="text-left p-3 text-sm font-medium text-muted-foreground whitespace-nowrap">Tgl Tanam</th>
                <th className="text-right p-3 text-sm font-medium text-muted-foreground whitespace-nowrap">Real Tanam</th>
                <th className="text-right p-3 text-sm font-medium text-muted-foreground whitespace-nowrap">Gagal Tanam</th>
                <th className="text-right p-3 text-sm font-medium text-muted-foreground whitespace-nowrap">Sisa Lahan</th>
                <th className="text-left p-3 text-sm font-medium text-muted-foreground whitespace-nowrap hidden xl:table-cell">Detaseling</th>
                <th className="text-left p-3 text-sm font-medium text-muted-foreground whitespace-nowrap w-20">Label</th>
                <th className="text-left p-3 text-sm font-medium text-muted-foreground whitespace-nowrap">Panen</th>
                <th className="text-left p-3 text-sm font-medium text-muted-foreground whitespace-nowrap">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                  <td className="p-3 text-sm whitespace-nowrap">{row.visit_date}</td>
                  <td className="p-3 text-sm whitespace-nowrap">{row.kabupaten_name}</td>
                  <td className="p-3 text-sm whitespace-nowrap">{row.kecamatan_name}</td>
                  <td className="p-3 text-sm whitespace-nowrap">{row.desa_name}</td>
                  <td className="p-3 text-sm whitespace-nowrap">{row.user_name}</td>
                  <td className="p-3 text-sm whitespace-nowrap">{row.cgr ?? "—"}</td>
                  <td className="p-3 text-sm whitespace-nowrap">
                    {row.block_no ?? "—"}
                    {row.no_plot ? <span className="text-muted-foreground text-xs block">Plot: {row.no_plot}</span> : null}
                  </td>
                  <td className="p-3 text-sm whitespace-nowrap">{row.member_name ?? "—"}</td>
                  <td className="p-3 text-sm whitespace-nowrap">{row.varietas ?? "—"}</td>
                  <td className="p-3 text-sm whitespace-nowrap">{row.nis ?? "—"}</td>
                  <td className="p-3 text-sm text-right whitespace-nowrap">{row.ph_tanah ?? "—"}</td>
                  <td className="p-3 text-sm whitespace-nowrap">{row.tgl_tanam ?? "—"}</td>
                  <td className="p-3 text-sm text-right whitespace-nowrap">{row.real_tanam_ha ?? "—"}</td>
                  <td className="p-3 text-sm text-right whitespace-nowrap">{row.gagal_tanam ?? "—"}</td>
                  <td className="p-3 text-sm text-right whitespace-nowrap">{row.sisa_di_lahan_ha ?? "—"}</td>
                  <td className="p-3 text-sm whitespace-nowrap hidden xl:table-cell">{row.detaseling ?? "—"}</td>
                  <td className="p-3 whitespace-nowrap">
                    <LabelBadge label={row.label} />
                  </td>
                  <td className="p-3 whitespace-nowrap">
                    {row.panen_status && row.panen_status !== "—" ? (
                      row.panen_status.startsWith("Panen") ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-950 rounded-full px-2 py-0.5">
                          <Sprout className="h-3 w-3" />
                          {row.panen_status}
                        </span>
                      ) : row.panen_status.startsWith("Jatuh Tempo") ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950 rounded-full px-2 py-0.5">
                          {row.panen_status}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          {row.panen_status}
                        </span>
                      )
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="p-3">
                    <StatusBadge status={row.status as VisitStatus} size="sm" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
