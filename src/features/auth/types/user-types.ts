export interface UserFormData {
  name: string;
  email: string;
  role: "admin" | "qc" | "produksi";
  phone?: string;
  is_active: boolean;
}
