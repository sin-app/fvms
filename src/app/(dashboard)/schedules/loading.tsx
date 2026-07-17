import { LoadingState } from "@/components/shared/loading-state";

export default function SchedulesLoading() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-48 bg-muted rounded animate-pulse" />
      <div className="h-10 w-full bg-muted rounded animate-pulse" />
      <LoadingState variant="table" />
    </div>
  );
}
