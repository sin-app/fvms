import { AppSidebar } from "@/components/shared/app-sidebar";
import { AppHeader } from "@/components/shared/app-header";
import { BottomNav } from "@/components/shared/bottom-nav";
import { ErrorBoundary } from "@/components/shared/error-boundary";
import { AuthGate } from "@/components/shared/auth-gate";
import { RealtimeSubscriber } from "@/components/shared/realtime-subscriber";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthGate>
      <div className="flex min-h-screen overflow-x-hidden">
        <AppSidebar />
        <div className="flex-1 min-w-0 flex flex-col">
          <AppHeader />
          <RealtimeSubscriber />
          <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 pb-20 sm:pb-8">
            <ErrorBoundary>{children}</ErrorBoundary>
          </main>
          <BottomNav />
        </div>
      </div>
    </AuthGate>
  );
}
