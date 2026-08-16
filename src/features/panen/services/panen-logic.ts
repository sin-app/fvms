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
  return PANEN_AGE[match[1]?.toUpperCase() ?? ""] ?? 0;
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
  sisa_di_lahan_ha?: number | null;
  hasActivity?: boolean;
}): { status: string; panen_keterangan?: string } | null {
  const { real_tanam_ha, gagal_tanam, sisa_di_lahan_ha, hasActivity } = input;

  if (sisa_di_lahan_ha != null && sisa_di_lahan_ha === 0) {
    if (gagal_tanam == null || gagal_tanam <= 0) {
      return { status: "completed" };
    }
    if (real_tanam_ha != null && real_tanam_ha - gagal_tanam === 0) {
      return { status: "gagal_total", panen_keterangan: "Bongkar Total" };
    }
    // sisa=0 tetapi real-gagal != 0 (atau real_tanam tidak ada): data tidak konsisten,
    // jangan otomatis completed karena bisa menutupi kegagalan → jatuh ke fallback di bawah.
  } else if (
    sisa_di_lahan_ha != null && sisa_di_lahan_ha > 0 &&
    gagal_tanam != null && gagal_tanam > 0 &&
    real_tanam_ha != null &&
    real_tanam_ha - gagal_tanam === sisa_di_lahan_ha
  ) {
    return { status: "gagal_partial" };
  }

  if (real_tanam_ha != null && gagal_tanam != null && gagal_tanam > 0) {
    const sisa = real_tanam_ha - gagal_tanam;
    if (sisa <= 0) {
      return { status: "gagal_total", panen_keterangan: "Bongkar Total" };
    }
  }

  if (hasActivity != null) {
    return { status: hasActivity ? "in_progress" : "pending" };
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
