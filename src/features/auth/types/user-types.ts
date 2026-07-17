export interface UserFormData {
  name: string;
  email: string;
  role: "admin" | "supervisor" | "field_officer";
  phone?: string;
  is_active: boolean;
}
