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
  rencana_panen: string | null;
  real_panen: string | null;
  tgl_panen: string | null;
  label: string | null;
}
