export interface ReportFilters {
  date_from?: string;
  date_to?: string;
  user_id?: string;
  kabupaten_id?: string;
  kecamatan_id?: string;
  status?: string;
}

export interface ReportData {
  total_schedules: number;
  completed: number;
  cancelled: number;
  pending: number;
  on_the_way: number;
  in_progress: number;
  completion_rate: number;
  late_count: number;
  by_officer: Array<{
    user_id: string;
    user_name: string;
    total: number;
    completed: number;
    completion_rate: number;
  }>;
  by_kabupaten: Array<{
    kabupaten_id: string;
    kabupaten_name: string;
    total: number;
    completed: number;
  }>;
  daily_data: Array<{
    date: string;
    total: number;
    completed: number;
  }>;
}

export * from "./report-data";
