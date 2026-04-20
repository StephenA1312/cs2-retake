import * as React from "react";
import { cn } from "@/lib/cn";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("bg-card border border-border p-5", className)} {...props} />;
}

export function StatCard({
  label,
  value,
  hint,
  loading,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  loading?: boolean;
}) {
  return (
    <Card>
      <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{label}</div>
      <div className="mt-2 font-heading text-2xl font-bold text-foreground">
        {loading ? <span className="inline-block h-6 w-16 bg-muted animate-pulse" /> : value}
      </div>
      {hint !== undefined && (
        <div className="mt-1 text-xs text-muted-foreground">
          {loading ? <span className="inline-block h-3 w-24 bg-muted animate-pulse" /> : hint}
        </div>
      )}
    </Card>
  );
}
