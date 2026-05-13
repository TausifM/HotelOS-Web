import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  gradient: string;
  delay?: number;
}

export function StatCard({ label, value, icon: Icon, gradient, delay = 0 }: StatCardProps) {
  return (
    <div
      className="group relative overflow-hidden rounded-3xl bg-card p-6 shadow-card transition-smooth hover:-translate-y-1 hover:shadow-elegant animate-slide-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className={cn("absolute -right-8 -top-8 h-32 w-32 rounded-full opacity-10 blur-2xl transition-smooth group-hover:opacity-30 group-hover:scale-125", gradient)} />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className="mt-2 text-4xl font-bold tracking-tight text-foreground">{value}</p>
        </div>
        <div className={cn("flex h-12 w-12 items-center justify-center rounded-2xl shadow-lg", gradient)}>
          <Icon className="h-6 w-6 text-white" strokeWidth={2.5} />
        </div>
      </div>
    </div>
  );
}
