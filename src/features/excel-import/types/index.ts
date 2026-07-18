export interface ColumnMapping {
  [columnName: string]: string;
}

export interface ExcelRow {
  [key: string]: string | undefined;
}

export interface ImportPreview {
  columns: string[];
  rows: ExcelRow[];
  totalRows: number;
}

export interface ImportResult {
  id: string;
  success: number;
  errors: number;
  created?: { kabupaten: number; kecamatan: number; desa: number };
  errorRows: Array<{ row: number; message: string }>;
}
