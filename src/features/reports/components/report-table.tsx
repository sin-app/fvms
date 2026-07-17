"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { STATUS_LABELS } from "@/lib/constants/status";
import { formatDate } from "@/lib/utils/date";
import type { ReportRow } from "../types/report-data";

interface ReportTableProps {
  rows: ReportRow[];
  onDownload: () => void;
  downloading?: boolean;
}

export function ReportTable({ rows, onDownload, downloading }: ReportTableProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-muted-foreground">
          {rows.length} baris data
        </p>
        <Button variant="outline" size="sm" onClick={onDownload} disabled={downloading}>
          <Download className="h-4 w-4 mr-1.5" />
          {downloading ? "Mengunduh..." : "Download Excel"}
        </Button>
      </div>

      <div className="rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-3 text-sm font-medium text-muted-foreground">Tanggal</th>
                <th className="text-left p-3 text-sm font-medium text-muted-foreground">Petugas</th>
                <th className="text-left p-3 text-sm font-medium text-muted-foreground">Kabupaten</th>
                <th className="text-left p-3 text-sm font-medium text-muted-foreground">Kecamatan</th>
                <th className="text-left p-3 text-sm font-medium text-muted-foreground">Desa</th>
                <th className="text-left p-3 text-sm font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b last:border-0">
                  <td className="p-3 text-sm">{formatDate(row.visit_date)}</td>
                  <td className="p-3 text-sm">{row.user_name}</td>
                  <td className="p-3 text-sm">{row.kabupaten_name}</td>
                  <td className="p-3 text-sm">{row.kecamatan_name}</td>
                  <td className="p-3 text-sm">{row.desa_name}</td>
                  <td className="p-3 text-sm">{STATUS_LABELS[row.status as keyof typeof STATUS_LABELS] ?? row.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
