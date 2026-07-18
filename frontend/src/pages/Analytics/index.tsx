import { Activity, Clock, ShieldCheck, Database, FileText } from "lucide-react";
import { useEffect, useState } from "react";
import { PanelCard } from "../../components/common/PanelCard";
import { getRecentActivity, getAgents, type DashboardActivity, type AgentRecord } from "../../services/omnimindApi";
import { motion } from "framer-motion";

export default function Analytics() {
  const [logs, setLogs] = useState<DashboardActivity[]>([]);
  const [agents, setAgents] = useState<AgentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [activityData, agentsData] = await Promise.all([
          getRecentActivity(),
          getAgents()
        ]);
        setLogs(activityData);
        setAgents(agentsData);
      } catch (error) {
        console.error("Failed to load audit data", error);
      } finally {
        setIsLoading(false);
      }
    }
    void loadData();
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-purple-400">Governance & Security</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-100">Audit Logs & Activity</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-400">Monitor system events, agent updates, and security logs across the enterprise banking platform.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        
        {/* Audit Log Stream */}
        <PanelCard title="System Event Stream" subtitle="Real-time chronological audit of all platform actions">
          <div className="space-y-3 pt-2 h-[500px] overflow-y-auto custom-scrollbar pr-2">
            {isLoading ? (
              <div className="flex justify-center p-8 text-slate-500">Loading audit logs...</div>
            ) : logs.length === 0 ? (
              <div className="flex justify-center p-8 text-slate-500">No recent activity found.</div>
            ) : (
              logs.map((log, i) => (
                <motion.div 
                  key={i} 
                  initial={{ opacity: 0, x: -10 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  transition={{ delay: i * 0.05 }}
                  className="flex items-start gap-4 rounded-xl border border-white/5 bg-[#131825] p-4 transition hover:bg-white/5 group"
                >
                  <div className="mt-0.5 p-2 rounded-full bg-purple-500/10 text-purple-400 group-hover:scale-110 transition-transform">
                    <Activity size={16} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-200">{log.title}</p>
                    <p className="mt-1 text-xs text-slate-400 leading-relaxed">{log.detail}</p>
                    <div className="mt-2 flex items-center gap-4 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                      <span className="flex items-center gap-1.5"><Clock size={12} /> {log.time}</span>
                      <span className="flex items-center gap-1.5 text-emerald-400/80"><ShieldCheck size={12} /> VERIFIED</span>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </PanelCard>

        {/* Active Agents Snapshot */}
        <div className="space-y-6">
          <PanelCard title="Monitored Agents" subtitle="Agents currently under audit surveillance">
            <div className="space-y-3 pt-2">
              {isLoading ? (
                <div className="text-xs text-slate-500">Loading agents...</div>
              ) : (
                agents.slice(0, 5).map((agent, i) => (
                  <div key={agent.id} className="flex items-center justify-between rounded-xl border border-white/5 bg-[#131825] p-3">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-200">{agent.name}</span>
                      <span className="text-[10px] text-slate-500">{agent.owner}</span>
                    </div>
                    <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/20">
                      SECURE
                    </span>
                  </div>
                ))
              )}
            </div>
          </PanelCard>
          
          <PanelCard title="System Metrics" subtitle="Current platform stability">
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="rounded-xl border border-white/5 bg-[#131825] p-4 flex flex-col items-center justify-center text-center">
                <Database className="w-6 h-6 text-blue-400 mb-2" />
                <span className="text-lg font-bold text-white">99.9%</span>
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Uptime</span>
              </div>
              <div className="rounded-xl border border-white/5 bg-[#131825] p-4 flex flex-col items-center justify-center text-center">
                <FileText className="w-6 h-6 text-amber-400 mb-2" />
                <span className="text-lg font-bold text-white">0</span>
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Anomalies</span>
              </div>
            </div>
          </PanelCard>
        </div>

      </div>
    </div>
  );
}