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
  member_name: string | null;
  block_no: string | null;
  no_plot: string | null;
  nis: string | null;
  cgr: string | null;
  varietas: string | null;
  panen_status: string | null;
  ph_tanah: string | null;
  tgl_tanam: string | null;
  real_tanam_ha: number | null;
  gagal_tanam: number | null;
  sisa_di_lahan_ha: number | null;
  detaseling: string | null;
}
