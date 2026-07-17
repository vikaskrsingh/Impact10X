
import { motion } from "framer-motion";
import { Bot, Search, Sparkles, Trash2, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { PanelCard } from "../../components/common/PanelCard";
import { getStoredRole, isAdminRole } from "@/utils/auth";
import { createAgent, deleteAgent, getAgents } from "../../services/auraApi";

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
  const [experts, setExperts] = useState<Expert[]>([]);
  const [newName, setNewName] = useState("");
  const [newOwner, setNewOwner] = useState("Risk");
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
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary glow-text">AI Expert Hub</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-100">Domain experts for private banking</h1>
          <p className="mt-2 text-sm text-slate-400">Manage expert agents and the knowledge workspaces they power across the platform.</p>
        </div>
        {isAdmin ? (
          <div className="flex items-center gap-2">
            <Input value={newName} onChange={(event) => setNewName(event.target.value)} placeholder="New expert name" className="w-48" />
            <select value={newOwner} onChange={(event) => setNewOwner(event.target.value)} className="rounded-md border border-slate-200 glass-panel px-3 py-2 text-sm text-slate-300">
              <option value="Data Protection">Data Protection</option>
              <option value="Risk">Risk</option>
              <option value="Compliance">Compliance</option>
              <option value="Fraud">Fraud</option>
            </select>
            <button onClick={() => void handleCreate()} className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-blue-700">
              Create expert
            </button>
          </div>
        ) : null}
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 glass-panel p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div className="relative max-w-xl flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input placeholder="Search experts by domain or owner" className="pl-9" />
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Sparkles className="h-4 w-4 text-primary glow-text" />
          {experts.length} experts with approved access
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {experts.map((expert, index) => (
          <motion.div key={expert.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
            <PanelCard title={expert.name} subtitle={`Owner • ${expert.owner}`} actions={<span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">{expert.status}</span>}>
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <Bot className="h-4 w-4 text-primary glow-text" />
                  Managed agent for {expert.owner.toLowerCase()} operations
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl glass-panel/5 border border-white/10 p-3">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Documents</p>
                    <p className="mt-1 text-lg font-semibold text-slate-100">{expert.documents}</p>
                  </div>
                  <div className="rounded-xl glass-panel/5 border border-white/10 p-3">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Questions</p>
                    <p className="mt-1 text-lg font-semibold text-slate-100">{expert.questions}</p>
                  </div>
                  <div className="rounded-xl glass-panel/5 border border-white/10 p-3">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Health</p>
                    <p className="mt-1 text-lg font-semibold text-slate-100">{expert.health}%</p>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3 border-t border-slate-200 pt-4 text-sm text-slate-400">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Agent workspace ready
                  </div>
                  <div className="flex items-center gap-2">
                    <Link to={`/workspace?expert=${expert.id}`} className="inline-flex items-center justify-center rounded-md border border-slate-300 glass-panel px-3 py-2 text-sm font-medium text-slate-300 transition hover:glass-panel/5 border border-white/10">
                      Chat
                    </Link>
                    {isAdmin ? (
                      <button onClick={() => void handleDelete(expert.id)} className="inline-flex items-center gap-2 rounded-md border border-rose-200 px-3 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-50">
                        <Trash2 className="h-4 w-4" />
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