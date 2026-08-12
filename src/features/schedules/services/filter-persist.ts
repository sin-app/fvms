export interface PersistedScheduleFilters {
  member_name?: string;
  user_id?: string;
  block_no?: string[];
  no_plot?: string;
  nis?: string;
  document_no?: string;
  status?: string;
  cgr?: string;
  kabupaten_id?: string;
  kecamatan_id?: string;
  desa_id?: string;
  date_range?: string;
  date_from?: string;
  date_to?: string;
  varietas?: string;
  panen_status?: string;
  label?: string;
}

const str = (v: unknown, fallback = ""): string => (typeof v === "string" ? v : fallback);
const arr = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];

function storageKey(userId: string): string {
  return `fvms:sched-filters:${userId}`;
}

export function loadPersistedFilters(userId: string | undefined): PersistedScheduleFilters {
  if (!userId || typeof window === "undefined") return {};
  try {
    const raw = window.sessionStorage.getItem(storageKey(userId));
    if (!raw) return {};
    const p = JSON.parse(raw) as Record<string, unknown>;
    return {
      member_name: str(p.member_name),
      user_id: str(p.user_id),
      block_no: arr(p.block_no),
      no_plot: str(p.no_plot),
      nis: str(p.nis),
      document_no: str(p.document_no),
      status: str(p.status, "all"),
      cgr: str(p.cgr),
      kabupaten_id: str(p.kabupaten_id),
      kecamatan_id: str(p.kecamatan_id),
      desa_id: str(p.desa_id),
      date_range: str(p.date_range),
      date_from: str(p.date_from),
      date_to: str(p.date_to),
      varietas: str(p.varietas),
      panen_status: str(p.panen_status, "all"),
      label: str(p.label, "all"),
    };
  } catch {
    return {};
  }
}

export function savePersistedFilters(
  userId: string | undefined,
  filters: PersistedScheduleFilters,
): void {
  if (!userId || typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(storageKey(userId), JSON.stringify(filters));
  } catch {
    // storage penuh/terblokir — abaikan, filter hanya tidak menetap
  }
}
