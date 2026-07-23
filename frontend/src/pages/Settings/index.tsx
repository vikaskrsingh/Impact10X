import { BellRing, KeyRound, RefreshCw, ShieldCheck } from "lucide-react";
import { PanelCard } from "../../components/common/PanelCard";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getStoredRole, getStoredUsername } from "@/utils/auth";
import { motion } from "framer-motion";

const preferences = [
  { label: "Expert approval alerts", value: "On" },
  { label: "Knowledge updates", value: "On" },
  { label: "Weekly digest", value: "Email" },
];

const integrations = [
  { name: "Vertex AI", status: "Connected" },
  { name: "Google Cloud Storage", status: "Connected" },
  { name: "Slack", status: "Pending" },
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export default function Settings() {
  const role = getStoredRole();
  const username = getStoredUsername();
  const isAdmin = role === "admin";
  const displayName = username || (isAdmin ? "System Administrator" : "Compliance Expert");
  const displayInitials = displayName.substring(0, 2).toUpperCase();

  return (
    <motion.div 
      className="space-y-6 pb-10"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      <motion.div variants={itemVariants}>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary glow-text">Settings</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-100">Configure your workspace preferences</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-400">Tune alerts, integrations, and account preferences for the operational workspace.</p>
      </motion.div>

      <motion.div variants={itemVariants} className="grid gap-6 xl:grid-cols-3">
        <PanelCard title="Profile" subtitle="Regional and user preferences">
          <div className="rounded-xl bg-[#0b0f19]/50 border border-white/10 p-4 hover:border-white/20 transition-colors group">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 border border-primary/50 shadow-[0_0_15px_var(--primary)] group-hover:shadow-[0_0_20px_var(--primary)] transition-shadow">
                  <AvatarFallback className="text-xl text-primary bg-primary/20">
                    {displayInitials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-slate-100">
                    {displayName}
                  </p>
                  <p className="text-sm text-slate-400">
                    {isAdmin ? "Platform Admin" : "Knowledge Expert"}
                  </p>
                </div>
              </div>
            <div className="mt-4 rounded-xl border border-white/5 bg-[#131825] p-3 text-sm text-slate-400 flex items-center justify-between">
              <span>Preferred working hours</span>
              <span className="font-medium text-slate-200">08:00–18:00 GMT</span>
            </div>
          </div>
        </PanelCard>

        <PanelCard title="Notifications" subtitle="Keep teams aligned on approvals and uploads">
          <div className="space-y-3 text-sm text-slate-400">
            {preferences.map((item) => (
              <div key={item.label} className="flex items-center justify-between rounded-xl bg-[#0b0f19]/50 border border-white/10 px-4 py-3 hover:border-white/20 transition-colors">
                <span>{item.label}</span>
                <span className="font-semibold text-slate-200">{item.value}</span>
              </div>
            ))}
          </div>
        </PanelCard>

        <PanelCard title="Security & integrations" subtitle="Secure access tokens for integrations">
          <div className="space-y-3">
            {integrations.map((item) => (
              <div key={item.name} className="flex items-center justify-between rounded-xl bg-[#0b0f19]/50 border border-white/10 px-4 py-3 hover:border-white/20 transition-colors">
                <div className="flex items-center gap-3 text-sm font-semibold text-slate-200">
                  <div className="p-1.5 rounded-lg bg-primary/10 border border-primary/30 text-primary glow-border">
                    {item.name === "Vertex AI" ? <KeyRound className="h-4 w-4" /> : item.name === "Google Cloud Storage" ? <RefreshCw className="h-4 w-4" /> : <BellRing className="h-4 w-4" />}
                  </div>
                  {item.name}
                </div>
                <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider border ${item.status === "Connected" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20"}`}>
                  {item.status}
                </span>
              </div>
            ))}
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 mt-4 text-sm text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)] glow-border">
              <div className="flex items-center gap-2 font-semibold">
                <ShieldCheck className="h-4 w-4" />
                Secret rotation is enabled for production.
              </div>
            </div>
          </div>
        </PanelCard>
      </motion.div>
    </motion.div>
  );
}