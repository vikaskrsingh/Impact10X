import { BarChart3, FileText, TrendingUp, Users } from "lucide-react";
import { PanelCard, MetricCard } from "../../components/common/PanelCard";

const metrics = [
  { title: "Questions Trend", value: "+18%", note: "Higher demand in AMLD6 and fraud", icon: <TrendingUp className="h-5 w-5" />, tone: "blue" as const },
  { title: "Most Used Experts", value: "GDPR", note: "Most queried across the bank", icon: <Users className="h-5 w-5" />, tone: "green" as const },
  { title: "Most Viewed Docs", value: "92", note: "Policy pack views this week", icon: <FileText className="h-5 w-5" />, tone: "amber" as const },
];

const weeklyBars = [48, 58, 62, 75, 68, 84, 92];
const topExperts = [
  { name: "GDPR Expert", volume: "1.2k queries", score: "98% fit" },
  { name: "AMLD6 Analyst", volume: "920 queries", score: "96% fit" },
  { name: "PSD2 Fraud Expert", volume: "780 queries", score: "94% fit" },
];

const domainHealth = [
  { label: "GDPR", percent: 96 },
  { label: "AMLD6", percent: 94 },
  { label: "MiFID II", percent: 91 },
  { label: "PSD2", percent: 89 },
];

export default function Analytics() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary glow-text">Analytics</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-100">AURA adoption and knowledge insights</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-400">Track adoption, answer quality, and domain health across the knowledge estate.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {metrics.map((metric) => (
          <MetricCard key={metric.title} {...metric} />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <PanelCard title="Adoption trend" subtitle="Question volume by expert over the last 30 days">
          <div className="grid h-64 grid-cols-7 items-end gap-3 rounded-2xl glass-panel/5 border border-white/10 p-4">
            {weeklyBars.map((height, index) => (
              <div key={`${height}-${index}`} className="flex flex-col items-center gap-2">
                <div className="w-full rounded-t-full bg-blue-600" style={{ height: `${height}px` }} />
                <span className="text-xs text-slate-400">W{index + 1}</span>
              </div>
            ))}
          </div>
        </PanelCard>

        <PanelCard title="Top experts by usage" subtitle="Most active agents this month">
          <div className="space-y-3">
            {topExperts.map((item) => (
              <div key={item.name} className="rounded-xl border border-slate-200 p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-100">
                    <BarChart3 className="h-4 w-4 text-primary glow-text" />
                    {item.name}
                  </div>
                  <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">{item.score}</span>
                </div>
                <p className="mt-1 text-sm text-slate-400">{item.volume}</p>
              </div>
            ))}
          </div>
        </PanelCard>
      </div>

      <PanelCard title="Knowledge health by domain" subtitle="Confidence and retrieval quality across core banking domains">
        <div className="grid gap-4 md:grid-cols-2">
          {domainHealth.map((item) => (
            <div key={item.label} className="rounded-2xl border border-slate-200 glass-panel/5 border border-white/10 p-4">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-semibold text-slate-100">{item.label}</span>
                <span className="text-slate-400">{item.percent}%</span>
              </div>
              <div className="h-2 rounded-full bg-slate-200">
                <div className="h-2 rounded-full bg-blue-600" style={{ width: `${item.percent}%` }} />
              </div>
            </div>
          ))}
        </div>
      </PanelCard>
    </div>
  );
}