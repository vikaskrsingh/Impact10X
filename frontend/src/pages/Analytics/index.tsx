import { Activity, Clock, ShieldCheck, Database, FileText, Server, Lock, AlertOctagon } from "lucide-react";
import { useEffect, useState } from "react";
import { PanelCard } from "../../components/common/PanelCard";
import { getRecentActivity, getAgents, type DashboardActivity, type AgentRecord } from "../../services/omnimindApi";
import { motion, AnimatePresence } from "framer-motion";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
} as const;

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
    <motion.div 
      className="space-y-8 max-w-7xl mx-auto pb-10"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      <motion.div variants={itemVariants}>
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-cyan-400">Security & Infrastructure</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">Audit Logs & Activity</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-400">Monitor system events, agent updates, and security logs across the enterprise banking platform.</p>
      </motion.div>

      {/* Top KPI Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#0b0f19] border border-white/5 rounded-xl p-5 relative overflow-hidden group hover:border-cyan-500/30 transition-colors">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Server size={64} className="text-cyan-400" />
          </div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-cyan-500/20 rounded-lg text-cyan-400"><Server size={16} /></div>
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">System Uptime</h3>
          </div>
          <p className="text-3xl font-bold text-white mt-4">99.99%</p>
          <div className="flex items-center gap-2 mt-2">
            <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-cyan-400 w-[99%]" />
            </div>
            <p className="text-xs text-cyan-400 font-medium">Stable</p>
          </div>
        </div>

        <div className="bg-[#0b0f19] border border-white/5 rounded-xl p-5 relative overflow-hidden group hover:border-purple-500/30 transition-colors">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Lock size={64} className="text-purple-400" />
          </div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-500/20 rounded-lg text-purple-400"><Lock size={16} /></div>
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Encrypted Queries</h3>
          </div>
          <p className="text-3xl font-bold text-white mt-4">1.2M</p>
          <p className="text-xs text-purple-400 mt-2 font-medium">+150k this month</p>
        </div>

        <div className="bg-[#0b0f19] border border-white/5 rounded-xl p-5 relative overflow-hidden group hover:border-emerald-500/30 transition-colors">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <AlertOctagon size={64} className="text-emerald-400" />
          </div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-400"><AlertOctagon size={16} /></div>
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Threats Blocked</h3>
          </div>
          <p className="text-3xl font-bold text-white mt-4">0</p>
          <p className="text-xs text-emerald-400 mt-2 font-medium">Zero incidents reported</p>
        </div>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        
        {/* Audit Log Stream */}
        <motion.div variants={itemVariants}>
          <PanelCard title="System Event Stream" subtitle="Real-time chronological audit of all platform actions">
            <div className="space-y-3 pt-2 h-[500px] overflow-y-auto custom-scrollbar pr-2">
              <AnimatePresence>
                {isLoading ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex justify-center p-8 text-slate-500 font-medium">Loading audit logs...</motion.div>
                ) : logs.length === 0 ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex justify-center p-8 text-slate-500 font-medium">No recent activity found.</motion.div>
                ) : (
                  logs.map((log, i) => (
                    <motion.div 
                      key={i} 
                      initial={{ opacity: 0, x: -10 }} 
                      animate={{ opacity: 1, x: 0 }} 
                      transition={{ delay: i * 0.05 }}
                      className="flex items-start gap-4 rounded-xl border border-white/5 bg-[#0b0f19]/50 p-4 transition-colors hover:bg-[#131825] group cursor-pointer"
                    >
                      <div className="mt-0.5 p-2 rounded-full bg-gradient-to-br from-cyan-500/20 to-purple-500/20 text-cyan-400 group-hover:scale-110 transition-transform border border-cyan-500/20 shadow-[0_0_15px_rgba(34,211,238,0.1)]">
                        <Activity size={16} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-slate-200 group-hover:text-white transition-colors">{log.title}</p>
                        <p className="mt-1 text-xs font-medium text-slate-400 leading-relaxed">{log.detail}</p>
                        <div className="mt-3 flex flex-wrap items-center gap-3 text-[10px] font-bold uppercase tracking-wider">
                          <span className="flex items-center gap-1.5 text-slate-500 bg-white/5 px-2 py-1 rounded border border-white/5">
                            <Clock size={12} /> {log.time}
                          </span>
                          <span className="flex items-center gap-1.5 text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20 shadow-[0_0_8px_rgba(52,211,153,0.1)]">
                            <ShieldCheck size={12} /> VERIFIED
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </PanelCard>
        </motion.div>

        {/* Active Agents Snapshot */}
        <motion.div variants={itemVariants} className="space-y-6">
          <PanelCard title="Monitored Agents" subtitle="Agents currently under audit surveillance">
            <div className="space-y-3 pt-2">
              <AnimatePresence>
                {isLoading ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-xs text-slate-500 font-medium">Loading agents...</motion.div>
                ) : (
                  agents.slice(0, 5).map((agent, i) => (
                    <motion.div 
                      key={agent.id} 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-center justify-between rounded-xl border border-white/5 bg-[#0b0f19]/50 p-3 hover:bg-[#131825] transition-colors cursor-pointer group"
                    >
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-200 group-hover:text-white transition-colors">{agent.name}</span>
                        <span className="text-[10px] font-medium text-slate-500 mt-0.5">{agent.owner}</span>
                      </div>
                      <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[9px] font-bold text-emerald-400 border border-emerald-500/20 tracking-widest shadow-[0_0_8px_rgba(52,211,153,0.1)]">
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
                        SECURE
                      </span>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </PanelCard>
          
          <PanelCard title="System Diagnostics" subtitle="Current platform stability metrics">
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="rounded-xl border border-white/5 bg-[#0b0f19]/50 p-4 flex flex-col items-center justify-center text-center hover:bg-[#131825] transition-colors">
                <Database className="w-5 h-5 text-purple-400 mb-2" />
                <span className="text-lg font-bold text-white">99.9%</span>
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mt-1">Uptime</span>
              </div>
              <div className="rounded-xl border border-white/5 bg-[#0b0f19]/50 p-4 flex flex-col items-center justify-center text-center hover:bg-[#131825] transition-colors">
                <FileText className="w-5 h-5 text-cyan-400 mb-2" />
                <span className="text-lg font-bold text-white">12,408</span>
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mt-1">Total Logs</span>
              </div>
            </div>
          </PanelCard>
        </motion.div>
      </div>
    </motion.div>
  );
}