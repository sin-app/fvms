export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginationResult {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface SortParams {
  field: string;
  direction: "asc" | "desc";
}

export interface ActionResponse<T = void> {
  success: boolean;
  data?: T;
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

export interface SelectOption {
  value: string;
  label: string;
}

export interface DateRange {
  from: Date;
  to: Date;
}

export interface GpsCoordinate {
  latitude: number;
  longitude: number;
  accuracy: number | null;
}
