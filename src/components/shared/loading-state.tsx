interface LoadingStateProps {
  variant?: "card" | "table" | "list";
  count?: number;
}

function CardSkeleton() {
  return (
    <div className="rounded-xl border p-4 space-y-3 animate-pulse">
      <div className="h-4 bg-muted rounded w-1/3" />
      <div className="h-8 bg-muted rounded w-1/2" />
      <div className="h-3 bg-muted rounded w-2/3" />
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="h-10 bg-muted rounded w-full" />
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-12 bg-muted/50 rounded w-full" />
      ))}
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3">
          <div className="h-10 w-10 rounded-full bg-muted" />
          <div className="space-y-2 flex-1">
            <div className="h-4 bg-muted rounded w-1/2" />
            <div className="h-3 bg-muted rounded w-1/3" />
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
    <div className={variant === "card" ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3" : ""}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonComponent key={i} />
      ))}
    </div>
  );
}
