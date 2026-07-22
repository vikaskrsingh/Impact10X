import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Bot,
  FileText,
  MessageCircleMore,
  ShieldCheck,
  Workflow,
  Search,
  UploadCloud,
  Activity,
  FileJson,
  CheckCircle2,
  Clock,
  AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { MetricCard, PanelCard } from "../components/common/PanelCard";
import { getStoredRole, isAdminRole, getStoredUsername } from "@/utils/auth";
import { useEffect, useState } from "react";
import { getDashboardStats, getRecentActivity, getRecentUploads, getAgents } from "../services/omnimindApi";
import type { DashboardStats, DashboardActivity, DashboardUpload, AgentRecord } from "../services/omnimindApi";

export default function Dashboard() {
  const role = getStoredRole();
  const isAdmin = isAdminRole(role);
  const username = getStoredUsername() || "System Administrator";

  const [stats, setStats] = useState<DashboardStats>({
    totalExperts: 0,
    averageHealth: 0,
    totalDocuments: 0,
    totalQuestions: 0,
  });
  const [activity, setActivity] = useState<DashboardActivity[]>([]);
  const [uploads, setUploads] = useState<DashboardUpload[]>([]);
  const [agents, setAgents] = useState<AgentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [statsData, activityData, uploadsData, agentsData] = await Promise.all([
          getDashboardStats(),
          getRecentActivity(),
          getRecentUploads(),
          getAgents()
        ]);
        setStats(statsData);
        setActivity(activityData);
        setUploads(uploadsData);
        setAgents(agentsData);
      } catch (error) {
        console.error("Failed to load dashboard data", error);
      } finally {
        setIsLoading(false);
      }
    }
    void loadData();
  }, []);

  const metrics = [
    { title: "AI Experts", value: stats.totalExperts.toString(), note: "Total onboarded expert agents", icon: <Bot className="h-6 w-6" />, tone: "blue" as const },
    { title: "Knowledge Health", value: `${stats.averageHealth}%`, note: "High-confidence retrieval", icon: <ShieldCheck className="h-6 w-6" />, tone: "green" as const },
    { title: "Documents", value: stats.totalDocuments.toString(), note: "Policies, SOPs, and technical documents", icon: <FileText className="h-6 w-6" />, tone: "amber" as const },
    { title: "Questions", value: stats.totalQuestions.toString(), note: "Total historical inquiries", icon: <MessageCircleMore className="h-6 w-6" />, tone: "slate" as const },
  ];

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'indexed': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'processing': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'failed': return 'bg-red-500/10 text-red-400 border-red-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">

      {/* Hero Section */}
      <div className="relative rounded-2xl bg-[#06080d] border border-white/5 p-8 overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 blur-[100px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/5 blur-[80px] rounded-full pointer-events-none" />

        <div className="relative z-10">
          <p className="text-xs font-bold tracking-[0.2em] text-purple-400 uppercase mb-3">Enterprise Banking AI Command Center</p>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-4">Welcome, {username}</h1>
          <p className="max-w-2xl text-sm text-slate-400 leading-relaxed">
            Monitor expert health, document readiness, and knowledge coverage across your global banking operations. Everything is running smoothly.
          </p>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric, i) => (
          <motion.div key={metric.title} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <MetricCard {...metric} />
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        {/* Knowledge Coverage -> Average Confidence Score */}
        <PanelCard title="Average Confidence Score" subtitle="AI retrieval confidence by banking domain">
          <div className="space-y-6 pt-2">
            {(agents.length > 0 ? agents.map((agent, i) => ({
              label: agent.name,
              percent: agent.health,
              color: ["bg-purple-500", "bg-emerald-400", "bg-amber-400", "bg-blue-400"][i % 4]
            })) : [
              { label: "Retail Banking", percent: 0, color: "bg-purple-500" },
            ]).map((item) => (
              <div key={item.label} className="group">
                <div className="mb-2.5 flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-300 group-hover:text-white transition">{item.label}</span>
                  <span className="text-white">{item.percent}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-[#131825] border border-white/5 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${item.percent}%` }}
                    transition={{ duration: 1, delay: 0.2 }}
                    className={`h-full rounded-full ${item.color} shadow-[0_0_10px_rgba(255,255,255,0.2)]`}
                  />
                </div>
              </div>
            ))}
          </div>
        </PanelCard>

        {/* Quick Actions Grid -> System Shortcuts */}
        <PanelCard title="System Shortcuts" subtitle="Jump to platform management">
          <div className="grid grid-cols-2 gap-3 pt-1">
            {[
              { name: "Manage Agents", icon: Bot, color: "text-purple-400", bg: "bg-purple-500/10", border: "hover:border-purple-500/30", path: "/experts" },
              { name: "Doc Library", icon: UploadCloud, color: "text-blue-400", bg: "bg-blue-500/10", border: "hover:border-blue-500/30", path: "/knowledge" },
              { name: "Audit Logs", icon: ShieldCheck, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "hover:border-emerald-500/30", path: "/governance" },
              { name: "Manage Roles", icon: CheckCircle2, color: "text-amber-400", bg: "bg-amber-500/10", border: "hover:border-amber-500/30", path: "/settings" },
            ].map((item) => (
              <Link key={item.name} to={item.path} className={`flex flex-col items-center justify-center gap-3 rounded-xl border border-white/5 bg-[#131825] p-5 transition-all hover:bg-white/5 ${item.border}`}>
                <div className={`p-3 rounded-xl ${item.bg} ${item.color}`}>
                  <item.icon size={24} />
                </div>
                <span className="text-xs font-semibold text-slate-300">{item.name}</span>
              </Link>
            ))}
          </div>
        </PanelCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">

        {/* Recent Uploads */}
        <PanelCard title="Recent uploads" subtitle="Latest documents indexed into the knowledge base">
          <div className="space-y-2 pt-1">
            {isLoading ? (
              <div className="text-xs text-slate-500 font-medium">Loading recent uploads...</div>
            ) : uploads.length === 0 ? (
              <div className="text-xs text-slate-500 font-medium">No documents uploaded yet.</div>
            ) : (
              uploads.slice(0, 4).map((upload, i) => (
                <div key={upload.name + i} className="flex items-center justify-between rounded-xl border border-white/5 bg-[#131825] px-4 py-3.5 transition hover:bg-white/5 group cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded bg-slate-500/10 text-slate-400">
                      <FileJson size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-200 group-hover:text-white transition">{upload.name}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{upload.owner}</p>
                    </div>
                  </div>
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${getStatusColor(upload.status)}`}>
                    {upload.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </PanelCard>

        {/* Activity Feed */}
        <PanelCard title="Activity feed" subtitle="Recent platform events">
          <div className="space-y-2 pt-1">
            {isLoading ? (
              <div className="text-xs text-slate-500 font-medium">Loading recent activity...</div>
            ) : activity.length === 0 ? (
              <div className="text-xs text-slate-500 font-medium">No recent activity found.</div>
            ) : (
              activity.slice(0, 4).map((item, i) => (
                <div key={item.title + i} className="flex items-start gap-4 rounded-xl border border-white/5 bg-[#131825] p-4 transition hover:bg-white/5">
                  <div className="mt-0.5 p-1.5 rounded-full bg-purple-500/10 text-purple-400">
                    <Activity size={14} />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-slate-200">{item.title}</p>
                    <p className="mt-1 text-xs text-slate-400 leading-relaxed">{item.detail}</p>
                    <div className="mt-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                      <Clock size={10} /> {item.time}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </PanelCard>
      </div>
    </div>
  );
}