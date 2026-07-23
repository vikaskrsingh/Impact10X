import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Clock3, AlertTriangle, Users, CheckCircle2, Search, Save, ChevronDown, ChevronUp } from "lucide-react";
import { PanelCard } from "../../components/common/PanelCard";
import { getUsers, getAgents, updateUserAccess } from "../../services/omnimindApi";
import type { User, AgentRecord } from "../../services/omnimindApi";

const approvals = [
  { title: "Payments Fraud policy pack", detail: "Awaiting second approver", state: "Pending" },
  { title: "KYC onboarding SOP", detail: "Approved by DPO", state: "Approved" },
  { title: "AML Treasury controls", detail: "Pending legal review", state: "In Review" },
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
} as const;

export default function Governance() {
  const [users, setUsers] = useState<User[]>([]);
  const [agents, setAgents] = useState<AgentRecord[]>([]);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [selectedAgents, setSelectedAgents] = useState<Record<string, boolean>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [fetchedUsers, fetchedAgents] = await Promise.all([
        getUsers(),
        getAgents()
      ]);
      setUsers(fetchedUsers);
      setAgents(fetchedAgents);
    } catch (e) {
      console.error("Failed to fetch data for governance", e);
    }
  };

  const handleExpand = (user: User) => {
    if (expandedUser === user.username) {
      setExpandedUser(null);
      return;
    }
    
    // Initialize checkboxes
    const state: Record<string, boolean> = {};
    agents.forEach(a => {
      state[a.id] = user.role === 'admin' ? true : user.allowed_agents.includes(a.id);
    });
    setSelectedAgents(state);
    setExpandedUser(user.username);
  };

  const handleCheckboxChange = (agentId: string) => {
    setSelectedAgents(prev => ({
      ...prev,
      [agentId]: !prev[agentId]
    }));
  };

  const handleSave = async (user: User) => {
    if (user.role === 'admin') return; // Admins have full access
    setIsSaving(true);
    try {
      const allowed = Object.entries(selectedAgents)
        .filter(([_, isSelected]) => isSelected)
        .map(([id]) => id);
      await updateUserAccess(user.username, allowed);
      await fetchData();
      setExpandedUser(null);
    } catch (e) {
      console.error("Failed to save access", e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div className="space-y-8 pb-10" variants={containerVariants} initial="hidden" animate="show">
      <motion.div variants={itemVariants}>
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-purple-400">Governance & Security</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">Roles & Permissions</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-400">Manage organizational access boundaries and track real-time compliance activity.</p>
      </motion.div>

      {/* Top KPI Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#0b0f19] border border-white/5 rounded-xl p-5 relative overflow-hidden group hover:border-purple-500/30 transition-colors">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Users size={64} className="text-purple-400" />
          </div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-500/20 rounded-lg text-purple-400"><Users size={16} /></div>
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Active Permissions</h3>
          </div>
          <p className="text-3xl font-bold text-white mt-4">{users.length}</p>
          <p className="text-xs text-emerald-400 mt-2 font-medium">Total Users</p>
        </div>
        
        <div className="bg-[#0b0f19] border border-white/5 rounded-xl p-5 relative overflow-hidden group hover:border-amber-500/30 transition-colors">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <ShieldCheck size={64} className="text-amber-400" />
          </div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-amber-500/20 rounded-lg text-amber-400"><ShieldCheck size={16} /></div>
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Pending Sign-offs</h3>
          </div>
          <p className="text-3xl font-bold text-white mt-4">8</p>
          <p className="text-xs text-amber-400 mt-2 font-medium">Requires attention</p>
        </div>

        <div className="bg-[#0b0f19] border border-white/5 rounded-xl p-5 relative overflow-hidden group hover:border-rose-500/30 transition-colors">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <AlertTriangle size={64} className="text-rose-400" />
          </div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-rose-500/20 rounded-lg text-rose-400"><AlertTriangle size={16} /></div>
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Security Alerts</h3>
          </div>
          <p className="text-3xl font-bold text-white mt-4">2</p>
          <p className="text-xs text-rose-400 mt-2 font-medium">1 High Severity</p>
        </div>
      </motion.div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <motion.div variants={itemVariants}>
          <PanelCard title="Access Controls" subtitle="Manage roles across the banking knowledge estate">
            <div className="space-y-3">
              {users.map((row) => (
                <div key={row.id} className="flex flex-col rounded-xl border border-white/5 bg-[#0b0f19]/50 overflow-hidden">
                  <div 
                    onClick={() => handleExpand(row)}
                    className="group flex flex-col gap-3 hover:bg-[#131825] transition-colors p-4 md:flex-row md:items-center md:justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 text-indigo-400 font-bold text-sm border border-indigo-500/20">
                        {row.username.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-200 group-hover:text-white transition-colors">{row.username}</p>
                        <p className="text-xs text-slate-400 font-medium capitalize">Role: {row.role}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="rounded-md bg-slate-800/50 border border-slate-700 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {row.role === "admin" ? "Full Access" : "Restricted"}
                      </span>
                      {expandedUser === row.username ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                    </div>
                  </div>
                  
                  <AnimatePresence>
                    {expandedUser === row.username && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-white/5 bg-black/20 overflow-hidden"
                      >
                        <div className="p-5">
                          <h4 className="text-sm font-semibold text-slate-300 mb-4">Assigned AI Agents</h4>
                          
                          {row.role === "admin" ? (
                            <p className="text-sm text-slate-400 italic">Administrators have access to all agents automatically.</p>
                          ) : (
                            <div className="space-y-4">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {agents.map(agent => (
                                  <label key={agent.id} className="flex items-center gap-3 p-3 rounded-lg border border-white/5 bg-[#0b0f19] cursor-pointer hover:border-primary/30 transition-colors">
                                    <input 
                                      type="checkbox" 
                                      checked={!!selectedAgents[agent.id]}
                                      onChange={() => handleCheckboxChange(agent.id)}
                                      className="rounded border-slate-600 bg-slate-800 text-primary focus:ring-primary"
                                    />
                                    <span className="text-sm font-medium text-slate-200">{agent.name}</span>
                                  </label>
                                ))}
                              </div>
                              <div className="flex justify-end pt-2">
                                <button 
                                  onClick={() => handleSave(row)}
                                  disabled={isSaving}
                                  className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-black transition hover:bg-primary/90 glow-border"
                                >
                                  <Save size={16} />
                                  {isSaving ? "Saving..." : "Save Access"}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </PanelCard>
        </motion.div>

        <motion.div variants={itemVariants}>
          <PanelCard title="Approval Workflow" subtitle="Knowledge approvals and policy sign-off">
            <div className="space-y-3">
              {approvals.map((item, idx) => (
                <div key={idx} className="rounded-xl border border-white/5 bg-[#0b0f19]/50 p-4 hover:border-white/10 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex gap-3">
                      <div className={`mt-0.5 rounded-full p-1.5 ${item.state === 'Approved' ? 'bg-emerald-500/20 text-emerald-400' : item.state === 'In Review' ? 'bg-purple-500/20 text-purple-400' : 'bg-amber-500/20 text-amber-400'}`}>
                        {item.state === 'Approved' ? <CheckCircle2 size={14} /> : item.state === 'In Review' ? <Search size={14} /> : <Clock3 size={14} />}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-200">{item.title}</p>
                        <p className="mt-1 text-xs font-medium text-slate-400">{item.detail}</p>
                      </div>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest border ${item.state === 'Approved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : item.state === 'In Review' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
                      {item.state}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </PanelCard>
        </motion.div>
      </div>
    </motion.div>
  );
}