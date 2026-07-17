export const ROLES = {
  ADMIN: "admin" as const,
  SUPERVISOR: "supervisor" as const,
  FIELD_OFFICER: "field_officer" as const,
};

export const ROLE_LABELS: Record<string, string> = {
  admin: "Administrator",
  supervisor: "Supervisor",
  field_officer: "Field Officer",
};
