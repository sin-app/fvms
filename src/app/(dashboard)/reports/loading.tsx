import { LoadingState } from "@/components/shared/loading-state";

export default function ReportsLoading() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-48 bg-muted rounded animate-pulse" />
      <LoadingState variant="card" count={4} />
    </div>
  );
}
