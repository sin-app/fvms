export const ROLES = {
  ADMIN: "admin" as const,
  QC: "qc" as const,
  PRODUKSI: "produksi" as const,
};

export const ROLE_LABELS: Record<string, string> = {
  admin: "Administrator",
  qc: "QC",
  produksi: "Produksi",
};
