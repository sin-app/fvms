"use client";

import Link from "next/link";
import { List } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { CalendarView } from "@/features/schedules";

export default function CalendarPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Kalender Kunjungan"
        description="Lihat jadwal kunjungan dalam tampilan kalender"
        actions={
          <Link href="/schedules">
            <Button variant="outline" size="sm">
              <List className="h-4 w-4 mr-1.5" />
              Tabel
            </Button>
          </Link>
        }
      />

      <CalendarView />
    </div>
  );
}
