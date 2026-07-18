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
    <section className={cn("rounded-2xl bg-[#06080d] border border-white/5 p-6 relative overflow-hidden shadow-lg", className)}>
      <div className="mb-5 flex items-start justify-between gap-3 relative z-10">
        <div>
          <h3 className="text-sm font-bold tracking-wide text-white uppercase">{title}</h3>
          {subtitle ? <p className="mt-1.5 text-[11px] text-slate-500 font-medium">{subtitle}</p> : null}
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
    blue: "bg-purple-500/20 text-purple-400",
    green: "bg-emerald-500/20 text-emerald-400",
    amber: "bg-amber-500/20 text-amber-400",
    slate: "bg-slate-500/20 text-slate-400",
  }[tone];

  return (
    <div className="rounded-2xl bg-[#06080d] border border-white/5 p-6 shadow-lg transition-transform hover:-translate-y-1 duration-300">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">{title}</p>
          <p className="mt-2 text-3xl font-bold text-white">{value}</p>
        </div>
        <div className={cn("rounded-xl p-3 shrink-0 flex items-center justify-center", toneClasses)}>{icon}</div>
      </div>
      <p className="mt-4 text-xs font-medium text-slate-400">{note}</p>
    </div>
  );
}
