import {
  LayoutDashboard,
  CalendarCheck,
  CalendarDays,
  Database,
  FileSpreadsheet,
  BarChart3,
  Bell,
  Users,
  Settings,
} from "lucide-react";

export interface NavItem {
  href?: string;
  label: string;
  icon: React.ElementType;
  children?: { href: string; label: string }[];
  adminOnly?: boolean;
}

export const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  {
    label: "Master Data",
    icon: Database,
    children: [
      { href: "/master-data/kabupaten", label: "Kabupaten" },
      { href: "/master-data/kecamatan", label: "Kecamatan" },
      { href: "/master-data/desa", label: "Desa" },
    ],
  },
  { href: "/schedules", label: "Jadwal", icon: CalendarCheck },
  { href: "/schedules/calendar", label: "Kalender", icon: CalendarDays },
  { href: "/import", label: "Import Excel", icon: FileSpreadsheet },
  { href: "/reports", label: "Laporan", icon: BarChart3 },
  { href: "/notifications", label: "Notifikasi", icon: Bell },
  { href: "/users", label: "Users", icon: Users, adminOnly: true },
  { href: "/settings", label: "Pengaturan", icon: Settings },
];
