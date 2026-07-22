import type { Schedule } from "@/types";

export interface ScheduleFilters {
  search?: string;
  status?: string;
  user_id?: string;
  cgr?: string;
  member_name?: string;
  block_no?: string;
  no_plot?: string;
  nis?: string;
  tgl_tanam?: string;
  kabupaten_id?: string;
  kecamatan_id?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  pageSize?: number;
  sort_by?: string;
  sort_dir?: "asc" | "desc";
  varietas?: string;
}

export interface ScheduleListResult {
  data: Schedule[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end?: string;
  backgroundColor: string;
  borderColor: string;
  textColor: string;
  extendedProps: {
    status: string;
    kabupaten: string;
    kecamatan: string;
    desa: string;
  };
}
