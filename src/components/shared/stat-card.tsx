import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: ReactNode;
  trend?: { value: number; positive: boolean };
  href?: string;
}

export function StatCard({ title, value, icon, trend, href }: StatCardProps) {
  const content = (
    <div
      className={cn(
        "group relative h-full rounded-2xl border bg-card p-4 sm:p-5 transition-all duration-200",
        "hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/5",
        href && "hover:border-brand/40",
        !href && "cursor-default",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 space-y-1.5">
          <p className="truncate text-xs font-medium text-muted-foreground sm:text-sm">
            {title}
          </p>
          <p className="text-2xl font-bold tracking-tight sm:text-3xl">
            {value}
          </p>
          {trend && (
            <p
              className={cn(
                "text-xs font-medium",
                trend.positive ? "text-green-600" : "text-red-600",
              )}
            >
              {trend.positive ? "+" : "-"}
              {trend.value}%
            </p>
          )}
        </div>
        {icon && (
          <div
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted/70 ring-1 ring-border/60 [&_svg]:h-5 [&_svg]:w-5",
              "transition-colors group-hover:bg-brand-soft group-hover:ring-brand/30",
            )}
          >
            {icon}
          </div>
        )}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block h-full">
        {content}
      </Link>
    );
  }

  return content;
}