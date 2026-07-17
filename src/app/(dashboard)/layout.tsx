import { AppSidebar } from "@/components/shared/app-sidebar";
import { AppHeader } from "@/components/shared/app-header";
import { BottomNav } from "@/components/shared/bottom-nav";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      <div className="flex-1 flex flex-col">
        <AppHeader />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-20 sm:pb-8">
          {children}
        </main>
        <BottomNav />
      </div>
    </div>
  );
}
