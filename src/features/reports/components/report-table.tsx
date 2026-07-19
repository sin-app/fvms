"use client";

import { Button } from "@/components/ui/button";
import { Download, FileDown } from "lucide-react";
import { STATUS_LABELS } from "@/lib/constants/status";
import { formatDate } from "@/lib/utils/date";
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
      user: r.user_name,
      kabupaten: r.kabupaten_name,
      kecamatan: r.kecamatan_name,
      desa: r.desa_name,
      status: STATUS_LABELS[r.status as keyof typeof STATUS_LABELS] ?? r.status,
    }));
    exportPdf(
      "Laporan Kunjungan Lapangan",
      [
        { header: "Tanggal", dataKey: "date" },
        { header: "Produksi", dataKey: "user" },
        { header: "Kabupaten", dataKey: "kabupaten" },
        { header: "Kecamatan", dataKey: "kecamatan" },
        { header: "Desa", dataKey: "desa" },
        { header: "Status", dataKey: "status" },
      ],
      pdfRows,
      `laporan-${new Date().toISOString().split("T")[0]}.pdf`,
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
                <th className="text-left p-3 text-sm font-medium text-muted-foreground whitespace-nowrap">Produksi</th>
                <th className="text-left p-3 text-sm font-medium text-muted-foreground whitespace-nowrap">Kabupaten</th>
                <th className="text-left p-3 text-sm font-medium text-muted-foreground whitespace-nowrap">Kecamatan</th>
                <th className="text-left p-3 text-sm font-medium text-muted-foreground whitespace-nowrap">Desa</th>
                <th className="text-left p-3 text-sm font-medium text-muted-foreground whitespace-nowrap">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b last:border-0">
                  <td className="p-3 text-sm whitespace-nowrap">{formatDate(row.visit_date)}</td>
                  <td className="p-3 text-sm whitespace-nowrap">{row.user_name}</td>
                  <td className="p-3 text-sm whitespace-nowrap">{row.kabupaten_name}</td>
                  <td className="p-3 text-sm whitespace-nowrap">{row.kecamatan_name}</td>
                  <td className="p-3 text-sm whitespace-nowrap">{row.desa_name}</td>
                  <td className="p-3 text-sm whitespace-nowrap">{STATUS_LABELS[row.status as keyof typeof STATUS_LABELS] ?? row.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
