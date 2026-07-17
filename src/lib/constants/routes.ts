export const ROUTES = {
  LOGIN: "/login",
  RESET_PASSWORD: "/reset-password",
  DASHBOARD: "/dashboard",
  MASTER_DATA: {
    KABUPATEN: "/master-data/kabupaten",
    KECAMATAN: "/master-data/kecamatan",
    DESA: "/master-data/desa",
  },
  SCHEDULES: "/schedules",
  SCHEDULE: (id: string) => `/schedules/${id}`,
  CALENDAR: "/schedules/calendar",
  VISIT: (id: string) => `/visits/${id}`,
  IMPORT: "/import",
  REPORTS: "/reports",
  NOTIFICATIONS: "/notifications",
  PROFILE: "/profile",
  USERS: "/users",
} as const;

export const PUBLIC_ROUTES = [ROUTES.LOGIN, ROUTES.RESET_PASSWORD] as const;
