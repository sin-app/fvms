"use client";

interface LoadingStateProps {
  variant?: "card" | "table" | "list";
  count?: number;
}

function CardSkeleton() {
  return (
    <div className="rounded-xl border bg-card p-4 space-y-3 overflow-hidden" aria-hidden="true">
      <div className="shimmer h-4 rounded w-1/3" />
      <div className="shimmer h-8 rounded w-1/2" />
      <div className="shimmer h-3 rounded w-2/3" />
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="space-y-3" aria-hidden="true">
      <div className="shimmer h-10 rounded w-full" />
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="shimmer h-12 rounded w-full" />
      ))}
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="space-y-3" aria-hidden="true">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3">
          <div className="shimmer h-10 w-10 rounded-full" />
          <div className="space-y-2 flex-1">
            <div className="shimmer h-4 rounded w-1/2" />
            <div className="shimmer h-3 rounded w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function LoadingState({ variant = "card", count = 3 }: LoadingStateProps) {
  const SkeletonComponent =
    variant === "table" ? TableSkeleton :
    variant === "list" ? ListSkeleton :
    CardSkeleton;

  return (
    <div
      role="status"
      aria-label="Memuat"
      className={variant === "card" ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3" : ""}
    >
      <span className="sr-only">Memuat data...</span>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonComponent key={i} />
      ))}
    </div>
  );
}