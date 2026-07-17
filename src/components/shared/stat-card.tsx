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
        "rounded-xl border bg-card p-5 transition-colors hover:bg-muted/50",
        !href && "cursor-default hover:bg-card",
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold">{value}</p>
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
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </div>
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}
