export interface ReportRow {
  id: string;
  visit_date: string;
  user_name: string;
  kabupaten_name: string;
  kecamatan_name: string;
  desa_name: string;
  status: string;
  visit_time: string | null;
  has_notes: boolean;
}
