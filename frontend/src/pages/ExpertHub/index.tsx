
import { motion } from "framer-motion";
import { Bot, Search, Sparkles, Trash2, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { PanelCard } from "../../components/common/PanelCard";
import { getStoredRole, isAdminRole } from "@/utils/auth";
import { createAgent, deleteAgent, getAgents } from "../../services/omnimindApi";

type Expert = {
  id: string;
  name: string;
  owner: string;
  documents: number;
  questions: number;
  health: number;
  status: string;
};

export default function ExpertHub() {
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [experts, setExperts] = useState<Expert[]>([]);
  const [newName, setNewName] = useState("");
  const [newOwner, setNewOwner] = useState("Compliance Team");

  useEffect(() => {
    const q = searchParams.get("q");
    if (q !== null) {
      setSearchQuery(q);
    }
  }, [searchParams]);

  const filteredExperts = experts.filter(
    (expert) => 
      expert.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      expert.owner.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const role = getStoredRole();
  const isAdmin = isAdminRole(role);

  useEffect(() => {
    void loadExperts();
  }, []);

  const loadExperts = async () => {
    try {
      const agents = await getAgents();
      setExperts(
        agents.map((agent) => ({
          id: agent.id,
          name: agent.name,
          owner: agent.owner,
          documents: agent.documents,
          questions: agent.questions,
          health: agent.health,
          status: agent.status,
        }))
      );
    } catch (error) {
      console.error("Unable to load experts", error);
    }
  };

  const handleCreate = async () => {
    const safeName = newName.trim();
    if (!safeName) {
      return;
    }

    try {
      const newExpert = await createAgent(safeName, newOwner);
      setExperts((current) => [{
        id: newExpert.id,
        name: newExpert.name,
        owner: newExpert.owner,
        documents: newExpert.documents,
        questions: newExpert.questions,
        health: newExpert.health,
        status: newExpert.status,
      }, ...current]);
      setNewName("");
      setNewOwner("Risk");
    } catch (error) {
      console.error("Unable to create expert", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this expert?")) return;
    try {
      await deleteAgent(id);
      setExperts((current) => current.filter((expert) => expert.id !== id));
    } catch (error) {
      console.error("Unable to delete expert", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-purple-400 glow-text">AI Expert Hub</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-100">Domain experts for private banking</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">Manage expert agents and the knowledge workspaces they power across the platform.</p>
        </div>
        {isAdmin ? (
          <div className="flex items-center gap-2">
            <Input value={newName} onChange={(event) => setNewName(event.target.value)} placeholder="New expert name" className="w-48 bg-transparent border-white/10 text-slate-200 focus:border-purple-500/50 placeholder:text-slate-500" />
            <select value={newOwner} onChange={(event) => setNewOwner(event.target.value)} className="rounded-md border border-white/10 bg-[#131825] px-3 py-2 text-sm text-slate-300 focus:border-purple-500/50 focus:outline-none">
              <option value="Compliance Team">Compliance Team</option>
              <option value="Risk & Compliance">Risk & Compliance</option>
              <option value="Regulatory Board">Regulatory Board</option>
              <option value="Payments Processing">Payments Processing</option>
              <option value="Enterprise Risk">Enterprise Risk</option>
              <option value="Sustainability">Sustainability</option>
              <option value="Wealth Management">Wealth Management</option>
            </select>
            <button onClick={() => void handleCreate()} className="rounded-md bg-purple-600 px-4 py-2 text-sm font-semibold text-white transition duration-300 hover:bg-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.4)] hover:shadow-[0_0_25px_rgba(168,85,247,0.6)]">
              Create expert
            </button>
          </div>
        ) : null}
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-white/5 bg-[#131825] p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between transition hover:bg-white/5">
        <div className="relative max-w-xl flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search experts by domain or owner" 
            className="pl-9 bg-transparent border-white/10 text-slate-200 focus:border-purple-500/50 placeholder:text-slate-500" 
          />
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Sparkles className="h-4 w-4 text-purple-400 glow-text" />
          {filteredExperts.length} experts with approved access
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {filteredExperts.map((expert, index) => (
          <motion.div key={expert.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
            <PanelCard title={expert.name} subtitle={`Owner • ${expert.owner}`} actions={<span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 text-[10px] font-bold tracking-wider text-emerald-400 uppercase">{expert.status}</span>}>
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <Bot className="h-4 w-4 text-purple-400 glow-text" />
                  Managed agent for {expert.owner.toLowerCase()} operations
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl bg-white/5 border border-white/10 p-3 hover:bg-white/10 transition duration-300">
                    <p className="text-[10px] uppercase tracking-[0.2em] font-semibold text-slate-500">Documents</p>
                    <p className="mt-1 text-lg font-bold text-slate-200">{expert.documents}</p>
                  </div>
                  <div className="rounded-xl bg-white/5 border border-white/10 p-3 hover:bg-white/10 transition duration-300">
                    <p className="text-[10px] uppercase tracking-[0.2em] font-semibold text-slate-500">Questions</p>
                    <p className="mt-1 text-lg font-bold text-slate-200">{expert.questions}</p>
                  </div>
                  <div className="rounded-xl bg-white/5 border border-white/10 p-3 hover:bg-white/10 transition duration-300">
                    <p className="text-[10px] uppercase tracking-[0.2em] font-semibold text-slate-500">Health</p>
                    <p className="mt-1 text-lg font-bold text-slate-200">{expert.health}%</p>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3 border-t border-white/10 pt-4 text-sm text-slate-400">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-slate-500" />
                    <span className="text-xs">Agent workspace ready</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link to={`/workspace?expert=${expert.id}`} className="inline-flex items-center justify-center rounded-md border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-200 transition hover:bg-white/10 hover:text-white">
                      Chat
                    </Link>
                    {isAdmin ? (
                      <button onClick={() => void handleDelete(expert.id)} className="inline-flex items-center gap-2 rounded-md border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-400 transition hover:bg-rose-500/20 hover:text-rose-300">
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            </PanelCard>
          </motion.div>
        ))}
      </div>
    </div>
  );
}