import { dateString, todayString } from "@/lib/utils/date";

const PANEN_AGE: Record<string, number> = {
  "JMP-01": 90,
  "JMP-03": 90,
  "JMP-06": 90,
  "JMP-07": 90,
  "JMP-18": 90,
  "JMP-05": 85,
};

function getPanenAge(cgr: string | undefined | null): number {
  if (!cgr) return 0;
  const match = cgr.match(/(JMP-\d+)/i);
  if (!match) return 0;
  return PANEN_AGE[match[1].toUpperCase()] ?? 0;
}

export function calcRencanaPanen(
  tgl_tanam: string | undefined | null,
  cgr: string | undefined | null,
): string | null {
  if (!tgl_tanam) return null;
  const days = getPanenAge(cgr);
  if (days <= 0) return null;
  const d = new Date(tgl_tanam + "T00:00:00");
  d.setDate(d.getDate() + days);
  return dateString(d);
}

export function deriveScheduleStatus(input: {
  real_tanam_ha?: number | null;
  gagal_tanam?: number | null;
}): { status: string; panen_keterangan?: string } | null {
  const { real_tanam_ha, gagal_tanam } = input;
  if (real_tanam_ha == null || gagal_tanam == null) return null;

  const sisa = real_tanam_ha - gagal_tanam;

  if (sisa > 0) {
    return { status: "gagal_partial" };
  }
  if (sisa <= 0) {
    return { status: "gagal_total", panen_keterangan: "Bongkar Total" };
  }

  return null;
}

export function getPanenStatus(schedule: {
  tgl_panen?: string | null;
  real_panen?: string | null;
  rencana_panen?: string | null;
  tgl_tanam?: string | null;
  cgr?: string | null;
}): { label: string; harvested: boolean } {
  if (schedule.tgl_panen || schedule.real_panen) {
    return { label: "Panen", harvested: true };
  }
  const rencana = schedule.rencana_panen ?? calcRencanaPanen(schedule.tgl_tanam, schedule.cgr);
  if (rencana) {
    const today = todayString();
    if (today >= rencana) {
      return { label: "Jatuh Tempo", harvested: false };
    }
    return { label: `Renc: ${rencana}`, harvested: false };
  }
  return { label: "—", harvested: false };
}
