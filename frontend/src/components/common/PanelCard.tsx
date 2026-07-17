import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PanelCardProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function PanelCard({
  title,
  subtitle,
  actions,
  children,
  className,
}: PanelCardProps) {
  return (
    <section className={cn("rounded-2xl glass-panel p-6 relative overflow-hidden group", className)}>
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      <div className="mb-4 flex items-start justify-between gap-3 relative z-10">
        <div>
          <h3 className="text-lg font-semibold text-slate-100 glow-text">{title}</h3>
          {subtitle ? <p className="mt-1 text-sm text-slate-400">{subtitle}</p> : null}
        </div>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>
      <div className="relative z-10">{children}</div>
    </section>
  );
}

interface MetricCardProps {
  title: string;
  value: string;
  note: string;
  icon: ReactNode;
  tone?: "blue" | "green" | "amber" | "slate";
}

export function MetricCard({ title, value, note, icon, tone = "blue" }: MetricCardProps) {
  const toneClasses = {
    blue: "border-primary/30 bg-primary/10 text-primary glow-border shadow-[0_0_15px_-3px_var(--primary)]",
    green: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 shadow-[0_0_15px_-3px_#34d399]",
    amber: "border-amber-500/30 bg-amber-500/10 text-amber-400 shadow-[0_0_15px_-3px_#fbbf24]",
    slate: "border-white/20 glass-panel/5 text-slate-300",
  }[tone];

  return (
    <div className="rounded-2xl glass-panel interactive-card p-5 relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      <div className="flex items-start justify-between gap-3 relative z-10">
        <div>
          <p className="text-sm font-medium text-slate-400">{title}</p>
          <p className="mt-2 text-3xl font-semibold text-slate-100 glow-text">{value}</p>
        </div>
        <div className={cn("rounded-xl border p-2", toneClasses)}>{icon}</div>
      </div>
      <p className="mt-4 text-sm text-slate-400 relative z-10">{note}</p>
    </div>
  );
}
