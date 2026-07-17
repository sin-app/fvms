export type UserRole = "admin" | "supervisor" | "field_officer";

export type VisitStatus =
  | "pending"
  | "on_the_way"
  | "in_progress"
  | "completed"
  | "cancelled";

export type NotificationType = "info" | "warning" | "success" | "error";

export type ImportStatus = "processing" | "completed" | "failed";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar_url: string | null;
  phone: string | null;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Kabupaten {
  id: string;
  name: string;
  code: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Kecamatan {
  id: string;
  kabupaten_id: string;
  name: string;
  code: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  kabupaten?: Kabupaten;
}

export interface Desa {
  id: string;
  kecamatan_id: string;
  name: string;
  code: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  kecamatan?: Kecamatan;
}

export interface Schedule {
  id: string;
  user_id: string;
  kabupaten_id: string;
  kecamatan_id: string;
  desa_id: string;
  visit_date: string;
  status: VisitStatus;
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  visit_time: string | null;
  notes: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  kabupaten?: Kabupaten;
  kecamatan?: Kecamatan;
  desa?: Desa;
  user?: User;
  visit_notes?: VisitNotes;
  visit_photos?: VisitPhoto[];
}

export interface VisitNotes {
  id: string;
  schedule_id: string;
  observation: string | null;
  problem: string | null;
  recommend: string | null;
  additional: string | null;
  created_at: string;
  updated_at: string;
}

export interface VisitPhoto {
  id: string;
  schedule_id: string;
  url: string;
  thumbnail: string | null;
  caption: string | null;
  file_size: number | null;
  mime_type: string | null;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  is_read: boolean;
  link: string | null;
  created_at: string;
}

export interface ExcelImport {
  id: string;
  user_id: string;
  filename: string;
  total_rows: number;
  success_rows: number;
  error_rows: number;
  column_mapping: Record<string, string> | null;
  status: ImportStatus;
  error_log: Record<string, unknown>[] | null;
  created_at: string;
}

export type Tables =
  | "users"
  | "kabupaten"
  | "kecamatan"
  | "desa"
  | "schedules"
  | "visit_notes"
  | "visit_photos"
  | "activity_logs"
  | "notifications"
  | "excel_imports";

export type Row<T extends Tables> =
  T extends "users" ? User :
  T extends "kabupaten" ? Kabupaten :
  T extends "kecamatan" ? Kecamatan :
  T extends "desa" ? Desa :
  T extends "schedules" ? Schedule :
  T extends "visit_notes" ? VisitNotes :
  T extends "visit_photos" ? VisitPhoto :
  T extends "activity_logs" ? ActivityLog :
  T extends "notifications" ? Notification :
  T extends "excel_imports" ? ExcelImport :
  never;
