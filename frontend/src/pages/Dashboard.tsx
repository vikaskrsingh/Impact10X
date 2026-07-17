import { motion } from "framer-motion";
import {
  Bot,
  FileText,
  MessageCircleMore,
  ShieldCheck,
  Workflow,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { MetricCard, PanelCard } from "../components/common/PanelCard";
import { getStoredRole, isAdminRole } from "@/utils/auth";
import { useEffect, useState } from "react";
import { getDashboardStats, getRecentActivity, getRecentUploads } from "../services/auraApi";
import type { DashboardStats, DashboardActivity, DashboardUpload } from "../services/auraApi";

export default function Dashboard() {
  const role = getStoredRole();
  const isAdmin = isAdminRole(role);

  const [stats, setStats] = useState<DashboardStats>({
    totalExperts: 0,
    averageHealth: 0,
    totalDocuments: 0,
    totalQuestions: 0,
  });
  const [activity, setActivity] = useState<DashboardActivity[]>([]);
  const [uploads, setUploads] = useState<DashboardUpload[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [statsData, activityData, uploadsData] = await Promise.all([
          getDashboardStats(),
          getRecentActivity(),
          getRecentUploads()
        ]);
        setStats(statsData);
        setActivity(activityData);
        setUploads(uploadsData);
      } catch (error) {
        console.error("Failed to load dashboard data", error);
      } finally {
        setIsLoading(false);
      }
    }
    void loadData();
  }, []);

  const metrics = [
    { title: "AI Experts", value: stats.totalExperts.toString(), note: "Total onboarded expert agents", icon: <Bot className="h-5 w-5" />, tone: "blue" as const },
    { title: "Knowledge Health", value: `${stats.averageHealth}%`, note: "High-confidence retrieval", icon: <ShieldCheck className="h-5 w-5" />, tone: "green" as const },
    { title: "Documents", value: stats.totalDocuments.toString(), note: "Policies, SOPs, and technical documents", icon: <FileText className="h-5 w-5" />, tone: "amber" as const },
    { title: "Questions", value: stats.totalQuestions.toString(), note: "Total historical inquiries", icon: <MessageCircleMore className="h-5 w-5" />, tone: "slate" as const },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary glow-text">Banking AI command center</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-white drop-shadow-md">Welcome back, Vikas</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-300">
            Monitor expert health, document readiness, and knowledge coverage across AURA with a single operating view.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <motion.div key={metric.title} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <MetricCard {...metric} />
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.6fr_0.9fr]">
        <PanelCard title="Knowledge coverage" subtitle="Current retrieval performance by banking domain">
          <div className="space-y-4">
            {[
              { label: "GDPR", percent: 96 },
              { label: "AMLD6", percent: 94 },
              { label: "MiFID II", percent: 92 },
              { label: "PSD2", percent: 89 },
            ].map((item) => (
              <div key={item.label}>
                <div className="mb-2 flex items-center justify-between text-sm text-slate-400">
                  <span>{item.label}</span>
                  <span className="font-semibold text-slate-100">{item.percent}%</span>
                </div>
                <div className="h-2 rounded-full bg-black/40 border border-white/10">
                  <div className="h-2 rounded-full bg-primary shadow-[0_0_10px_var(--primary)]" style={{ width: `${item.percent}%` }} />
                </div>
              </div>
            ))}
          </div>
        </PanelCard>

        <PanelCard title="Quick actions" subtitle="Operate the platform faster">
          <div className="space-y-3">
            {[
              { name: "Review pending approvals", detail: "3 expert changes waiting" },
              { name: "Upload new SOPs", detail: "8 documents ready for indexing" },
              { name: "Inspect AI answers", detail: "2 low confidence responses" },
            ].map((item) => (
              <div key={item.name} className="rounded-xl border border-white/10 glass-panel/5 p-3 transition hover:glass-panel/10">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
                  <Workflow className="h-4 w-4 text-primary" />
                  {item.name}
                </div>
                <p className="mt-1 text-sm text-slate-400">{item.detail}</p>
              </div>
            ))}
          </div>
        </PanelCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <PanelCard title="Recent uploads" subtitle="Most recent content indexed into the knowledge base">
          <div className="space-y-3">
            {isLoading ? (
              <div className="text-sm text-slate-400">Loading recent uploads...</div>
            ) : uploads.length === 0 ? (
              <div className="text-sm text-slate-400">No documents uploaded yet.</div>
            ) : (
              uploads.map((upload, i) => (
                <div key={upload.name + i} className="flex items-center justify-between rounded-xl border border-white/10 glass-panel/5 px-4 py-3 transition hover:glass-panel/10">
                  <div>
                    <p className="font-medium text-slate-200">{upload.name}</p>
                    <p className="text-sm text-slate-400">{upload.owner}</p>
                  </div>
                  <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400 shadow-[0_0_10px_-3px_#34d399]">{upload.status}</span>
                </div>
              ))
            )}
          </div>
        </PanelCard>

        <PanelCard title="Activity feed" subtitle="Recent platform events">
          <div className="space-y-3">
            {isLoading ? (
              <div className="text-sm text-slate-400">Loading recent activity...</div>
            ) : activity.length === 0 ? (
              <div className="text-sm text-slate-400">No recent activity found.</div>
            ) : (
              activity.map((item, i) => (
                <div key={item.title + i} className="rounded-xl border border-white/10 glass-panel/5 p-3 transition hover:glass-panel/10">
                  <p className="font-medium text-slate-200">{item.title}</p>
                  <p className="mt-1 text-sm text-slate-400">{item.detail}</p>
                  <p className="mt-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary">{item.time}</p>
                </div>
              ))
            )}
          </div>
        </PanelCard>
      </div>
    </div>
  );
}