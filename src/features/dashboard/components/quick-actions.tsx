"use client";

import Link from "next/link";
import { Plus, FileSpreadsheet, Calendar, BarChart3 } from "lucide-react";

const actions = [
  {
    href: "/import",
    label: "Import Excel",
    description: "Upload jadwal dari Excel",
    icon: FileSpreadsheet,
    color: "text-blue-500 bg-blue-50",
  },
  {
    href: "/schedules",
    label: "Jadwal Baru",
    description: "Buat jadwal manual",
    icon: Plus,
    color: "text-green-500 bg-green-50",
  },
  {
    href: "/schedules/calendar",
    label: "Kalender",
    description: "Lihat kalender kunjungan",
    icon: Calendar,
    color: "text-purple-500 bg-purple-50",
  },
  {
    href: "/reports",
    label: "Laporan",
    description: "Export laporan kunjungan",
    icon: BarChart3,
    color: "text-amber-500 bg-amber-50",
  },
];

export function QuickActions() {
  return (
    <div className="rounded-xl border bg-card p-4">
      <h2 className="font-semibold mb-4">Aksi Cepat</h2>
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="flex flex-col items-center gap-2 p-4 rounded-lg hover:bg-muted/50 transition-colors text-center"
          >
            <div className={`p-2.5 rounded-full ${action.color}`}>
              <action.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium">{action.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {action.description}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
